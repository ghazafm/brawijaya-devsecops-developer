package services

import (
    "time"
    "errors"
    "task-management/internal/models"
    "task-management/internal/repository"
    
    "gorm.io/gorm"
)

type TodoService interface {
    CreateTodo(userID uint, title, description string, priority models.Priority, category models.Category, dueDate *time.Time) (*models.Todo, error)
    GetTodos(userID uint, status, category string) ([]models.Todo, error)
    GetTodoByID(id, userID uint) (*models.Todo, error)
    GetByIDPublic(id uint) (*models.Todo, error)
    UpdateTodo(id, userID uint, updates map[string]interface{}) (*models.Todo, error)
    DeleteTodo(id, userID uint) error
}

type todoService struct {
    todoRepo repository.TodoRepository
}

func NewTodoService(todoRepo repository.TodoRepository) TodoService {
    return &todoService{
        todoRepo: todoRepo,
    }
}

func (s *todoService) CreateTodo(
    userID uint,
    title, description string,
    priority models.Priority,
    category models.Category,
    dueDate *time.Time,
) (*models.Todo, error) {
    todo := &models.Todo{
        UserID:      userID,
        Title:       title,
        Description: description,
        Priority:    priority,
        Category:    category,
        Status:      models.StatusTodo,
        DueDate:     dueDate,
    }

    if err := s.todoRepo.Create(todo); err != nil {
        return nil, errors.New("failed to create todo")
    }

    return todo, nil
}

func (s *todoService) GetTodos(userID uint, status, category string) ([]models.Todo, error) {
    return s.todoRepo.GetByUserID(userID, status, category)
}

func (s *todoService) GetTodoByID(id, userID uint) (*models.Todo, error) {
    todo, err := s.todoRepo.GetByID(id, userID)
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("todo not found")
        }
        return nil, errors.New("database error")
    }
    return todo, nil
}

func (s *todoService) GetByIDPublic(id uint) (*models.Todo, error) {
	return s.todoRepo.GetByIDPublic(id)
}

func (s *todoService) UpdateTodo(id, userID uint, updates map[string]interface{}) (*models.Todo, error) {
    todo, err := s.GetTodoByID(id, userID)
    if err != nil {
        return nil, err
    }
    
    // Apply updates
    for key, value := range updates {
        switch key {
        case "title":
            if v, ok := value.(string); ok {
                todo.Title = v
            }
        case "description":
            if v, ok := value.(string); ok {
                todo.Description = v
            }
        case "status":
            if v, ok := value.(string); ok {
                todo.Status = models.Status(v)
            }
        case "priority":
            if v, ok := value.(string); ok {
                todo.Priority = models.Priority(v)
            }
        case "category":
            if v, ok := value.(string); ok {
                todo.Category = models.Category(v)
            }
        }
    }
    
    if err := s.todoRepo.Update(todo); err != nil {
        return nil, errors.New("failed to update todo")
    }
    
    return todo, nil
}

func (s *todoService) DeleteTodo(id, userID uint) error {
    // Check if todo exists and belongs to user
    _, err := s.GetTodoByID(id, userID)
    if err != nil {
        return err
    }
    
    return s.todoRepo.Delete(id, userID)
}