package antigravity

// ModelList mirrors the models the Antigravity (Google IDE) backend routes
// today, including the multi-provider entries (Claude, GPT-OSS) served
// through the same Cloud Code Assist envelope.
var ModelList = []string{
	"gemini-3-pro",
	"gemini-3.5-flash",
	"gemini-3.5-flash-low",
	"gemini-3.5-flash-extra-low",
	"gemini-3-flash",
	"gemini-pro-agent",
	"gemini-3.1-pro-low",
	"claude-sonnet-4-6",
	"claude-opus-4-6-thinking",
	"gpt-oss-120b-medium",
}

const ChannelName = "antigravity"
