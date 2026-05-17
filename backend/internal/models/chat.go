package models

import (
	"time"

	"github.com/google/uuid"
)

type ChatRoom struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Game        string    `gorm:"not null;size:50;index" json:"game"`
	Slug        string    `gorm:"not null;unique;size:100" json:"slug"`
	Name        string    `gorm:"not null;size:100" json:"name"`
	Description string    `gorm:"size:255" json:"description"`
	OrderIndex  int       `gorm:"default:0" json:"order_index"`
	CreatedAt   time.Time `json:"created_at"`
}

func (ChatRoom) TableName() string { return "chat_rooms" }

type ChatMessage struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	RoomID    uuid.UUID `gorm:"type:uuid;not null;index" json:"room_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Content   string    `gorm:"not null;type:text" json:"content"`
	CreatedAt time.Time `gorm:"not null;default:current_timestamp;index" json:"created_at"`
}

func (ChatMessage) TableName() string { return "chat_messages" }
