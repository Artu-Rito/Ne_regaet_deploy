package handlers

import (
	"gaming-lag-platform/internal/service"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)


// Ping возвращает текущий timestamp — клиент измеряет RTT от отправки до получения ответа
func (h *NetworkHandler) Ping(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"ts": time.Now().UnixMilli()})
}

// SpeedTestDownload отдаёт блок нулевых байт для измерения скорости загрузки.
// Размер по умолчанию — 2 МБ, можно задать параметром ?size=N (в байтах, макс 10 МБ).
func (h *NetworkHandler) SpeedTestDownload(c *gin.Context) {
	const defaultSize = 2 * 1024 * 1024  // 2 МБ
	const maxSize     = 10 * 1024 * 1024 // 10 МБ

	size := defaultSize
	if s := c.Query("size"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 && n <= maxSize {
			size = n
		}
	}

	// Отключаем кэш — каждый раз должен идти реальный запрос
	c.Header("Cache-Control", "no-store, no-cache, must-revalidate")
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Length", strconv.Itoa(size))

	// Пишем нули прямо в ответ без буферизации в памяти
	buf := make([]byte, 64*1024) // чанк 64 КБ
	written := 0
	for written < size {
		chunk := len(buf)
		if written+chunk > size {
			chunk = size - written
		}
		c.Writer.Write(buf[:chunk])
		written += chunk
	}
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
