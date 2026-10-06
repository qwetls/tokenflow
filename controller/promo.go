package controller

import (
	"net/http"

	"github.com/qwetls/tokenflow/common"
	"github.com/qwetls/tokenflow/logger"
	"github.com/qwetls/tokenflow/model"
	"github.com/gin-gonic/gin"
)

// GetWeekendBuildStatus returns the current user's promo eligibility.
func GetWeekendBuildStatus(c *gin.Context) {
	userId := c.GetInt("id")
	elig, err := model.GetWeekendBuildEligibility(userId)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"promo_key":   model.PromoWeekendBuild,
			"eligible":    elig.Eligible,
			"claimed":     elig.Claimed,
			"reasons":     elig.Reasons,
			"quota_grant": model.PromoWeekendBuildQuota,
			"expires_at":  model.PromoWeekendBuildExpiresAt,
		},
	})
}

// GetWeekendBuildTelegramStatus returns Telegram link + channel membership state.
func GetWeekendBuildTelegramStatus(c *gin.Context) {
	userId := c.GetInt("id")
	var user model.User
	if err := model.DB.Where("id = ?", userId).First(&user).Error; err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	linked := user.TelegramId != ""
	joined := false
	if linked {
		joined, _ = model.IsPromoChannelMember(user.TelegramId)
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"linked":  linked,
			"joined":  joined,
			"channel": model.PromoChannel,
		},
	})
}

// DoWeekendBuildClaim grants the promo quota to an eligible user.
func DoWeekendBuildClaim(c *gin.Context) {
	userId := c.GetInt("id")
	granted, err := model.ClaimWeekendBuild(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	model.RecordLog(userId, model.LogTypeSystem,
		"WEEKEND BUILD promo claimed, granted quota "+logger.LogQuota(granted))
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Promo claimed successfully",
		"data": gin.H{
			"quota_granted": granted,
		},
	})
}
