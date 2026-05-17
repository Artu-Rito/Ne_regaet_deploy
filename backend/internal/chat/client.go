package chat

import (
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = 54 * time.Second
	maxMessageSize = 4096
	maxContentLen  = 2000
	rateLimitMs    = 1000 // minimum ms between messages
)

// SaveFunc is called by readPump to persist a new chat message.
type SaveFunc func(roomSlug string, userID uuid.UUID, content string) (*OutboundMessage, error)

// Client represents one connected WebSocket user.
type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	roomSlug string
	userID   uuid.UUID
	nickname string
	save     SaveFunc
}

func NewClient(hub *Hub, conn *websocket.Conn, roomSlug string, userID uuid.UUID, nickname string, save SaveFunc) *Client {
	return &Client{
		hub:      hub,
		conn:     conn,
		send:     make(chan []byte, 256),
		roomSlug: roomSlug,
		userID:   userID,
		nickname: nickname,
		save:     save,
	}
}

// QueueInitial enqueues a message into the send buffer before Run() starts.
// Must be called before Run().
func (c *Client) QueueInitial(data []byte) {
	c.send <- data
}

func (c *Client) Run() {
	go c.writePump()
	c.hub.Register(c)
	c.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.Unregister(c)
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	var lastMsg time.Time

	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws read error: %v", err)
			}
			break
		}

		// Rate limit
		if time.Since(lastMsg) < rateLimitMs*time.Millisecond {
			c.sendError("rate_limit", "Слишком быстро, подождите секунду")
			continue
		}
		lastMsg = time.Now()

		var in InboundMessage
		if err := json.Unmarshal(raw, &in); err != nil {
			c.sendError("invalid_json", "Неверный формат")
			continue
		}

		if in.Type != "message" {
			continue
		}

		if len([]rune(in.Content)) > maxContentLen {
			c.sendError("too_long", "Максимум 2000 символов")
			continue
		}

		content := in.Content
		if len(content) == 0 {
			continue
		}

		outMsg, err := c.save(c.roomSlug, c.userID, content)
		if err != nil {
			log.Printf("chat save error: %v", err)
			c.sendError("server_error", "Не удалось сохранить сообщение")
			continue
		}

		data, _ := json.Marshal(outMsg)
		c.hub.BroadcastToRoom(c.roomSlug, data)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) sendError(code, message string) {
	msg := OutboundMessage{Type: "error", Code: code, Message: message}
	data, _ := json.Marshal(msg)
	select {
	case c.send <- data:
	default:
	}
}
