package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
)

// antigravityModelsEndpoint is the models discovery endpoint 9router-style
// Antigravity integrations call with the account's bearer token. The sandbox
// host is used because the prod host rate-limits more aggressively.
const antigravityModelsEndpoint = "https://daily-cloudcode-pa.sandbox.googleapis.com/v1internal:models"

func FetchAntigravityChannelModels(channel *model.Channel) ([]string, error) {
	if channel == nil || channel.Type != constant.ChannelTypeAntigravity {
		return nil, fmt.Errorf("channel type is not Antigravity")
	}
	if channel.ChannelInfo.IsMultiKey {
		return nil, fmt.Errorf("antigravity channel does not support multi-key model discovery")
	}

	oauthKey, err := parseAntigravityOAuthKey(strings.TrimSpace(channel.Key))
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(oauthKey.AccessToken) == "" {
		return nil, fmt.Errorf("antigravity channel: access_token is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, antigravityModelsEndpoint, strings.NewReader("{}"))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+oauthKey.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("antigravity channel: models request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return nil, fmt.Errorf("antigravity channel: credential rejected (%d) — reconnect the Google account", resp.StatusCode)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("antigravity channel: models request failed (%d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var parsed struct {
		Models []json.RawMessage `json:"models"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("antigravity channel: invalid models response: %w", err)
	}

	models := make([]string, 0, len(parsed.Models))
	for _, rawModel := range parsed.Models {
		id := extractAntigravityModelID(rawModel)
		if id != "" && !containsString(models, id) {
			models = append(models, id)
		}
	}
	if len(models) == 0 {
		return nil, fmt.Errorf("antigravity channel: models response contained no models")
	}
	return models, nil
}

func extractAntigravityModelID(raw json.RawMessage) string {
	var s string
	if err := json.Unmarshal(raw, &s); err == nil {
		return strings.TrimPrefix(strings.TrimSpace(s), "models/")
	}
	var obj map[string]any
	if err := json.Unmarshal(raw, &obj); err != nil {
		return ""
	}
	for _, field := range []string{"id", "name", "model"} {
		if v, ok := obj[field].(string); ok && strings.TrimSpace(v) != "" {
			return strings.TrimPrefix(strings.TrimSpace(v), "models/")
		}
	}
	return ""
}

func containsString(list []string, target string) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}
	return false
}
