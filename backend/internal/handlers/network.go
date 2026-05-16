package handlers

import (
	"gaming-lag-platform/internal/service"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Ping returns immediately — used by clients to measure HTTP RTT.
func (h *NetworkHandler) Ping(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"ts": time.Now().UnixMilli()})
}

type NetworkHandler struct {
	networkService *service.NetworkService
}

func NewNetworkHandler(networkService *service.NetworkService) *NetworkHandler {
	return &NetworkHandler{networkService: networkService}
}

func (h *NetworkHandler) SubmitTest(c *gin.Context) {
	userID, _ := c.Get("userID")
	parsedID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var input service.TestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	test, err := h.networkService.SubmitTest(parsedID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stats, _ := h.networkService.GetStats(parsedID, "7d")

	c.JSON(http.StatusCreated, gin.H{
		"test":  test,
		"stats": stats,
	})
}

func (h *NetworkHandler) GetTests(c *gin.Context) {
	userID, _ := c.Get("userID")
	parsedID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	var from, to time.Time
	fromStr := c.Query("from")
	toStr := c.Query("to")

	if fromStr != "" {
		from, _ = time.Parse("2006-01-02", fromStr)
	}
	if toStr != "" {
		to, _ = time.Parse("2006-01-02", toStr)
	}

	tests, total, err := h.networkService.GetTests(parsedID, page, limit, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	pages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"tests": tests,
		"total": total,
		"page":  page,
		"pages": pages,
	})
}

func (h *NetworkHandler) GetStats(c *gin.Context) {
	userID, _ := c.Get("userID")
	parsedID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	period := c.DefaultQuery("period", "7d")
	stats, err := h.networkService.GetStats(parsedID, period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

func (h *NetworkHandler) GetLeaderboard(c *gin.Context) {
	gameServer := c.Query("gameServer")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))

	entries, err := h.networkService.GetLeaderboard(gameServer, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"players": entries})
}

func (h *NetworkHandler) GetServers(c *gin.Context) {
	servers, err := h.networkService.GetServers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"servers": servers})
}

func (h *NetworkHandler) GetServersStatus(c *gin.Context) {
	statuses, err := h.networkService.GetServersStatus()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"servers": statuses})
}

func (h *NetworkHandler) TestServer(c *gin.Context) {
	var input struct {
		ServerID string `json:"serverId"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	serverID, err := uuid.Parse(input.ServerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}

	result, err := h.networkService.TestServer(serverID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	c.JSON(http.StatusOK, result)
}
