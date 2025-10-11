package handlers

import (
	"time"
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
	Title       string          `json:"title" binding:"required" example:"Buy groceries"`
	Description string          `json:"description" example:"Need to buy milk, eggs, and bread"`
	Priority    models.Priority `json:"priority" enums:"low,medium,high" example:"medium"`
	Category    models.Category `json:"category" enums:"personal,work,shopping,health,other" example:"personal"`
	DueDate     string          `json:"due_date" example:"2024-12-31T23:59:59Z"`
}

type UpdateTodoRequest struct {
	Title       string          `json:"title" example:"Buy groceries"`
	Description string          `json:"description" example:"Need to buy milk, eggs, and bread"`
	Priority    models.Priority `json:"priority" enums:"low,medium,high" example:"high"`
	Category    models.Category `json:"category" enums:"personal,work,shopping,health,other" example:"work"`
	Status      models.Status   `json:"status" enums:"pending,in_progress,completed" example:"completed"`
	DueDate     string          `json:"due_date" example:"2024-12-31T23:59:59Z"`
}

type TodoResponse struct {
	Status  string      `json:"status" example:"success"`
	Message string      `json:"message" example:"Operation successful"`
	Data    interface{} `json:"data,omitempty"`
}

func NewTodoHandler(todoService services.TodoService) *TodoHandler {
	return &TodoHandler{
		todoService: todoService,
	}
}

// CreateTodo godoc
// @Summary Create a new todo
// @Description Create a new todo item for the authenticated user
// @Tags Todos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body CreateTodoRequest true "Create Todo Request"
// @Success 200 {object} TodoResponse "Todo created successfully"
// @Failure 400 {object} TodoResponse "Invalid request"
// @Failure 401 {object} TodoResponse "Unauthorized"
// @Failure 422 {object} TodoResponse "Validation error"
// @Router /todos [post]
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

	// Parse DueDate (opsional)
	var dueDatePtr *time.Time
	if req.DueDate != "" {
		parsed, err := time.Parse(time.RFC3339, req.DueDate)
		if err != nil {
			utils.ValidationErrorResponse(c, "Invalid date format. Use RFC3339 (e.g., 2024-12-31T23:59:59Z)")
			return
		}
		dueDatePtr = &parsed
	}

	todo, err := h.todoService.CreateTodo(
		userID.(uint),
		req.Title,
		req.Description,
		req.Priority,
		req.Category,
		dueDatePtr, // ✅ sudah *time.Time
	)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, "Todo created successfully", todo)
}


// GetTodos godoc
// @Summary Get all todos
// @Description Get all todos for the authenticated user with optional filters
// @Tags Todos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param status query string false "Filter by status" Enums(pending, in_progress, completed)
// @Param category query string false "Filter by category" Enums(personal, work, shopping, health, other)
// @Success 200 {object} TodoResponse "Todos retrieved successfully"
// @Failure 401 {object} TodoResponse "Unauthorized"
// @Failure 500 {object} TodoResponse "Internal server error"
// @Router /todos [get]
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

// GetTodo godoc
// @Summary Get a todo by ID
// @Description Get a specific todo by ID for the authenticated user
// @Tags Todos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Todo ID"
// @Success 200 {object} TodoResponse "Todo retrieved successfully"
// @Failure 400 {object} TodoResponse "Invalid todo ID"
// @Failure 401 {object} TodoResponse "Unauthorized"
// @Failure 404 {object} TodoResponse "Todo not found"
// @Router /todos/{id} [get]
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

// UpdateTodo godoc
// @Summary Update a todo
// @Description Update a specific todo by ID for the authenticated user
// @Tags Todos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Todo ID"
// @Param request body UpdateTodoRequest true "Update Todo Request"
// @Success 200 {object} TodoResponse "Todo updated successfully"
// @Failure 400 {object} TodoResponse "Invalid request or todo ID"
// @Failure 401 {object} TodoResponse "Unauthorized"
// @Failure 422 {object} TodoResponse "Validation error"
// @Router /todos/{id} [put]
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

// DeleteTodo godoc
// @Summary Delete a todo
// @Description Delete a specific todo by ID for the authenticated user
// @Tags Todos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Todo ID"
// @Success 200 {object} TodoResponse "Todo deleted successfully"
// @Failure 400 {object} TodoResponse "Invalid request or todo ID"
// @Failure 401 {object} TodoResponse "Unauthorized"
// @Router /todos/{id} [delete]
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

// GetByPublicID godoc
// @Summary Get todo by public ID
// @Description Get detail of a todo (and subtasks) using its public ID
// @Tags todos
// @Param id path int true "Public ID of the Todo"
// @Produce json
// @Success 200 {object} utils.Response
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /todos/public/{id} [get]
func (h *TodoHandler) GetByPublicID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid todo ID format")
		return
	}

	todo, err := h.todoService.GetByIDPublic(uint(id))
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Todo not found")
		return
	}

	utils.SuccessResponse(c, "Todo retrieved successfully", todo)
}
