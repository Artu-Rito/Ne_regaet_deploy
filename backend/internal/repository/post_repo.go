package repository

import (
	"gaming-lag-platform/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) *PostRepository {
	return &PostRepository{db: db}
}

func (r *PostRepository) Create(post *models.Post) error {
	return r.db.Create(post).Error
}

func (r *PostRepository) GetByID(id uuid.UUID) (*models.Post, error) {
	var post models.Post
	err := r.db.Preload("Author").Preload("Comments.User").First(&post, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *PostRepository) GetAll(page, limit int) ([]models.Post, int64, error) {
	var posts []models.Post
	var total int64

	r.db.Model(&models.Post{}).Count(&total)

	offset := (page - 1) * limit
	err := r.db.Preload("Author").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error
	if err != nil {
		return nil, 0, err
	}

	if len(posts) > 0 {
		type cntRow struct {
			PostID uuid.UUID `gorm:"column:post_id"`
			Count  int       `gorm:"column:count"`
		}
		ids := make([]uuid.UUID, len(posts))
		for i, p := range posts {
			ids[i] = p.ID
		}
		var rows []cntRow
		r.db.Raw("SELECT post_id, COUNT(*) AS count FROM comments WHERE post_id IN ? GROUP BY post_id", ids).Scan(&rows)
		m := make(map[uuid.UUID]int, len(rows))
		for _, row := range rows {
			m[row.PostID] = row.Count
		}
		for i := range posts {
			posts[i].CommentCount = m[posts[i].ID]
		}
	}

	return posts, total, nil
}

func (r *PostRepository) Count() int64 {
	var count int64
	r.db.Model(&models.Post{}).Count(&count)
	return count
}

func (r *PostRepository) Update(post *models.Post) error {
	return r.db.Save(post).Error
}

func (r *PostRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Post{}, "id = ?", id).Error
}

func (r *PostRepository) CreateComment(comment *models.Comment) error {
	return r.db.Create(comment).Error
}

func (r *PostRepository) GetCommentsByPostID(postID uuid.UUID) ([]models.Comment, error) {
	var comments []models.Comment
	err := r.db.Preload("User").Where("post_id = ?", postID).Order("created_at ASC").Find(&comments).Error
	return comments, err
}

type ArticleRepository struct {
	db *gorm.DB
}

func NewArticleRepository(db *gorm.DB) *ArticleRepository {
	return &ArticleRepository{db: db}
}

func (r *ArticleRepository) GetAll(category, tag string) ([]models.Article, error) {
	var articles []models.Article

	query := r.db.Preload("Author")

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if tag != "" {
		query = query.Where("tags LIKE ?", "%"+tag+"%")
	}

	err := query.Order("created_at DESC").Find(&articles).Error
	return articles, err
}

func (r *ArticleRepository) GetByID(id uuid.UUID) (*models.Article, error) {
	var article models.Article
	err := r.db.Preload("Author").First(&article, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &article, nil
}

func (r *ArticleRepository) Create(article *models.Article) error {
	return r.db.Create(article).Error
}

func (r *ArticleRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Article{}, "id = ?", id).Error
}
