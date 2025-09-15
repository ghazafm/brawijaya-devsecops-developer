package handlers

import (
    "net/http"
    "strconv"
    "task-management/internal/models"
    "task-management/internal/services"
    "task-management/internal/utils"
    
    "github.com/gin-gonic/gin"
)

type TodoHandler struct {
    todoService services.TodoService
}

type CreateTodoRequest struct {
    Title       string           `json:"title" binding:"required"`
    Description string           `json:"description"`
    Priority    models.Priority  `json:"priority"`
    Category    models.Category  `json:"category"`
    DueDate     interface{}      `json:"due_date"`
}

type UpdateTodoRequest struct {
    Title       string          `json:"title"`
    Description string          `json:"description"`
    Priority    models.Priority `json:"priority"`
    Category    models.Category `json:"category"`
    Status      models.Status   `json:"status"`
    DueDate     interface{}     `json:"due_date"`
}

func NewTodoHandler(todoService services.TodoService) *TodoHandler {
    return &TodoHandler{
        todoService: todoService,
    }
}

func (h *TodoHandler) CreateTodo(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        utils.ErrorResponse(c, http.StatusUnauthorized, "User not authenticated")
        return
    }
    
    var req CreateTodoRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ValidationErrorResponse(c, err.Error())
        return
    }
    
    // Set defaults
    if req.Priority == "" {
        req.Priority = models.PriorityMedium
    }
    if req.Category == "" {
        req.Category = models.CategoryPersonal
    }
    
    todo, err := h.todoService.CreateTodo(
        userID.(uint),
        req.Title,
        req.Description,
        req.Priority,
        req.Category,
        req.DueDate,
    )
    
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
        return
    }
    
    utils.SuccessResponse(c, "Todo created successfully", todo)
}

func (h *TodoHandler) GetTodos(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        utils.ErrorResponse(c, http.StatusUnauthorized, "User not authenticated")
        return
    }
    
    status := c.Query("status")
    category := c.Query("category")
    
    todos, err := h.todoService.GetTodos(userID.(uint), status, category)
    if err != nil {
        utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
        return
    }
    
    utils.SuccessResponse(c, "Todos retrieved successfully", todos)
}

func (h *TodoHandler) GetTodo(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        utils.ErrorResponse(c, http.StatusUnauthorized, "User not authenticated")
        return
    }
    
    todoID, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        utils.ValidationErrorResponse(c, "Invalid todo ID")
        return
    }
    
    todo, err := h.todoService.GetTodoByID(uint(todoID), userID.(uint))
    if err != nil {
        utils.ErrorResponse(c, http.StatusNotFound, err.Error())
        return
    }
    
    utils.SuccessResponse(c, "Todo retrieved successfully", todo)
}

func (h *TodoHandler) UpdateTodo(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        utils.ErrorResponse(c, http.StatusUnauthorized, "User not authenticated")
        return
    }
    
    todoID, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        utils.ValidationErrorResponse(c, "Invalid todo ID")
        return
    }
    
    var req UpdateTodoRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ValidationErrorResponse(c, err.Error())
        return
    }
    
    // Build updates map
    updates := make(map[string]interface{})
    if req.Title != "" {
        updates["title"] = req.Title
    }
    if req.Description != "" {
        updates["description"] = req.Description
    }
    if req.Priority != "" {
        updates["priority"] = req.Priority
    }
    if req.Category != "" {
        updates["category"] = req.Category
    }
    if req.Status != "" {
        updates["status"] = req.Status
    }
    
    todo, err := h.todoService.UpdateTodo(uint(todoID), userID.(uint), updates)
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
        return
    }
    
    utils.SuccessResponse(c, "Todo updated successfully", todo)
}

func (h *TodoHandler) DeleteTodo(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        utils.ErrorResponse(c, http.StatusUnauthorized, "User not authenticated")
        return
    }
    
    todoID, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        utils.ValidationErrorResponse(c, "Invalid todo ID")
        return
    }
    
    if err := h.todoService.DeleteTodo(uint(todoID), userID.(uint)); err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
        return
    }
    
    utils.SuccessResponse(c, "Todo deleted successfully", nil)
}