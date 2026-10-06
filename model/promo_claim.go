package model

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/qwetls/tokenflow/common"
	"github.com/qwetls/tokenflow/logger"
	"gorm.io/gorm"
)

// PromoClaim tracks one-time promotional quota claims per user.
type PromoClaim struct {
	Id           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	UserId       int    `json:"user_id" gorm:"not null;uniqueIndex:idx_user_promo"`
	PromoKey     string `json:"promo_key" gorm:"type:varchar(64);not null;uniqueIndex:idx_user_promo"`
	QuotaGranted int    `json:"quota_granted" gorm:"not null"`
	QuotaBefore  int    `json:"quota_before" gorm:"not null;default:0"` // user balance at claim time (for expiry calc)
	ExpiresAt    int64  `json:"expires_at"`                  // unix ts; 0 = never expires
	Expired      bool   `json:"expired" gorm:"default:false"`
	CreatedAt    int64  `json:"created_at"`
}

func (PromoClaim) TableName() string {
	return "promo_claims"
}

// Weekend build promo constants.
const (
	PromoWeekendBuild      = "weekend_build_202610"
	PromoWeekendBuildQuota = 9000000 // ~30M Claude Sonnet input tokens
	// Active user = used API + linked Telegram or GitHub + logged in within 14 days.
	PromoActiveLoginDays = 14
	// Promo quota expires Monday Oct 5, 2026 00:00 WIB (Oct 4, 2026 17:00 UTC).
	PromoWeekendBuildExpiresAt = int64(1791133200)
)

// PromoEligibility describes whether a user can claim a promo.
type PromoEligibility struct {
	Eligible bool     `json:"eligible"`
	Claimed  bool     `json:"claimed"`
	Reasons  []string `json:"reasons"`
}

// HasClaimedPromo reports whether the user already claimed the promo.
func HasClaimedPromo(userId int, promoKey string) (bool, error) {
	var count int64
	err := DB.Model(&PromoClaim{}).
		Where("user_id = ? AND promo_key = ?", userId, promoKey).
		Count(&count).Error
	return count > 0, err
}

// GetWeekendBuildEligibility checks the active-user criteria.
func GetWeekendBuildEligibility(userId int) (*PromoEligibility, error) {
	res := &PromoEligibility{Reasons: []string{}}

	if time.Now().Unix() >= PromoWeekendBuildExpiresAt {
		res.Reasons = append(res.Reasons, "promo_ended")
		return res, nil
	}

	claimed, err := HasClaimedPromo(userId, PromoWeekendBuild)
	if err != nil {
		return nil, err
	}
	res.Claimed = claimed
	if claimed {
		res.Reasons = append(res.Reasons, "already_claimed")
		return res, nil
	}

	var user User
	if err := DB.Where("id = ?", userId).First(&user).Error; err != nil {
		return nil, err
	}

	if user.RequestCount <= 0 {
		res.Reasons = append(res.Reasons, "no_api_usage")
	}
	if user.TelegramId == "" {
		res.Reasons = append(res.Reasons, "no_telegram")
	} else {
		member, err := IsPromoChannelMember(user.TelegramId)
		if err != nil || !member {
			res.Reasons = append(res.Reasons, "not_joined_channel")
		}
	}
	cutoff := time.Now().Unix() - int64(PromoActiveLoginDays*86400)
	if user.LastLoginAt < cutoff {
		res.Reasons = append(res.Reasons, "inactive")
	}

	res.Eligible = len(res.Reasons) == 0
	return res, nil
}

