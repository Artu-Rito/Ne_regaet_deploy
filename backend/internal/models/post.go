package models

import (
	"time"

	"github.com/google/uuid"
)

type Post struct {
	ID        uuid.UUID   `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AuthorID  uuid.UUID   `gorm:"type:uuid;not null" json:"author_id"`
	Author    User        `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Title     string      `gorm:"not null;size:255" json:"title" validate:"required,min=1,max=255"`
	Content   string      `gorm:"not null;type:text" json:"content" validate:"required"`
	Comments     []Comment `gorm:"foreignKey:PostID" json:"comments,omitempty"`
	PostType     string    `gorm:"size:30;default:'post'" json:"post_type"`
	Game         string    `gorm:"size:50" json:"game"`
	IsPinned     bool      `gorm:"default:false" json:"is_pinned"`
	CommentCount int       `gorm:"-" json:"comment_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (Post) TableName() string {
	return "posts"
}

type Comment struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	PostID    uuid.UUID `gorm:"type:uuid;not null" json:"post_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Content   string    `gorm:"not null;type:text" json:"content" validate:"required"`
	CreatedAt time.Time `json:"created_at"`
}

func (Comment) TableName() string {
	return "comments"
}

type Article struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Title     string    `gorm:"not null;size:255" json:"title" validate:"required"`
	Content   string    `gorm:"not null;type:text" json:"content" validate:"required"`
	Category  string    `gorm:"size:100" json:"category"`
	Tags      string    `gorm:"size:500" json:"tags"`
	AuthorID  uuid.UUID `gorm:"type:uuid;not null" json:"author_id"`
	Author    User      `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Article) TableName() string {
	return "articles"
}
