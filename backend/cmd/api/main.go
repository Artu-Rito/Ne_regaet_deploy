package main

import (
	"gaming-lag-platform/internal/chat"
	"gaming-lag-platform/internal/config"
	"gaming-lag-platform/internal/handlers"
	"gaming-lag-platform/internal/middleware"
	"gaming-lag-platform/internal/repository"
	"gaming-lag-platform/internal/service"
	"gaming-lag-platform/pkg/database"
	"gaming-lag-platform/pkg/utils"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.NewDatabase(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.Migrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	if err := db.Seed(); err != nil {
		log.Printf("Warning: Failed to seed database: %v", err)
	}

	jwtUtils := utils.NewJWTUtils(cfg.JWTSecret, cfg.JWTExpiration)

	userRepo := repository.NewUserRepository(db.DB)
	networkRepo := repository.NewNetworkRepository(db.DB)
	postRepo := repository.NewPostRepository(db.DB)
	articleRepo := repository.NewArticleRepository(db.DB)
	lfgRepo := repository.NewLFGRepository(db.DB)
	chatRepo := repository.NewChatRepository(db.DB)

	authService := service.NewAuthService(userRepo, jwtUtils)
	networkService := service.NewNetworkService(networkRepo)
	postService := service.NewPostService(postRepo)
	feedService := service.NewFeedService(postRepo, articleRepo)

	authHandler := handlers.NewAuthHandler(authService)
	networkHandler := handlers.NewNetworkHandler(networkService)
	postHandler := handlers.NewPostHandler(postService)
	articleHandler := handlers.NewArticleHandler(articleRepo)
	lfgHandler := handlers.NewLFGHandler(lfgRepo)
	feedHandler := handlers.NewFeedHandler(feedService)
	statsHandler := handlers.NewStatsHandler(userRepo, postRepo, networkRepo)
	adminHandler := handlers.NewAdminHandler(userRepo, postRepo, articleRepo)

	// Start WebSocket hub
	chatHub := chat.NewHub()
	go chatHub.Run()

	// Pre-load rooms into Hub from DB
	rooms, err := chatRepo.GetRooms()
	if err != nil {
		log.Printf("Warning: could not load chat rooms into hub: %v", err)
	} else {
		for _, r := range rooms {
			chatHub.EnsureRoom(r.Slug)
		}
		log.Printf("Loaded %d chat rooms into hub", len(rooms))
	}

	chatHandler := handlers.NewChatHandler(chatHub, chatRepo, jwtUtils)

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.ErrorHandler())

	api := router.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.AuthMiddleware(jwtUtils), authHandler.GetMe)
			auth.PUT("/me", middleware.AuthMiddleware(jwtUtils), authHandler.UpdateMe)
		}

		api.GET("/stats", statsHandler.GetGlobalStats)

		network := api.Group("/network")
		{
			network.GET("/ping", networkHandler.Ping)
			network.POST("/test", middleware.AuthMiddleware(jwtUtils), networkHandler.SubmitTest)
			network.GET("/tests", middleware.AuthMiddleware(jwtUtils), networkHandler.GetTests)
			network.GET("/stats", middleware.AuthMiddleware(jwtUtils), networkHandler.GetStats)
			network.GET("/leaderboard", networkHandler.GetLeaderboard)
			network.GET("/servers", networkHandler.GetServers)
			network.GET("/servers/status", networkHandler.GetServersStatus)
			network.POST("/test-server", networkHandler.TestServer)
		}

		lfg := api.Group("/lfg")
		{
			lfg.GET("", lfgHandler.GetAll)
			lfg.POST("", middleware.AuthMiddleware(jwtUtils), lfgHandler.Create)
			lfg.DELETE("/:id", middleware.AuthMiddleware(jwtUtils), lfgHandler.Delete)
		}

		posts := api.Group("/posts")
		{
			posts.GET("", postHandler.GetPosts)
			posts.GET("/:id", postHandler.GetPost)
			posts.POST("", middleware.AuthMiddleware(jwtUtils), postHandler.CreatePost)
			posts.PUT("/:id", middleware.AuthMiddleware(jwtUtils), postHandler.UpdatePost)
			posts.DELETE("/:id", middleware.AuthMiddleware(jwtUtils), postHandler.DeletePost)
			posts.POST("/:id/comments", middleware.AuthMiddleware(jwtUtils), postHandler.AddComment)
		}

		articles := api.Group("/articles")
		{
			articles.GET("", articleHandler.GetArticles)
			articles.GET("/:id", articleHandler.GetArticle)
		}

		chatGroup := api.Group("/chat")
		{
			chatGroup.GET("/rooms", chatHandler.GetRooms)
			chatGroup.GET("/rooms/:slug/history", chatHandler.GetHistory)
		}

		api.GET("/feed", feedHandler.GetFeed)

		admin := api.Group("/admin", middleware.AuthMiddleware(jwtUtils), middleware.AdminMiddleware())
		{
			admin.GET("/users", adminHandler.GetUsers)
			admin.GET("/posts", adminHandler.GetPosts)
			admin.DELETE("/posts/:id", adminHandler.DeletePost)
			admin.GET("/articles", adminHandler.GetArticles)
			admin.POST("/articles", adminHandler.CreateArticle)
			admin.DELETE("/articles/:id", adminHandler.DeleteArticle)
		}
	}

	// WebSocket endpoint (outside /api/ for nginx routing)
	router.GET("/ws/chat/:slug", chatHandler.ServeWS)

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	log.Printf("Server starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
