package service

import (
	"fmt"
	"net"
	"sync"
	"gaming-lag-platform/internal/models"
	"gaming-lag-platform/internal/repository"
	"time"

	"github.com/google/uuid"
)

// ServerStatus is a GameServer with a live ping measurement.
type ServerStatus struct {
	models.GameServer
	PingMs float64 `json:"ping_ms"`
	Online bool    `json:"online"`
}

// pingCache avoids hammering servers on every page load.
var pingCache struct {
	sync.Mutex
	items     []ServerStatus
	updatedAt time.Time
}

type NetworkService struct {
	networkRepo *repository.NetworkRepository
}

func NewNetworkService(networkRepo *repository.NetworkRepository) *NetworkService {
	return &NetworkService{networkRepo: networkRepo}
}

// tcpPing measures TCP connection establishment time to a host:port.
// Returns latency in milliseconds or -1 if unreachable.
func tcpPing(host string, port int) (float64, error) {
	addr := fmt.Sprintf("%s:%d", host, port)
	start := time.Now()
	conn, err := net.DialTimeout("tcp", addr, 3*time.Second)
	if err != nil {
		return -1, err
	}
	elapsed := time.Since(start)
	conn.Close()
	return float64(elapsed.Milliseconds()), nil
}

type TestInput struct {
	Ping       float64 `json:"ping" validate:"required"`
	Jitter     float64 `json:"jitter"`
	PacketLoss float64 `json:"packet_loss"`
	GameServer string  `json:"game_server"`
}

func (s *NetworkService) SubmitTest(userID uuid.UUID, input TestInput) (*models.NetworkTest, error) {
	test := &models.NetworkTest{
		UserID:     userID,
		Ping:       input.Ping,
		Jitter:     input.Jitter,
		PacketLoss: input.PacketLoss,
		GameServer: input.GameServer,
		TestedAt:   time.Now(),
	}

	if err := s.networkRepo.CreateTest(test); err != nil {
		return nil, err
	}

	return test, nil
}

func (s *NetworkService) GetTests(userID uuid.UUID, page, limit int, from, to time.Time) ([]models.NetworkTest, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	return s.networkRepo.GetByUserID(userID, page, limit, from, to)
}

func (s *NetworkService) GetStats(userID uuid.UUID, period string) (*repository.NetworkStats, error) {
	var duration time.Duration

	switch period {
	case "1d":
		duration = 24 * time.Hour
	case "7d":
		duration = 7 * 24 * time.Hour
	case "30d":
		duration = 30 * 24 * time.Hour
	case "90d":
		duration = 90 * 24 * time.Hour
	default:
		duration = 7 * 24 * time.Hour
	}

	return s.networkRepo.GetStatsByUserID(userID, duration)
}

func (s *NetworkService) GetLeaderboard(gameServer string, limit int) ([]repository.LeaderboardEntry, error) {
	if limit < 1 || limit > 100 {
		limit = 100
	}

	return s.networkRepo.GetLeaderboard(gameServer, limit)
}

func (s *NetworkService) GetServers() ([]models.GameServer, error) {
	return s.networkRepo.GetAllServers()
}

// GetServersStatus concurrently pings all servers. Results cached for 30 seconds.
func (s *NetworkService) GetServersStatus() ([]ServerStatus, error) {
	pingCache.Lock()
	if time.Since(pingCache.updatedAt) < 30*time.Second && len(pingCache.items) > 0 {
		items := pingCache.items
		pingCache.Unlock()
		return items, nil
	}
	pingCache.Unlock()

	servers, err := s.networkRepo.GetAllServers()
	if err != nil {
		return nil, err
	}

	results := make([]ServerStatus, len(servers))
	var wg sync.WaitGroup

	for i, srv := range servers {
		wg.Add(1)
		go func(idx int, gs models.GameServer) {
			defer wg.Done()
			// Use 2s timeout so status check doesn't take forever
			addr := fmt.Sprintf("%s:%d", gs.IP, gs.Port)
			start := time.Now()
			conn, dialErr := net.DialTimeout("tcp", addr, 2*time.Second)
			if dialErr != nil {
				results[idx] = ServerStatus{GameServer: gs, PingMs: -1, Online: false}
				return
			}
			ms := float64(time.Since(start).Milliseconds())
			conn.Close()
			results[idx] = ServerStatus{GameServer: gs, PingMs: ms, Online: true}
		}(i, srv)
	}

	wg.Wait()

	pingCache.Lock()
	pingCache.items = results
	pingCache.updatedAt = time.Now()
	pingCache.Unlock()

	return results, nil
}

func (s *NetworkService) TestServer(serverID uuid.UUID) (*ServerTestResult, error) {
	server, err := s.networkRepo.GetServerByID(serverID)
	if err != nil {
		return nil, err
	}

	serverPing, pingErr := tcpPing(server.IP, server.Port)

	var recommendation string
	if pingErr != nil || serverPing < 0 {
		recommendation = "Сервер не отвечает на TCP-соединение"
		serverPing = -1
	} else if serverPing < 30 {
		recommendation = "Отличное соединение!"
	} else if serverPing < 60 {
		recommendation = "Хорошее соединение"
	} else if serverPing < 100 {
		recommendation = "Приемлемое соединение"
	} else {
		recommendation = "Высокая задержка, рассмотрите другой сервер"
	}

	return &ServerTestResult{
		Server:         server,
		ServerPing:     serverPing,
		Recommendation: recommendation,
	}, nil
}

type ServerTestResult struct {
	Server         *models.GameServer `json:"server"`
	ServerPing     float64            `json:"server_ping"`
	Recommendation string             `json:"recommendation"`
}
