package repository

import (
	"gaming-lag-platform/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NetworkRepository struct {
	db *gorm.DB
}

func NewNetworkRepository(db *gorm.DB) *NetworkRepository {
	return &NetworkRepository{db: db}
}

func (r *NetworkRepository) CreateTest(test *models.NetworkTest) error {
	return r.db.Create(test).Error
}

func (r *NetworkRepository) GetByUserID(userID uuid.UUID, page, limit int, from, to time.Time) ([]models.NetworkTest, int64, error) {
	var tests []models.NetworkTest
	var total int64

	query := r.db.Model(&models.NetworkTest{}).Where("user_id = ?", userID)

	if !from.IsZero() {
		query = query.Where("tested_at >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("tested_at <= ?", to)
	}

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Order("tested_at DESC").Offset(offset).Limit(limit).Find(&tests).Error
	if err != nil {
		return nil, 0, err
	}

	return tests, total, nil
}

func (r *NetworkRepository) GetStatsByUserID(userID uuid.UUID, period time.Duration) (*NetworkStats, error) {
	var stats NetworkStats

	query := r.db.Model(&models.NetworkTest{}).
		Where("user_id = ?", userID).
		Where("tested_at >= ?", time.Now().Add(-period))

	var count int64
	query.Count(&count)

	if count == 0 {
		return &NetworkStats{}, nil
	}

	err := query.Select(`
		PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ping) as median_ping,
		AVG(ping)         as avg_ping,
		MIN(ping)         as min_ping,
		MAX(ping)         as max_ping,
		AVG(jitter)       as avg_jitter,
		AVG(packet_loss)  as avg_packet_loss,
		COUNT(*)          as total_tests
	`).Scan(&stats).Error

	if err != nil {
		return nil, err
	}

	return &stats, nil
}

func (r *NetworkRepository) GetLeaderboard(gameServer string, limit int) ([]LeaderboardEntry, error) {
	var entries []LeaderboardEntry

	query := r.db.Model(&models.NetworkTest{}).
		Select(`
			network_tests.user_id,
			u.nickname,
			AVG(network_tests.ping) as avg_ping,
			COUNT(*) as total_tests
		`).
		Joins("JOIN users u ON u.id = network_tests.user_id")

	if gameServer != "" {
		query = query.Where("game_server = ?", gameServer)
	}

	err := query.Group("network_tests.user_id, u.nickname").
		Order("avg_ping ASC").
		Limit(limit).
		Find(&entries).Error

	if err != nil {
		return nil, err
	}

	return entries, nil
}

func (r *NetworkRepository) CountAll() int64 {
	var count int64
	r.db.Model(&models.NetworkTest{}).Count(&count)
	return count
}

func (r *NetworkRepository) GetAllServers() ([]models.GameServer, error) {
	var servers []models.GameServer
	err := r.db.Find(&servers).Error
	return servers, err
}

func (r *NetworkRepository) GetServerByID(id uuid.UUID) (*models.GameServer, error) {
	var server models.GameServer
	err := r.db.First(&server, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &server, nil
}

// CountTestsSince — количество тестов начиная с указанного момента времени (для статистики админки)
func (r *NetworkRepository) CountTestsSince(since time.Time) int64 {
	var count int64
	r.db.Model(&models.NetworkTest{}).Where("tested_at >= ?", since).Count(&count)
	return count
}

// CreateServer — добавляет новый игровой сервер в БД
func (r *NetworkRepository) CreateServer(server *models.GameServer) error {
	return r.db.Create(server).Error
}

// UpdateServer — обновляет данные существующего сервера
func (r *NetworkRepository) UpdateServer(server *models.GameServer) error {
	return r.db.Save(server).Error
}

// DeleteServer — удаляет сервер по ID
func (r *NetworkRepository) DeleteServer(id uuid.UUID) error {
	return r.db.Delete(&models.GameServer{}, "id = ?", id).Error
}

type NetworkStats struct {
	MedianPing    float64 `json:"median_ping"`
	AvgPing       float64 `json:"avg_ping"`
	MinPing       float64 `json:"min_ping"`
	MaxPing       float64 `json:"max_ping"`
	AvgJitter     float64 `json:"avg_jitter"`
	AvgPacketLoss float64 `json:"avg_packet_loss"`
	TotalTests    int64   `json:"total_tests"`
}

type LeaderboardEntry struct {
	UserID     uuid.UUID `json:"user_id"`
	Nickname   string    `json:"nickname"`
	AvgPing    float64   `json:"avg_ping"`
	TotalTests int64     `json:"total_tests"`
}
