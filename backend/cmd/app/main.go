package main

import (
	"log"
	"net/http"
	"time"

	"task-management/internal/auth"
	"task-management/internal/config"
	"task-management/internal/database"
	"task-management/internal/handlers"
	"task-management/internal/repository"
	"task-management/internal/services"

	_ "task-management/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title Task Management API
// @version 1.0
// @description API untuk manajemen task/todo list
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.Migrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(database.GetDB())
	todoRepo := repository.NewTodoRepository(database.GetDB())

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg)
	todoService := services.NewTodoService(todoRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	todoHandler := handlers.NewTodoHandler(todoService)

	// Setup routes
	router := setupRoutes(authHandler, todoHandler, cfg)

	// Start server
	serverAddr := cfg.Server.Host + ":" + cfg.Server.Port
	log.Printf("Server starting on %s", serverAddr)
	log.Printf("Swagger documentation available at http://%s/swagger/index.html", serverAddr)
	if err := router.Run(serverAddr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupRoutes(authHandler *handlers.AuthHandler, todoHandler *handlers.TodoHandler, cfg *config.Config) *gin.Engine {
	router := gin.Default()

	// ✅ CORS middleware (gunakan library resmi gin-contrib/cors)
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://app.fauzanghaza.com", "http://localhost:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Swagger route
	router.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Task Management API is running",
		})
	})

	// API routes
	api := router.Group("/api/v1")

	authRoutes := api.Group("/auth")
	{
		authRoutes.POST("/register", authHandler.Register)
		authRoutes.POST("/login", authHandler.Login)
		authRoutes.POST("/login-vulnerable", authHandler.LoginVulnerable)
	}

	protected := api.Group("/")
	protected.Use(auth.AuthMiddleware(cfg))
	{
		todos := protected.Group("/todos")
		{
			todos.POST("/", todoHandler.CreateTodo)
			todos.GET("/", todoHandler.GetTodos)
			todos.GET("/:id", todoHandler.GetTodo)
			todos.GET("public/:id", todoHandler.GetByPublicID)
			todos.PUT("/:id", todoHandler.UpdateTodo)
			todos.DELETE("/:id", todoHandler.DeleteTodo)
		}

		protected.GET("/profile", func(c *gin.Context) {
			userID, exists := c.Get("userID")
			if !exists {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"status":  "success",
				"message": "User profile",
				"data":    gin.H{"user_id": userID},
			})
		})
	}

	return router
}
