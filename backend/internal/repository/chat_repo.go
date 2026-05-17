package repository

import (
	"gaming-lag-platform/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

func (r *ChatRepository) GetRooms() ([]models.ChatRoom, error) {
	var rooms []models.ChatRoom
	err := r.db.Order("game ASC, order_index ASC").Find(&rooms).Error
	return rooms, err
}

func (r *ChatRepository) GetRoomBySlug(slug string) (*models.ChatRoom, error) {
	var room models.ChatRoom
	err := r.db.Where("slug = ?", slug).First(&room).Error
	return &room, err
}

func (r *ChatRepository) GetRecentMessages(roomID uuid.UUID, limit int) ([]models.ChatMessage, error) {
	var msgs []models.ChatMessage
	err := r.db.Preload("User").
		Where("room_id = ?", roomID).
		Order("created_at DESC").
		Limit(limit).
		Find(&msgs).Error
	if err != nil {
		return nil, err
	}
	// reverse so oldest first
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs, nil
}

func (r *ChatRepository) SaveMessage(roomID, userID uuid.UUID, content string) (*models.ChatMessage, error) {
	msg := &models.ChatMessage{
		RoomID:    roomID,
		UserID:    userID,
		Content:   content,
		CreatedAt: time.Now(),
	}
	if err := r.db.Create(msg).Error; err != nil {
		return nil, err
	}
	if err := r.db.Preload("User").First(msg, msg.ID).Error; err != nil {
		return nil, err
	}
	return msg, nil
}

func (r *ChatRepository) GetLastMessageAt(roomIDs []uuid.UUID) (map[uuid.UUID]*time.Time, error) {
	type result struct {
		RoomID    uuid.UUID
		LastMsgAt *time.Time
	}
	var rows []result
	err := r.db.Model(&models.ChatMessage{}).
		Select("room_id, MAX(created_at) as last_msg_at").
		Where("room_id IN ?", roomIDs).
		Group("room_id").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]*time.Time, len(rows))
	for _, row := range rows {
		t := row.LastMsgAt
		out[row.RoomID] = t
	}
	return out, nil
}
