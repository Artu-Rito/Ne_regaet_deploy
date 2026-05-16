package handlers

import (
	"gaming-lag-platform/internal/models"
	"gaming-lag-platform/internal/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type LFGHandler struct {
	repo *repository.LFGRepository
}

func NewLFGHandler(repo *repository.LFGRepository) *LFGHandler {
	return &LFGHandler{repo: repo}
}

func (h *LFGHandler) GetAll(c *gin.Context) {
	game   := c.Query("game")
	region := c.Query("region")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	items, err := h.repo.GetAll(game, region, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"requests": items})
}

func (h *LFGHandler) Create(c *gin.Context) {
	userIDRaw, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDRaw.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var body struct {
		Game        string `json:"game"        binding:"required"`
		Region      string `json:"region"      binding:"required"`
		Rank        string `json:"rank"`
		Description string `json:"description" binding:"required,min=10"`
		Contact     string `json:"contact"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req := &models.LFGRequest{
		UserID:      userID,
		Game:        body.Game,
		Region:      body.Region,
		Rank:        body.Rank,
		Description: body.Description,
		Contact:     body.Contact,
		IsActive:    true,
	}
	if err := h.repo.Create(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with user preloaded
	full, _ := h.repo.GetByID(req.ID)
	c.JSON(http.StatusCreated, gin.H{"request": full})
}

func (h *LFGHandler) Delete(c *gin.Context) {
	userIDRaw, _ := c.Get("userID")
	userID, _ := uuid.Parse(userIDRaw.(string))
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.repo.Delete(id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
