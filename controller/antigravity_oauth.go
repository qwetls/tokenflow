package controller

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relay/channel/antigravity"

	"github.com/gin-gonic/gin"
)

// OAuth client credentials embedded in the Antigravity IDE distribution.
const (
	antigravityClientId     = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com"
	antigravityClientSecret = "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"
	antigravityAuthURL      = "https://accounts.google.com/o/oauth2/v2/auth"
	antigravityTokenURL     = "https://oauth2.googleapis.com/token"
	antigravityUserInfoURL  = "https://www.googleapis.com/oauth2/v1/userinfo"
	antigravityLoadCodeURL  = "https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist"
	antigravityOnboardURL   = "https://cloudcode-pa.googleapis.com/v1internal:onboardUser"
	antigravityScopes       = "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/cclog https://www.googleapis.com/auth/experimentsandconfigs"
	antigravityUserAgent    = "antigravity/ide/1.0.7 darwin/arm64"
)

// oauthState entries live just long enough for the admin to complete the
// browser round-trip.
const antigravityStateTTL = 10 * time.Minute

var (
	antigravityStateMu sync.Mutex
	antigravityStates  = map[string]time.Time{}
)

// antigravityPlatformEnum mirrors the Antigravity binary's ClientMetadata
// platform values (darwin arm64=2, darwin=1, linux arm64=4, linux=3, win=5).
func antigravityPlatformEnum() int {
	switch runtime.GOOS {
	case "darwin":
		if runtime.GOARCH == "arm64" {
			return 2
		}
		return 1
	case "linux":
		if runtime.GOARCH == "arm64" {
			return 4
		}
		return 3
	case "windows":
		return 5
	default:
		return 0
	}
}

func antigravityCallbackURI(c *gin.Context) string {
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	return scheme + "://" + c.Request.Host + "/api/antigravity/oauth/callback"
}

// AntigravityOAuthLogin returns the Google consent-screen URL. Admin session
// required (the dashboard client sends its bearer token); the browser is then
// opened to the returned URL. The random state doubles as the capability that
// authenticates the later callback redirect, which browsers make without the
// dashboard's Authorization header.
func AntigravityOAuthLogin(c *gin.Context) {
	state := common.GetRandomString(32)

	antigravityStateMu.Lock()
	// Opportunistic cleanup of expired entries.
	for k, at := range antigravityStates {
		if time.Since(at) > antigravityStateTTL {
			delete(antigravityStates, k)
		}
	}
	antigravityStates[state] = time.Now()
	antigravityStateMu.Unlock()

	params := url.Values{
		"client_id":     {antigravityClientId},
		"response_type": {"code"},
		"redirect_uri":  {antigravityCallbackURI(c)},
		"scope":         {antigravityScopes},
		"state":         {state},
		"access_type":   {"offline"},
		"prompt":        {"consent"},
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": map[string]string{
			"url": antigravityAuthURL + "?" + params.Encode(),
		},
	})
}

type antigravityTokenResponse struct {
	AccessToken string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn   int    `json:"expires_in"`
}

