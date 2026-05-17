package handlers

import (
	"gaming-lag-platform/internal/models"
	"gaming-lag-platform/internal/repository"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminHandler struct {
	userRepo    *repository.UserRepository
	postRepo    *repository.PostRepository
	articleRepo *repository.ArticleRepository
}

func NewAdminHandler(userRepo *repository.UserRepository, postRepo *repository.PostRepository, articleRepo *repository.ArticleRepository) *AdminHandler {
	return &AdminHandler{userRepo: userRepo, postRepo: postRepo, articleRepo: articleRepo}
}

func (h *AdminHandler) GetUsers(c *gin.Context) {
	users, err := h.userRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"users": users})
}

func (h *AdminHandler) GetPosts(c *gin.Context) {
	posts, _, err := h.postRepo.GetAll(1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"posts": posts})
}

func (h *AdminHandler) DeletePost(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}
	if err := h.postRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *AdminHandler) CreateArticle(c *gin.Context) {
	var input struct {
		Title    string `json:"title"`
		Content  string `json:"content"`
		Category string `json:"category"`
		Tags     string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	authorID, _ := uuid.Parse(c.GetString("userID"))
	article := &models.Article{
		Title:    input.Title,
		Content:  input.Content,
		Category: input.Category,
		Tags:     input.Tags,
		AuthorID: authorID,
	}
	if err := h.articleRepo.Create(article); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"article": article})
}

func (h *AdminHandler) GetArticles(c *gin.Context) {
	articles, err := h.articleRepo.GetAll("", "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"articles": articles})
}

func (h *AdminHandler) DeleteArticle(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid article ID"})
		return
	}
	if err := h.articleRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
