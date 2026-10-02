/*
Copyright (C) 2026 TokenFlow contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For licensing information, see the LICENSE and NOTICE files.
*/
package model

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"math/big"
	"strconv"
	"time"

	"gorm.io/gorm"
)

// TelegramLinkCode is a one-time code a user generates on the dashboard and
// sends to the official Telegram bot to link their Telegram account.
type TelegramLinkCode struct {
	Id          int    `json:"id"`
	UserId      int    `json:"user_id" gorm:"index"`
	Code        string `json:"code" gorm:"type:varchar(16);uniqueIndex"`
	CreatedTime int64  `json:"created_time" gorm:"bigint"`
	ExpiresAt   int64  `json:"expires_at" gorm:"bigint;index"`
	Used        bool   `json:"used" gorm:"default:false"`
}

const telegramLinkCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func generateLinkCode(n int) (string, error) {
	b := make([]byte, n)
	for i := range b {
		idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(telegramLinkCodeAlphabet))))
		if err != nil {
			return "", err
		}
		b[i] = telegramLinkCodeAlphabet[idx.Int64()]
	}
	return string(b), nil
}

// CreateTelegramLinkCode invalidates the user's previous unused codes and
// creates a fresh one valid for 10 minutes.
func CreateTelegramLinkCode(userId int) (*TelegramLinkCode, error) {
	if userId == 0 {
		return nil, errors.New("invalid user id")
	}
	code, err := generateLinkCode(8)
	if err != nil {
		return nil, err
	}
	now := time.Now().Unix()
	linkCode := &TelegramLinkCode{
		UserId:      userId,
		Code:        code,
		CreatedTime: now,
		ExpiresAt:   now + 600,
	}
	err = DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&TelegramLinkCode{}).
			Where("user_id = ? AND used = ?", userId, false).
			Update("used", true).Error; err != nil {
			return err
		}
		return tx.Create(linkCode).Error
	})
	if err != nil {
		return nil, err
	}
	return linkCode, nil
}

// ConsumeTelegramLinkCode validates a code and marks it used, returning the
// owning user id. Single-use and expiry enforced atomically.
func ConsumeTelegramLinkCode(code string) (int, error) {
	if code == "" {
		return 0, errors.New("empty code")
	}
	var userId int
	err := DB.Transaction(func(tx *gorm.DB) error {
		linkCode := &TelegramLinkCode{}
		if err := tx.Where("code = ?", code).First(linkCode).Error; err != nil {
			return errors.New("invalid code")
		}
		if linkCode.Used {
			return errors.New("code already used")
		}
		if linkCode.ExpiresAt < time.Now().Unix() {
			return errors.New("code expired")
		}
		result := tx.Model(&TelegramLinkCode{}).
			Where("id = ? AND used = ?", linkCode.Id, false).
			Update("used", true)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return errors.New("code already used")
		}
		userId = linkCode.UserId
		return nil
	})
	if err != nil {
		return 0, err
	}
	return userId, nil
}

// SetUserTelegramId binds a Telegram account to a TokenFlow user.
// Fails if the Telegram account is already bound to a different user.
func SetUserTelegramId(userId int, telegramId int64, username string) error {
	if userId == 0 || telegramId == 0 {
		return errors.New("invalid parameters")
	}
	tgId := strconv.FormatInt(telegramId, 10)
	return DB.Transaction(func(tx *gorm.DB) error {
		var existing User
		if err := tx.Where("telegram_id = ?", tgId).First(&existing).Error; err == nil {
			if existing.Id != userId {
				return errors.New("this Telegram account is already linked to another user")
			}
			return nil // already linked to this user
		}
		return tx.Model(&User{}).Where("id = ?", userId).Update("telegram_id", tgId).Error
	})
}

// GetUserByTelegramId returns the user bound to a Telegram account, if any.
func GetUserByTelegramId(telegramId int64) (*User, error) {
	user := &User{}
	if err := DB.Where("telegram_id = ?", strconv.FormatInt(telegramId, 10)).First(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

// ClearUserTelegramId unlinks any Telegram account bound to the user.
func ClearUserTelegramId(userId int) error {
	return DB.Model(&User{}).Where("id = ?", userId).Update("telegram_id", "").Error
}
func GetTelegramBotSecret() (string, error) {
	opt := &Option{}
	if err := DB.Where(commonKeyCol+" = ?", "telegram.bot_secret").First(opt).Error; err == nil && opt.Value != "" {
		return opt.Value, nil
	}
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	secret := base64.RawURLEncoding.EncodeToString(b)
	if err := UpdateOption("telegram.bot_secret", secret); err != nil {
		return "", err
	}
	return secret, nil
}
