package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Regression test: leaderboard vendor fallback for model names that are not
// in the current pricing set (historical names, :free / -free aliases).
func TestModelMetaVendorFallback(t *testing.T) {
	meta := map[string]rankingModelMeta{
		"deepseek-v4.1-flash": {vendor: "DeepSeek"},
		"hy3":                 {vendor: "Tencent"},
		"mimo-v2.5":           {vendor: "Xiaomi"},
		"qwen3.8-flash":       {vendor: "Alibaba"},
	}

	tests := []struct {
		name     string
		model    string
		expected string
	}{
		{"exact match wins", "hy3", "Tencent"},
		{"colon-free alias resolves via canonical", "deepseek-v4.1-flash:free", "DeepSeek"},
		{"dash-free alias resolves via canonical", "hy3-free", "Tencent"},
		{"mimo free alias resolves via canonical", "mimo-v2.5:free", "Xiaomi"},
		{"historical deepseek via pattern", "deepseek-v3.2", "DeepSeek"},
		{"historical gemini via pattern", "gemini-3.1-pro", "Google"},
		{"historical qwen normalized", "qwen-3.7-flash", "Alibaba"},
		{"historical glm normalized", "glm-5.0-turbo", "Z.AI"},
		{"historical kimi normalized", "kimi-k3", "Moonshot AI"},
		{"historical minimax via pattern", "minimax-m2.7", "MiniMax"},
		{"truly unknown stays unknown", "some-totally-unknown-model-xyz", "Unknown"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := modelMeta(tc.model, meta)
			require.NotNil(t, got)
			assert.Equal(t, tc.expected, got.vendor)
		})
	}
}
