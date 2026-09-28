package antigravity

// ModelList mirrors the models the Antigravity (Google IDE) backend routes
// today, including the multi-provider entries (Claude, GPT-OSS) served
// through the same Cloud Code Assist envelope. Availability varies per
// account tier — the per-channel "fetch models" action returns the live list.
var ModelList = []string{
	"gemini-3-flash",
	"gemini-3-pro",
	"claude-sonnet-4-6",
	"claude-opus-4-6-thinking",
	"gpt-oss-120b-medium",
}

const ChannelName = "antigravity"