// ClaimWeekendBuild grants the promo quota if eligible. Idempotent via unique index.
func ClaimWeekendBuild(userId int) (int, error) {
	if time.Now().Unix() >= PromoWeekendBuildExpiresAt {
		return 0, errors.New("promotion has ended")
	}
	elig, err := GetWeekendBuildEligibility(userId)
	if err != nil {
		return 0, err
	}
	if !elig.Eligible {
		return 0, errors.New("not eligible for this promotion")
	}

	var user User
	if err := DB.Where("id = ?", userId).First(&user).Error; err != nil {
		return 0, err
	}

	claim := &PromoClaim{
		UserId:       userId,
		PromoKey:     PromoWeekendBuild,
		QuotaGranted: PromoWeekendBuildQuota,
		QuotaBefore:  user.Quota,
		ExpiresAt:    PromoWeekendBuildExpiresAt,
		CreatedAt:    time.Now().Unix(),
	}

	if common.UsingMainDatabase(common.DatabaseTypeSQLite) {
		// SQLite: sequential ops, unique index guards double-claim.
		if err := DB.Create(claim).Error; err != nil {
			return 0, errors.New("claim failed, please try again")
		}
		if err := DB.Model(&User{}).Where("id = ?", userId).
			Update("quota", gorm.Expr("quota + ?", PromoWeekendBuildQuota)).Error; err != nil {
			return 0, errors.New("claim failed: quota update error")
		}
		return PromoWeekendBuildQuota, nil
	}

	err = DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(claim).Error; err != nil {
			return errors.New("claim failed, please try again")
		}
		if err := tx.Model(&User{}).Where("id = ?", userId).
			Update("quota", gorm.Expr("quota + ?", PromoWeekendBuildQuota)).Error; err != nil {
			return errors.New("claim failed: quota update error")
		}
		return nil
	})
	if err != nil {
		return 0, err
	}
	return PromoWeekendBuildQuota, nil
}

// ExpireWeekendBuildClaims removes unspent promo quota after expiry.
// Formula: deduction = min(quota_granted, max(0, current - quota_before)).
// This assumes promo quota is spent first, so regular balance is never touched.
func ExpireWeekendBuildClaims() (int, error) {
	var claims []PromoClaim
	now := time.Now().Unix()
	if err := DB.Where("promo_key = ? AND expired = ? AND expires_at != 0 AND expires_at <= ?",
		PromoWeekendBuild, false, now).Find(&claims).Error; err != nil {
		return 0, err
	}

	expired := 0
	for _, claim := range claims {
		var user User
		if err := DB.Where("id = ?", claim.UserId).First(&user).Error; err != nil {
			continue
		}
		deduction := claim.QuotaGranted
		if diff := user.Quota - claim.QuotaBefore; diff < deduction {
			deduction = diff
		}
		if deduction < 0 {
			deduction = 0
		}

		err := DB.Transaction(func(tx *gorm.DB) error {
			if deduction > 0 {
				if err := tx.Model(&User{}).Where("id = ?", claim.UserId).
					Update("quota", gorm.Expr("quota - ?", deduction)).Error; err != nil {
					return err
				}
			}
			if err := tx.Model(&PromoClaim{}).Where("id = ?", claim.Id).
				Update("expired", true).Error; err != nil {
				return err
			}
			return nil
		})
		if err != nil {
			continue
		}
		RecordLog(claim.UserId, LogTypeSystem,
			"WEEKEND BUILD promo expired, removed quota "+logger.LogQuota(deduction))
		expired++
	}
	return expired, nil
}

// PromoChannel is the Telegram channel users must join.
const PromoChannel = "@xcloudhost"

// getBotToken reads the Telegram bot token from options.
func getBotToken() string {
	var opt Option
	if err := DB.Where("\"key\" = ?", "telegram.bot_token").First(&opt).Error; err != nil {
		return ""
	}
	return opt.Value
}

// IsPromoChannelMember checks via Telegram Bot API whether the Telegram user
// is a member of the promo channel.
func IsPromoChannelMember(telegramId string) (bool, error) {
	token := getBotToken()
	if token == "" {
		return false, errors.New("telegram bot not configured")
	}
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/getChatMember?chat_id=%s&user_id=%s",
		token, url.QueryEscape(PromoChannel), url.QueryEscape(telegramId))

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(apiURL)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, err
	}
	var result struct {
		Ok     bool `json:"ok"`
		Result struct {
			Status string `json:"status"`
		} `json:"result"`
	}
	if err := common.Unmarshal(body, &result); err != nil {
		return false, err
	}
	if !result.Ok {
		return false, nil
	}
	switch result.Result.Status {
	case "creator", "administrator", "member", "restricted":
		return true, nil
	default:
		return false, nil
	}
}
