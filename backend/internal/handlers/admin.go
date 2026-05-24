package handlers

import (
	"gaming-lag-platform/internal/models"
	"gaming-lag-platform/internal/repository"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AdminHandler объединяет всё что нужно для административных эндпоинтов.
// Все маршруты защищены AuthMiddleware + AdminMiddleware.
type AdminHandler struct {
	userRepo    *repository.UserRepository
	postRepo    *repository.PostRepository
	articleRepo *repository.ArticleRepository
	networkRepo *repository.NetworkRepository // нужен для статистики и управления серверами
}

func NewAdminHandler(
	userRepo *repository.UserRepository,
	postRepo *repository.PostRepository,
	articleRepo *repository.ArticleRepository,
	networkRepo *repository.NetworkRepository,
) *AdminHandler {
	return &AdminHandler{
		userRepo:    userRepo,
		postRepo:    postRepo,
		articleRepo: articleRepo,
		networkRepo: networkRepo,
	}
}

// GetStats возвращает сводную статистику для дашборда админа:
// общее число пользователей, число тестов за последний час, общее число тестов.
func (h *AdminHandler) GetStats(c *gin.Context) {
	totalUsers := h.userRepo.Count()
	totalTests := h.networkRepo.CountAll()
	testsLastHour := h.networkRepo.CountTestsSince(time.Now().Add(-time.Hour))

	c.JSON(http.StatusOK, gin.H{
		"total_users":     totalUsers,
		"total_tests":     totalTests,
		"tests_last_hour": testsLastHour,
	})
}

// GetUsers возвращает список всех зарегистрированных пользователей
func (h *AdminHandler) GetUsers(c *gin.Context) {
	users, err := h.userRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"users": users})
}

// GetPosts возвращает последние 100 постов для модерации
func (h *AdminHandler) GetPosts(c *gin.Context) {
	posts, _, err := h.postRepo.GetAll(1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"posts": posts})
}

// DeletePost удаляет пост по ID — используется для модерации
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

// ─── Управление игровыми серверами ───────────────────────────────────────────

// GetServers возвращает список всех игровых серверов
func (h *AdminHandler) GetServers(c *gin.Context) {
	servers, err := h.networkRepo.GetAllServers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"servers": servers})
}

// CreateServer добавляет новый игровой сервер.
// Тело запроса: { name, ip, port, game, region }
func (h *AdminHandler) CreateServer(c *gin.Context) {
	var input struct {
		Name   string `json:"name"   binding:"required"`
		IP     string `json:"ip"     binding:"required"`
		Port   int    `json:"port"   binding:"required"`
		Game   string `json:"game"   binding:"required"`
		Region string `json:"region" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	server := &models.GameServer{
		Name:   input.Name,
		IP:     input.IP,
		Port:   input.Port,
		Game:   input.Game,
		Region: input.Region,
	}
	if err := h.networkRepo.CreateServer(server); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"server": server})
}

// UpdateServer обновляет данные существующего сервера
func (h *AdminHandler) UpdateServer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}

	server, err := h.networkRepo.GetServerByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	// Обновляем только переданные поля
	var input struct {
		Name   string `json:"name"`
		IP     string `json:"ip"`
		Port   int    `json:"port"`
		Game   string `json:"game"`
		Region string `json:"region"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name   != "" { server.Name   = input.Name }
	if input.IP     != "" { server.IP     = input.IP }
	if input.Port   != 0  { server.Port   = input.Port }
	if input.Game   != "" { server.Game   = input.Game }
	if input.Region != "" { server.Region = input.Region }

	if err := h.networkRepo.UpdateServer(server); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"server": server})
}

// DeleteServer удаляет игровой сервер по ID
func (h *AdminHandler) DeleteServer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}
	if err := h.networkRepo.DeleteServer(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// ─── Статьи (оставляем для обратной совместимости) ───────────────────────────

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
