package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email        string    `gorm:"unique;not null;size:255" json:"email" validate:"required,email"`
	PasswordHash string    `gorm:"not null;size:255" json:"-"`
	Nickname     string    `gorm:"unique;not null;size:100" json:"nickname" validate:"required,min=3,max=100"`
	Role         string    `gorm:"not null;default:'user';size:20" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}

type NetworkTest struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Ping        float64   `gorm:"not null" json:"ping"`
	Jitter      float64   `json:"jitter"`
	PacketLoss  float64   `json:"packet_loss"`
	GameServer  string    `gorm:"size:255" json:"game_server"`
	TestedAt    time.Time `gorm:"not null;default:current_timestamp" json:"tested_at"`
	CreatedAt   time.Time `json:"created_at"`
}

func (NetworkTest) TableName() string {
	return "network_tests"
}

type GameServer struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name   string    `gorm:"not null;size:255" json:"name"`
	IP     string    `gorm:"not null;size:45" json:"ip"`
	Port   int       `gorm:"not null" json:"port"`
	Game   string    `gorm:"not null;size:100" json:"game"`
	Region string    `gorm:"size:100" json:"region"`
}

func (GameServer) TableName() string {
	return "game_servers"
}
