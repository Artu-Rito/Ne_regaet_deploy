package handlers

import (
	"gaming-lag-platform/internal/models"
	"gaming-lag-platform/internal/repository"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ArticleHandler struct {
	articleRepo *repository.ArticleRepository
}

func NewArticleHandler(articleRepo *repository.ArticleRepository) *ArticleHandler {
	return &ArticleHandler{articleRepo: articleRepo}
}

func (h *ArticleHandler) GetArticles(c *gin.Context) {
	category := c.Query("category")
	tag := c.Query("tag")

	articles, err := h.articleRepo.GetAll(category, tag)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"articles": articles})
}

func (h *ArticleHandler) GetArticle(c *gin.Context) {
	id := c.Param("id")
	parsedID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid article ID"})
		return
	}

	article, err := h.articleRepo.GetByID(parsedID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"article": article})
}

func (h *ArticleHandler) CreateArticle(c *gin.Context) {
	var input struct {
		Title    string   `json:"title" validate:"required"`
		Content  string   `json:"content" validate:"required"`
		Category string   `json:"category"`
		Tags     string   `json:"tags"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authorID, _ := c.Get("userID")
	parsedAuthorID, _ := uuid.Parse(authorID.(string))

	article := &models.Article{
		Title:    input.Title,
		Content:  input.Content,
		Category: input.Category,
		Tags:     input.Tags,
		AuthorID: parsedAuthorID,
	}

	if err := h.articleRepo.Create(article); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"article": article})
}
