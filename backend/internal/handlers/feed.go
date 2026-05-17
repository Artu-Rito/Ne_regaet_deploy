package handlers

import (
	"gaming-lag-platform/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type FeedHandler struct {
	feedService *service.FeedService
}

func NewFeedHandler(feedService *service.FeedService) *FeedHandler {
	return &FeedHandler{feedService: feedService}
}

func (h *FeedHandler) GetFeed(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "15"))
	kind := c.DefaultQuery("kind", "all")
	game := c.Query("game")
	postType := c.Query("type")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 15
	}

	items, total, err := h.feedService.GetFeed(page, limit, kind, game, postType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	pages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"total": total,
		"page":  page,
		"pages": pages,
	})
}