// AntigravityOAuthCallback completes the OAuth round-trip: exchanges the
// code, resolves the Cloud Code Assist project, then creates an
// Antigravity channel with the resulting credentials.
func AntigravityOAuthCallback(c *gin.Context) {
	state := c.Query("state")
	code := c.Query("code")

	antigravityStateMu.Lock()
	createdAt, ok := antigravityStates[state]
	if ok {
		delete(antigravityStates, state)
	}
	antigravityStateMu.Unlock()

	if !ok || time.Since(createdAt) > antigravityStateTTL {
		c.String(http.StatusBadRequest, "Antigravity OAuth: invalid or expired state. Open the login button again.")
		return
	}
	if strings.TrimSpace(code) == "" {
		c.String(http.StatusBadRequest, "Antigravity OAuth: missing authorization code (access denied?)")
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// 1. Exchange the authorization code for tokens.
	form := url.Values{
		"client_id":     {antigravityClientId},
		"client_secret": {antigravityClientSecret},
		"code":          {code},
		"redirect_uri":  {antigravityCallbackURI(c)},
		"grant_type":    {"authorization_code"},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, antigravityTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		c.String(http.StatusInternalServerError, "Antigravity OAuth: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.String(http.StatusBadGateway, "Antigravity OAuth: token exchange failed: %v", err)
		return
	}
	body, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		c.String(http.StatusBadGateway, "Antigravity OAuth: token exchange failed (%d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
		return
	}
	var tokens antigravityTokenResponse
	if err := json.Unmarshal(body, &tokens); err != nil || tokens.AccessToken == "" {
		c.String(http.StatusBadGateway, "Antigravity OAuth: invalid token response")
		return
	}

	key := antigravity.OAuthKey{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		Expired:      time.Now().Add(time.Duration(tokens.ExpiresIn) * time.Second).Format(time.RFC3339),
		LastRefresh:  time.Now().Format(time.RFC3339),
	}

	// 2. Resolve the account identity and Cloud Code Assist project.
	metadata := map[string]any{"ideType": 9, "platform": antigravityPlatformEnum(), "pluginType": 2}
	loadHeaders := map[string]string{
		"Authorization":       "Bearer " + key.AccessToken,
		"Content-Type":        "application/json",
		"User-Agent":          antigravityUserAgent,
		"x-request-source":    "local",
	}

	if userInfo, err := antigravityGetJSON(ctx, antigravityUserInfoURL+"?alt=json", loadHeaders, map[string]any{}); err == nil {
		if email, ok := userInfo["email"].(string); ok {
			key.Email = email
		}
	}

	if loadBody, err := antigravityPostJSON(ctx, antigravityLoadCodeURL, loadHeaders, metadata); err == nil {
		projectID, tier := extractAntigravityProject(loadBody)
		key.ProjectID = projectID
		key.Tier = tier
		if projectID != "" {
			// Fire-and-forget onboarding for fresh accounts.
			go antigravityOnboard(loadHeaders, key.Tier, metadata)
		}
	}

	// 3. Create the channel.
	name := "Antigravity"
	if key.Email != "" {
		name = "Antigravity — " + key.Email
	}
	if key.ProjectID == "" {
		c.String(http.StatusBadGateway, "Antigravity OAuth: login succeeded but no Cloud Code Assist project was returned. Try again or check the account's eligibility.")
		return
	}

	keyJSON, _ := common.Marshal(key)
	var priority int64 = 0
	var weight uint = 0
	channel := model.Channel{
		Name:     name,
		Type:     constant.ChannelTypeAntigravity,
		Key:      string(keyJSON),
		Models:   strings.Join((&antigravity.Adaptor{}).GetModelList(), ","),
		Group:    "default",
		Priority: &priority,
		Weight:   &weight,
	}
	if err := channel.Insert(); err != nil {
		c.String(http.StatusInternalServerError, "Antigravity OAuth: login succeeded but creating the channel failed: %v", err)
		return
	}

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, `<!doctype html><html><head><meta charset="utf-8"><title>TokenFlow</title></head>
<body style="font-family:system-ui;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#fafafa">
<div style="text-align:center">
<h2>✓ Antigravity connected</h2>
<p>Channel <b>`+name+`</b> created in TokenFlow. You can close this window.</p>
</div></body></html>`)
}

func extractAntigravityProject(body map[string]any) (projectID string, tier string) {
	if v, ok := body["cloudaicompanionProject"].(string); ok {
		projectID = strings.TrimSpace(v)
	} else if m, ok := body["cloudaicompanionProject"].(map[string]any); ok {
		if id, ok := m["id"].(string); ok {
			projectID = strings.TrimSpace(id)
		}
	}
	if tiers, ok := body["allowedTiers"].([]any); ok {
		for _, t := range tiers {
			tm, ok := t.(map[string]any)
			if !ok {
				continue
			}
			if isDefault, _ := tm["isDefault"].(bool); isDefault {
				if id, ok := tm["id"].(string); ok {
					tier = strings.TrimSpace(id)
				}
				break
			}
		}
	}
	return projectID, tier
}

func antigravityOnboard(loadHeaders map[string]string, tier string, metadata map[string]any) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	payload := map[string]any{"tierId": tier, "metadata": metadata}
	for i := 0; i < 10; i++ {
		body, err := antigravityPostJSON(ctx, antigravityOnboardURL, loadHeaders, payload)
		if err == nil {
			if done, ok := body["done"].(bool); ok && done {
				return
			}
		}
		select {
		case <-ctx.Done():
			return
		case <-time.After(5 * time.Second):
		}
	}
}

func antigravityGetJSON(ctx context.Context, url string, headers map[string]string, _ map[string]any) (map[string]any, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	var out map[string]any
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func antigravityPostJSON(ctx context.Context, url string, headers map[string]string, payload any) (map[string]any, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(string(raw)))
	if err != nil {
		return nil, err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	var out map[string]any
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	return out, nil
}
