package service

import (
	"gaming-lag-platform/internal/models"
	"gaming-lag-platform/internal/repository"

	"github.com/google/uuid"
)

type PostService struct {
	postRepo *repository.PostRepository
}

func NewPostService(postRepo *repository.PostRepository) *PostService {
	return &PostService{postRepo: postRepo}
}

type CreatePostInput struct {
	Title    string `json:"title" validate:"required,min=1,max=255"`
	Content  string `json:"content" validate:"required"`
	PostType string `json:"post_type"`
	Game     string `json:"game"`
}

type CreateCommentInput struct {
	Content string `json:"content" validate:"required"`
}

func (s *PostService) CreatePost(authorID uuid.UUID, input CreatePostInput) (*models.Post, error) {
	postType := input.PostType
	if postType == "" {
		postType = "post"
	}
	post := &models.Post{
		AuthorID: authorID,
		Title:    input.Title,
		Content:  input.Content,
		PostType: postType,
		Game:     input.Game,
	}

	if err := s.postRepo.Create(post); err != nil {
		return nil, err
	}

	return post, nil
}

func (s *PostService) GetPost(id uuid.UUID) (*models.Post, error) {
	return s.postRepo.GetByID(id)
}

func (s *PostService) GetAllPosts(page, limit int) ([]models.Post, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	return s.postRepo.GetAll(page, limit)
}

func (s *PostService) UpdatePost(id uuid.UUID, authorID uuid.UUID, input CreatePostInput) (*models.Post, error) {
	post, err := s.postRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if post.AuthorID != authorID {
		return nil, ErrUnauthorized
	}

	post.Title = input.Title
	post.Content = input.Content

	if err := s.postRepo.Update(post); err != nil {
		return nil, err
	}

	return post, nil
}

func (s *PostService) DeletePost(id uuid.UUID, authorID uuid.UUID) error {
	post, err := s.postRepo.GetByID(id)
	if err != nil {
		return err
	}

	if post.AuthorID != authorID {
		return ErrUnauthorized
	}

	return s.postRepo.Delete(id)
}

func (s *PostService) AddComment(postID, userID uuid.UUID, input CreateCommentInput) (*models.Comment, error) {
	comment := &models.Comment{
		PostID:  postID,
		UserID:  userID,
		Content: input.Content,
	}

	if err := s.postRepo.CreateComment(comment); err != nil {
		return nil, err
	}

	return comment, nil
}

var ErrUnauthorized = &UnauthorizedError{}

type UnauthorizedError struct{}

func (e *UnauthorizedError) Error() string {
	return "unauthorized"
}
