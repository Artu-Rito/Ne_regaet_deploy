package handlers

import (
	"encoding/json"
	"gaming-lag-platform/internal/chat"
	"gaming-lag-platform/internal/models"
	"gaming-lag-platform/internal/repository"
	"gaming-lag-platform/pkg/utils"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:    func(r *http.Request) bool { return true },
}

// roomsCache avoids hitting the DB on every GET /api/chat/rooms call.
var roomsCache struct {
	sync.RWMutex
	data      []roomResponse
	updatedAt time.Time
}

type roomResponse struct {
	models.ChatRoom
	OnlineCount int        `json:"online_count"`
	LastMsgAt   *time.Time `json:"last_message_at"`
}

type ChatHandler struct {
	hub      *chat.Hub
	chatRepo *repository.ChatRepository
	jwtUtils *utils.JWTUtils
}

func NewChatHandler(hub *chat.Hub, chatRepo *repository.ChatRepository, jwtUtils *utils.JWTUtils) *ChatHandler {
	return &ChatHandler{hub: hub, chatRepo: chatRepo, jwtUtils: jwtUtils}
}

func (h *ChatHandler) GetRooms(c *gin.Context) {
	roomsCache.RLock()
	cached := time.Since(roomsCache.updatedAt) < 10*time.Second && len(roomsCache.data) > 0
	data := roomsCache.data
	roomsCache.RUnlock()

	if cached {
		c.JSON(http.StatusOK, gin.H{"rooms": data})
		return
	}

	rooms, err := h.chatRepo.GetRooms()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ids := make([]uuid.UUID, len(rooms))
	for i, r := range rooms {
		ids[i] = r.ID
	}
	lastMsgMap, _ := h.chatRepo.GetLastMessageAt(ids)

	result := make([]roomResponse, len(rooms))
	for i, r := range rooms {
		result[i] = roomResponse{
			ChatRoom:    r,
			OnlineCount: h.hub.OnlineCount(r.Slug),
			LastMsgAt:   lastMsgMap[r.ID],
		}
	}

	roomsCache.Lock()
	roomsCache.data = result
	roomsCache.updatedAt = time.Now()
	roomsCache.Unlock()

	c.JSON(http.StatusOK, gin.H{"rooms": result})
}

func (h *ChatHandler) GetHistory(c *gin.Context) {
	slug := c.Param("slug")
	room, err := h.chatRepo.GetRoomBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Комната не найдена"})
		return
	}

	msgs, err := h.chatRepo.GetRecentMessages(room.ID, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": msgs, "room": room})
}

func (h *ChatHandler) ServeWS(c *gin.Context) {
	slug := c.Param("slug")

	// Auth via query param (browsers can't set custom headers for WS)
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "token required"})
		return
	}

	claims, err := h.jwtUtils.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	userID := claims.UserID

	room, err := h.chatRepo.GetRoomBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Комната не найдена"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	saveFunc := func(roomSlug string, uid uuid.UUID, content string) (*chat.OutboundMessage, error) {
		msg, err := h.chatRepo.SaveMessage(room.ID, uid, content)
		if err != nil {
			return nil, err
		}
		// invalidate rooms cache so last_message_at updates
		roomsCache.Lock()
		roomsCache.updatedAt = time.Time{}
		roomsCache.Unlock()

		return &chat.OutboundMessage{
			Type:      "message",
			ID:        msg.ID.String(),
			RoomSlug:  roomSlug,
			UserID:    uid.String(),
			Nickname:  claims.Nickname,
			Content:   content,
			CreatedAt: msg.CreatedAt,
		}, nil
	}

	client := chat.NewClient(h.hub, conn, slug, userID, claims.Nickname, saveFunc)

	// Send recent history to the new client before starting the pump
	msgs, _ := h.chatRepo.GetRecentMessages(room.ID, 100)
	for _, m := range msgs {
		out := chat.OutboundMessage{
			Type:      "message",
			ID:        m.ID.String(),
			RoomSlug:  slug,
			UserID:    m.UserID.String(),
			Nickname:  m.User.Nickname,
			Content:   m.Content,
			CreatedAt: m.CreatedAt,
		}
		data, _ := json.Marshal(out)
		client.QueueInitial(data)
	}

	go client.Run()
}
