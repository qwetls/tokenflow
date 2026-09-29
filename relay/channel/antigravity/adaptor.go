package antigravity

import (
	"bufio"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/qwetls/tokenflow/common"
	"github.com/qwetls/tokenflow/relay/channel"
	"github.com/qwetls/tokenflow/relay/channel/gemini"
	relaycommon "github.com/qwetls/tokenflow/relay/common"
	relayconstant "github.com/qwetls/tokenflow/relay/constant"
	"github.com/qwetls/tokenflow/relaykit/dto"
	"github.com/qwetls/tokenflow/relaykit/types"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
// envelope the Antigravity backend expects: the bare model id (no
// "models/" prefix — a prefixed id triggers 404 NOT_FOUND), the account's
// Cloud Code Assist project, the IDE branding fields, and the Gemini
// payload under `request` with a numeric sessionId.
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
	var request map[string]any
	if err := json.Unmarshal(inner, &request); err != nil {
		return nil, err
	}
	request["sessionId"] = antigravitySessionID(key)

	return map[string]any{
		"model":     info.UpstreamModelName,
		"project":   projectID,
		"userAgent": "antigravity",
		"requestId": fmt.Sprintf("agent/%s/%d/%s/1", uuid.NewString(), time.Now().UnixMilli(), uuid.NewString()),
		"request":   request,
	}, nil
}

// antigravitySessionID derives the negative int64 session id the backend
// expects (sha256 of a stable seed, masked to 63 bits).
func antigravitySessionID(key *OAuthKey) string {
	seed := key.Email + "|" + key.ProjectID
	if strings.TrimSpace(seed) == "|" {
		seed = key.AccessToken
	}
	h := sha256.Sum256([]byte(seed))
	n := new(big.Int).And(new(big.Int).SetBytes(h[:8]), big.NewInt(0x7fffffffffffffff))
	return "-" + n.String()
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
	// The Cloud Code Assist backend wraps every payload in {"response": …} —
	// unwrap it so the standard Gemini handlers see the familiar shape.
	resp.Body = unwrapCloudCodeAssistBody(resp.Body, info.IsStream)
	if info.IsStream {
		return gemini.GeminiChatStreamHandler(c, info, resp)
	}
	return gemini.GeminiChatHandler(c, info, resp)
}

// unwrapCloudCodeAssistBody returns a reader whose JSON payloads have the
// top-level "response" envelope removed. Non-stream bodies are unwrapped in
// one shot; SSE streams are transformed line by line in the background.
func unwrapCloudCodeAssistBody(body io.ReadCloser, isStream bool) io.ReadCloser {
	if !isStream {
		raw, err := io.ReadAll(body)
		_ = body.Close()
		if err != nil {
			return io.NopCloser(strings.NewReader(string(raw)))
		}
		var wrapper map[string]json.RawMessage
		if err := json.Unmarshal(raw, &wrapper); err != nil {
			return io.NopCloser(strings.NewReader(string(raw)))
		}
		if inner, ok := wrapper["response"]; ok {
			return io.NopCloser(strings.NewReader(string(inner)))
		}
		return io.NopCloser(strings.NewReader(string(raw)))
	}

	pr, pw := io.Pipe()
	go func() {
		defer pw.Close()
		defer body.Close()
		scanner := bufio.NewScanner(body)
		scanner.Buffer(make([]byte, 0, 64*1024), 8*1024*1024)
		for scanner.Scan() {
			line := scanner.Text()
			if trimmed, ok := strings.CutPrefix(line, "data: "); ok {
				trimmed = strings.TrimSpace(trimmed)
				if trimmed != "" && trimmed != "[DONE]" {
					var wrapper map[string]json.RawMessage
					if err := json.Unmarshal([]byte(trimmed), &wrapper); err == nil {
						if inner, ok := wrapper["response"]; ok {
							line = "data: " + string(inner)
						}
					}
				}
			}
			if _, err := pw.Write([]byte(line + "\n")); err != nil {
				return
			}
		}
	}()
	return pr
}

func (a *Adaptor) GetModelList() []string {
	return ModelList
}

func (a *Adaptor) GetChannelName() string {
	return ChannelName
}
