package repository

import (
	"gaming-lag-platform/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LFGRepository struct {
	db *gorm.DB
}

func NewLFGRepository(db *gorm.DB) *LFGRepository {
	return &LFGRepository{db: db}
}

func (r *LFGRepository) Create(req *models.LFGRequest) error {
	return r.db.Create(req).Error
}

func (r *LFGRepository) GetAll(game, region string, limit int) ([]models.LFGRequest, error) {
	var items []models.LFGRequest
	q := r.db.Preload("User").Where("is_active = true")
	if game != "" {
		q = q.Where("game = ?", game)
	}
	if region != "" {
		q = q.Where("region = ?", region)
	}
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&items).Error
	return items, err
}

func (r *LFGRepository) Delete(id, userID uuid.UUID) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.LFGRequest{}).Error
}

func (r *LFGRepository) GetByID(id uuid.UUID) (*models.LFGRequest, error) {
	var item models.LFGRequest
	err := r.db.Preload("User").First(&item, "id = ?", id).Error
	return &item, err
}
