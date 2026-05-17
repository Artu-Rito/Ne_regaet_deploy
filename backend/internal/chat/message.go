package chat

import "time"

// InboundMessage is what a client sends to the server.
type InboundMessage struct {
	Type    string `json:"type"`    // "message"
	Content string `json:"content"`
}

// OutboundMessage is what the server broadcasts to clients.
type OutboundMessage struct {
	Type      string    `json:"type"`                 // "message" | "online_count" | "error"
	ID        string    `json:"id,omitempty"`
	RoomSlug  string    `json:"room_slug,omitempty"`
	UserID    string    `json:"user_id,omitempty"`
	Nickname  string    `json:"nickname,omitempty"`
	Content   string    `json:"content,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	Count     int       `json:"count,omitempty"`
	Code      string    `json:"code,omitempty"`
	Message   string    `json:"message,omitempty"`
}
