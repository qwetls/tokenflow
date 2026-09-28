package antigravity

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/relay/channel"
	"github.com/QuantumNous/new-api/relay/channel/gemini"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"

	"github.com/gin-gonic/gin"
)

// Adaptor relays OpenAI-compatible traffic to the Antigravity (Google IDE)
// Cloud Code Assist backend. Request conversion is delegated to the Gemini
// adaptor; the result is then wrapped in the Cloud Code Assist envelope
// (model + project + inner request) and authenticated with the account's
// OAuth bearer token instead of an API key.
type Adaptor struct {
	gemini gemini.Adaptor
}

const antigravityUserAgent = "antigravity/ide/1.0.7 darwin/arm64"

func (a *Adaptor) Init(info *relaycommon.RelayInfo) {
	a.gemini.Init(info)
}

func (a *Adaptor) ConvertOpenAIRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeneralOpenAIRequest) (any, error) {
	value, err := a.gemini.ConvertOpenAIRequest(c, info, request)
	if err != nil {
		return nil, err
	}
	return a.wrapCloudCodeAssistRequest(value, info)
}

func (a *Adaptor) ConvertClaudeRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.ClaudeRequest) (any, error) {
	value, err := a.gemini.ConvertClaudeRequest(c, info, request)
	if err != nil {
		return nil, err
	}
	return a.wrapCloudCodeAssistRequest(value, info)
}

func (a *Adaptor) ConvertGeminiRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeminiChatRequest) (any, error) {
	value, err := a.gemini.ConvertGeminiRequest(c, info, request)
	if err != nil {
		return nil, err
	}
	return a.wrapCloudCodeAssistRequest(value, info)
}

func (a *Adaptor) ConvertAudioRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.AudioRequest) (io.Reader, error) {
	return nil, errors.New("antigravity channel: audio endpoint not supported")
}

func (a *Adaptor) ConvertImageRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.ImageRequest) (any, error) {
	return nil, errors.New("antigravity channel: image endpoint not supported")
}

func (a *Adaptor) ConvertRerankRequest(c *gin.Context, relayMode int, request dto.RerankRequest) (any, error) {
	return nil, errors.New("antigravity channel: rerank endpoint not supported")
}

func (a *Adaptor) ConvertEmbeddingRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.EmbeddingRequest) (any, error) {
	return nil, errors.New("antigravity channel: embedding endpoint not supported")
}

func (a *Adaptor) ConvertOpenAIResponsesRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.OpenAIResponsesRequest) (any, error) {
	return nil, errors.New("antigravity channel: responses endpoint not supported")
}

// wrapCloudCodeAssistRequest wraps a converted Gemini request in the
// envelope the Antigravity backend expects: the model id, the account's
// Cloud Code Assist project, and the Gemini payload under `request`.
func (a *Adaptor) wrapCloudCodeAssistRequest(value any, info *relaycommon.RelayInfo) (any, error) {
	if strings.TrimSpace(info.ApiKey) == "" {
		return nil, errors.New("antigravity channel: key must be an OAuth JSON object")
	}
	key, err := ParseOAuthKey(strings.TrimSpace(info.ApiKey))
	if err != nil {
		return nil, err
	}
	projectID := strings.TrimSpace(key.ProjectID)
	if projectID == "" {
		return nil, errors.New("antigravity channel: project_id is required")
	}

	inner, err := common.Marshal(value)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"model":   "models/" + info.UpstreamModelName,
		"project": projectID,
		"request": json.RawMessage(inner),
	}, nil
}

func (a *Adaptor) GetRequestURL(info *relaycommon.RelayInfo) (string, error) {
	switch info.RelayMode {
	case relayconstant.RelayModeChatCompletions, relayconstant.RelayModeGemini:
	default:
		return "", errors.New("antigravity channel: only chat endpoints are supported")
	}

	base := strings.TrimSuffix(info.ChannelBaseUrl, "/")
	if base == "" {
		base = "https://daily-cloudcode-pa.googleapis.com"
	}
	action := "generateContent"
	if info.IsStream {
		action = "streamGenerateContent?alt=sse"
	}
	return fmt.Sprintf("%s/v1internal:%s", base, action), nil
}

func (a *Adaptor) SetupRequestHeader(c *gin.Context, req *http.Header, info *relaycommon.RelayInfo) error {
	channel.SetupApiRequestHeader(info, c, req)

	key, err := ParseOAuthKey(strings.TrimSpace(info.ApiKey))
	if err != nil {
		return err
	}
	accessToken := strings.TrimSpace(key.AccessToken)
	if accessToken == "" {
		return errors.New("antigravity channel: access_token is required")
	}

	req.Set("Authorization", "Bearer "+accessToken)
	req.Set("User-Agent", antigravityUserAgent)
	if info.IsStream {
		req.Set("Accept", "text/event-stream")
	}
	return nil
}

func (a *Adaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (any, error) {
	return channel.DoApiRequest(a, c, info, requestBody)
}

func (a *Adaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (usage any, err *types.NewAPIError) {
	if info.IsStream {
		return gemini.GeminiChatStreamHandler(c, info, resp)
	}
	return gemini.GeminiChatHandler(c, info, resp)
}

func (a *Adaptor) GetModelList() []string {
	return ModelList
}

func (a *Adaptor) GetChannelName() string {
	return ChannelName
}
