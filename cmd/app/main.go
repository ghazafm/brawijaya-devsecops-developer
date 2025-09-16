package main

import (
    "log"
    "net/http"
    
    "task-management/internal/auth"
    "task-management/internal/config"
    "task-management/internal/database"
    "task-management/internal/handlers"
    "task-management/internal/repository"
    "task-management/internal/services"
    
    "github.com/gin-gonic/gin"
)

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
    if err := router.Run(serverAddr); err != nil {
        log.Fatal("Failed to start server:", err)
    }
}

func setupRoutes(authHandler *handlers.AuthHandler, todoHandler *handlers.TodoHandler, cfg *config.Config) *gin.Engine {
    router := gin.Default()
    
    // CORS middleware
    router.Use(func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }
        
        c.Next()
    })
    
    // Health check
    router.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "status":  "ok",
            "message": "Task Management API is running",
        })
    })
    
    // API routes
    api := router.Group("/api/v1")
    
    // Auth routes (no authentication required)
    // FIXED: Mengubah nama variable dari 'auth' menjadi 'authRoutes'
    authRoutes := api.Group("/auth")
    {
        authRoutes.POST("/register", authHandler.Register)
        authRoutes.POST("/login", authHandler.Login)
    }
    
    // Protected routes (authentication required)
    protected := api.Group("/")
    // FIXED: Sekarang bisa menggunakan package 'auth' tanpa konflik
    protected.Use(auth.AuthMiddleware(cfg))
    {
        // Todo routes
        todos := protected.Group("/todos")
        {
            todos.POST("/", todoHandler.CreateTodo)
            todos.GET("/", todoHandler.GetTodos)
            todos.GET("/:id", todoHandler.GetTodo)
            todos.PUT("/:id", todoHandler.UpdateTodo)
            todos.DELETE("/:id", todoHandler.DeleteTodo)
        }
        
        // User profile route
        protected.GET("/profile", func(c *gin.Context) {
            userID, exists := c.Get("userID")
            if !exists {
                c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
                return
            }
            
            // You can implement user profile service here
            c.JSON(http.StatusOK, gin.H{
                "status":  "success",
                "message": "User profile",
                "data": gin.H{
                    "user_id": userID,
                },
            })
        })
    }
    
    return router
}