package models

import (
	"time"

	"github.com/google/uuid"
)

type LFGRequest struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	User        User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Game        string    `gorm:"not null;size:100" json:"game"`
	Region      string    `gorm:"not null;size:50" json:"region"`
	Rank        string    `gorm:"size:100" json:"rank"`
	Description string    `gorm:"not null;type:text" json:"description"`
	Contact     string    `gorm:"size:200" json:"contact"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (LFGRequest) TableName() string {
	return "lfg_requests"
}
