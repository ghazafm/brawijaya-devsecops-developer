package handlers

import (
    "net/http"
    "task-management/internal/services"
    "task-management/internal/utils"
    
    "github.com/gin-gonic/gin"
)

type AuthHandler struct {
    authService services.AuthService
}

type RegisterRequest struct {
    Username  string `json:"username" binding:"required" example:"johndoe"`
    Email     string `json:"email" binding:"required,email" example:"john@example.com"`
    Password  string `json:"password" binding:"required,min=6" example:"password123"`
    FullName string `json:"full_name" example:"John"`
}

type LoginRequest struct {
    Username string `json:"username" binding:"required" example:"johndoe"`
    Password string `json:"password" binding:"required" example:"password123"`
}

type AuthResponse struct {
    Status  string      `json:"status" example:"success"`
    Message string      `json:"message" example:"Operation successful"`
    Data    interface{} `json:"data,omitempty"`
}

func NewAuthHandler(authService services.AuthService) *AuthHandler {
    return &AuthHandler{
        authService: authService,
    }
}

// Register godoc
// @Summary Register a new user
// @Description Create a new user account with username, email, and password
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Register Request"
// @Success 200 {object} AuthResponse "User registered successfully"
// @Failure 400 {object} AuthResponse "Invalid request or user already exists"
// @Failure 422 {object} AuthResponse "Validation error"
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ValidationErrorResponse(c, err.Error())
        return
    }
    
    user, err := h.authService.Register(req.Username, req.Email, req.Password, req.FullName)
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
        return
    }
    
    utils.SuccessResponse(c, "User registered successfully", gin.H{
        "user_id": user.ID,
        "user":    user,
    })
}

// Login godoc
// @Summary User login
// @Description Authenticate user with username and password, returns JWT token
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login Request"
// @Success 200 {object} AuthResponse "Login successful with token"
// @Failure 401 {object} AuthResponse "Invalid credentials"
// @Failure 422 {object} AuthResponse "Validation error"
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ValidationErrorResponse(c, err.Error())
        return
    }
    
    token, user, err := h.authService.Login(req.Username, req.Password)
    if err != nil {
        utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
        return
    }
    
    utils.SuccessResponse(c, "Login successful", gin.H{
        "token": token,
        "user":  user,
    })
}

 // LoginVulnerable godoc
 // @Summary Vulnerable login (FOR TESTING ONLY)
 // @Description Demonstrasi endpoint rentan SQL injection. Hanya untuk testing lokal/edukasi.
 // @Tags Authentication
 // @Accept json
 // @Produce json
 // @Param request body LoginRequest true "Login Request"
 // @Success 200 {object} AuthResponse "Login successful (vulnerable)"
 // @Failure 401 {object} AuthResponse "Invalid credentials"
 // @Failure 422 {object} AuthResponse "Validation error"
 // @Router /auth/login-vulnerable [post]
func (h *AuthHandler) LoginVulnerable(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ValidationErrorResponse(c, err.Error())
        return
    }

    // Panggil service vulnerable (pastikan method tersedia di interface)
    token, user, err := h.authService.LoginVulnerable(req.Username, req.Password)
    if err != nil {
        // Untuk konsistensi, jangan berikan detail error yang berlebihan
        utils.ErrorResponse(c, http.StatusUnauthorized, "invalid credentials")
        return
    }

    utils.SuccessResponse(c, "Login successful (vulnerable - testing only)", gin.H{
        "token": token,
        "user":  user,
    })
}