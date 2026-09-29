package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/qwetls/tokenflow/common"
	"github.com/qwetls/tokenflow/constant"
	"github.com/qwetls/tokenflow/model"
)

// Mirrors relay/channel/antigravity.OAuthKey. Kept local because service
// cannot import the relay channel packages (relay/helper imports service).
type AntigravityOAuthKey struct {
	AccessToken  string `json:"access_token,omitempty"`
	RefreshToken string `json:"refresh_token,omitempty"`
	ProjectID    string `json:"project_id,omitempty"`
	Tier         string `json:"tier,omitempty"`
	Email        string `json:"email,omitempty"`
	Expired      string `json:"expired,omitempty"`
	LastRefresh  string `json:"last_refresh,omitempty"`
}

// OAuth client credentials embedded in the Antigravity IDE distribution.
const (
	antigravityOAuthClientId     = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com"
	antigravityOAuthClientSecret = "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"
	antigravityOAuthTokenURL     = "https://oauth2.googleapis.com/token"
)

type AntigravityCredentialRefreshOptions struct {
	ResetCaches bool
}

func parseAntigravityOAuthKey(raw string) (*AntigravityOAuthKey, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, errors.New("antigravity channel: empty oauth key")
	}
	var key AntigravityOAuthKey
	if err := json.Unmarshal([]byte(raw), &key); err != nil {
		return nil, errors.New("antigravity channel: invalid oauth key json")
	}
	return &key, nil
}

func refreshAntigravityAccessToken(ctx context.Context, refreshToken string) (string, time.Time, error) {
	if strings.TrimSpace(refreshToken) == "" {
		return "", time.Time{}, errors.New("antigravity channel: refresh_token is required")
	}

	form := url.Values{
		"client_id":     {antigravityOAuthClientId},
		"client_secret": {antigravityOAuthClientSecret},
		"refresh_token": {refreshToken},
		"grant_type":    {"refresh_token"},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, antigravityOAuthTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", time.Time{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("antigravity channel: token refresh request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", time.Time{}, err
	}
	if resp.StatusCode != http.StatusOK {
		return "", time.Time{}, fmt.Errorf("antigravity channel: token refresh failed (%d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var tr struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.Unmarshal(body, &tr); err != nil {
		return "", time.Time{}, fmt.Errorf("antigravity channel: invalid token refresh response: %w", err)
	}
	if strings.TrimSpace(tr.AccessToken) == "" {
		return "", time.Time{}, errors.New("antigravity channel: token refresh response has no access_token")
	}

	return tr.AccessToken, time.Now().Add(time.Duration(tr.ExpiresIn) * time.Second), nil
}

func RefreshAntigravityChannelCredential(ctx context.Context, channelID int, opts AntigravityCredentialRefreshOptions) (*AntigravityOAuthKey, *model.Channel, error) {
	ch, err := model.GetChannelById(channelID, true)
	if err != nil {
		return nil, nil, err
	}
	if ch == nil {
		return nil, nil, fmt.Errorf("channel not found")
	}
	if ch.Type != constant.ChannelTypeAntigravity {
		return nil, nil, fmt.Errorf("channel type is not Antigravity")
	}

	oauthKey, err := parseAntigravityOAuthKey(strings.TrimSpace(ch.Key))
	if err != nil {
		return nil, nil, err
	}
	if strings.TrimSpace(oauthKey.RefreshToken) == "" {
		return nil, nil, fmt.Errorf("antigravity channel: refresh_token is required to refresh credential")
	}

	refreshCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	accessToken, expiresAt, err := refreshAntigravityAccessToken(refreshCtx, oauthKey.RefreshToken)
	if err != nil {
		return nil, nil, err
	}

	oauthKey.AccessToken = accessToken
	oauthKey.LastRefresh = time.Now().Format(time.RFC3339)
	oauthKey.Expired = expiresAt.Format(time.RFC3339)

	encoded, err := common.Marshal(oauthKey)
	if err != nil {
		return nil, nil, err
	}

	if err := model.DB.Model(&model.Channel{}).Where("id = ?", ch.Id).Update("key", string(encoded)).Error; err != nil {
		return nil, nil, err
	}

	if opts.ResetCaches {
		model.InitChannelCache()
	}

	return oauthKey, ch, nil
}
