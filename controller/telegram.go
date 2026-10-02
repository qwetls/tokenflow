package controller

import (
	"crypto/subtle"
	"net/http"

	"github.com/qwetls/tokenflow/common"
	"github.com/qwetls/tokenflow/model"

	"github.com/gin-gonic/gin"
)

// TelegramLegacyAuth retires the unsigned-flow widget endpoints. Existing
// Telegram bindings are used by the unified OAuth provider instead.
func TelegramLegacyAuth(c *gin.Context) {
	c.JSON(http.StatusGone, gin.H{
		"success": false,
		"code":    "TELEGRAM_LEGACY_AUTH_REMOVED",
		"message": "Telegram login has changed. Reload the page and start Telegram OAuth again.",
	})
}

// GenerateTelegramLinkCode creates a one-time code the user sends to the
// official Telegram bot to link their account. Requires a logged-in session.
func GenerateTelegramLinkCode(c *gin.Context) {
	id := c.GetInt("id")
	linkCode, err := model.CreateTelegramLinkCode(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"code":       linkCode.Code,
			"expires_at": linkCode.ExpiresAt,
		},
	})
}

type telegramBotRedeemRequest struct {
	UserId int    `json:"user_id"`
	Key    string `json:"key"`
}

type telegramBotLinkRequest struct {
	Code             string `json:"code"`
	TelegramId       int64  `json:"telegram_id"`
	TelegramUsername string `json:"telegram_username"`
}

// checkTelegramBotSecret validates the shared secret for internal bot endpoints.
func checkTelegramBotSecret(c *gin.Context) bool {
	secret, err := model.GetTelegramBotSecret()
	if err != nil || secret == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "telegram bot is not configured",
		})
		return false
	}
	provided := c.GetHeader("X-Bot-Secret")
	if subtle.ConstantTimeCompare([]byte(provided), []byte(secret)) != 1 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "unauthorized",
		})
		return false
	}
	return true
}

// TelegramBotLink consumes a one-time link code and binds the Telegram
// account to the TokenFlow user. Called by the official Telegram bot.
func TelegramBotLink(c *gin.Context) {
	if !checkTelegramBotSecret(c) {
		return
	}
	req := telegramBotLinkRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.Code == "" || req.TelegramId == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "invalid parameters",
		})
		return
	}
	userId, err := model.ConsumeTelegramLinkCode(req.Code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "invalid or expired code",
		})
		return
	}
	if err := model.SetUserTelegramId(userId, req.TelegramId, req.TelegramUsername); err != nil {
		common.ApiError(c, err)
		return
	}
	user, err := model.GetUserById(userId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"username": user.Username,
		},
	})
}

// TelegramBotRedeem lets the official Telegram bot redeem a top-up code for a
// linked user. Authenticated by the shared bot secret, never by user session.
func TelegramBotRedeem(c *gin.Context) {
	if !checkTelegramBotSecret(c) {
		return
	}
	req := telegramBotRedeemRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.UserId == 0 || req.Key == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "invalid parameters",
		})
		return
	}
	quota, err := model.Redeem(req.Key, req.UserId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "redeem failed",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"quota": quota,
		},
	})
}
