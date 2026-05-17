package chat

import (
	"encoding/json"
	"sync"
)

type Room struct {
	Slug    string
	clients map[*Client]bool
	mu      sync.RWMutex
}

func (r *Room) add(c *Client) {
	r.mu.Lock()
	r.clients[c] = true
	r.mu.Unlock()
}

func (r *Room) remove(c *Client) {
	r.mu.Lock()
	delete(r.clients, c)
	r.mu.Unlock()
}

func (r *Room) count() int {
	r.mu.RLock()
	n := len(r.clients)
	r.mu.RUnlock()
	return n
}

type broadcastEnvelope struct {
	roomSlug string
	payload  []byte
}

// Hub manages all WebSocket connections and rooms.
type Hub struct {
	rooms      map[string]*Room
	roomsMu    sync.RWMutex
	register   chan *Client
	unregister chan *Client
	broadcast  chan broadcastEnvelope
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]*Room),
		register:   make(chan *Client, 64),
		unregister: make(chan *Client, 64),
		broadcast:  make(chan broadcastEnvelope, 256),
	}
}

// EnsureRoom makes sure a room with the given slug exists in the Hub.
func (h *Hub) EnsureRoom(slug string) {
	h.roomsMu.Lock()
	if _, ok := h.rooms[slug]; !ok {
		h.rooms[slug] = &Room{Slug: slug, clients: make(map[*Client]bool)}
	}
	h.roomsMu.Unlock()
}

// OnlineCount returns the current number of connected clients in a room.
func (h *Hub) OnlineCount(slug string) int {
	h.roomsMu.RLock()
	r, ok := h.rooms[slug]
	h.roomsMu.RUnlock()
	if !ok {
		return 0
	}
	return r.count()
}

// Run processes all hub events sequentially — must be called as a goroutine.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.roomsMu.RLock()
			room, ok := h.rooms[client.roomSlug]
			h.roomsMu.RUnlock()
			if ok {
				room.add(client)
				h.broadcastOnlineCount(room)
			}

		case client := <-h.unregister:
			h.roomsMu.RLock()
			room, ok := h.rooms[client.roomSlug]
			h.roomsMu.RUnlock()
			if ok {
				room.mu.Lock()
				if _, exists := room.clients[client]; exists {
					delete(room.clients, client)
					close(client.send)
				}
				room.mu.Unlock()
				h.broadcastOnlineCount(room)
			}

		case env := <-h.broadcast:
			h.roomsMu.RLock()
			room, ok := h.rooms[env.roomSlug]
			h.roomsMu.RUnlock()
			if !ok {
				continue
			}
			room.mu.RLock()
			for c := range room.clients {
				select {
				case c.send <- env.payload:
				default:
					// slow client — drop message rather than block
				}
			}
			room.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastToRoom(roomSlug string, payload []byte) {
	h.broadcast <- broadcastEnvelope{roomSlug: roomSlug, payload: payload}
}

func (h *Hub) Register(c *Client) {
	h.register <- c
}

func (h *Hub) Unregister(c *Client) {
	h.unregister <- c
}

func (h *Hub) broadcastOnlineCount(room *Room) {
	msg := OutboundMessage{
		Type:     "online_count",
		RoomSlug: room.Slug,
		Count:    room.count(),
	}
	data, _ := json.Marshal(msg)
	room.mu.RLock()
	for c := range room.clients {
		select {
		case c.send <- data:
		default:
		}
	}
	room.mu.RUnlock()
}
