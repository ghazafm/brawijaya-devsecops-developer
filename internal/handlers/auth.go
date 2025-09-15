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
    Username  string `json:"username" binding:"required"`
    Email     string `json:"email" binding:"required,email"`
    Password  string `json:"password" binding:"required,min=6"`
    FirstName string `json:"first_name"`
}

type LoginRequest struct {
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
}

func NewAuthHandler(authService services.AuthService) *AuthHandler {
    return &AuthHandler{
        authService: authService,
    }
}

func (h *AuthHandler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ValidationErrorResponse(c, err.Error())
        return
    }
    
    user, err := h.authService.Register(req.Username, req.Email, req.Password, req.FirstName)
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
        return
    }
    
    utils.SuccessResponse(c, "User registered successfully", gin.H{
        "user_id": user.ID,
        "user":    user,
    })
}

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