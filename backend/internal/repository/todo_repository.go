package repository

import (
    "task-management/internal/models"
    
    "gorm.io/gorm"
)

type TodoRepository interface {
    Create(todo *models.Todo) error
    GetByUserID(userID uint, status, category string) ([]models.Todo, error)
    GetByIDPublic(id uint) (*models.Todo, error)
    GetByID(id, userID uint) (*models.Todo, error)
    Update(todo *models.Todo) error
    Delete(id, userID uint) error
}

type todoRepository struct {
    db *gorm.DB
}

func NewTodoRepository(db *gorm.DB) TodoRepository {
    return &todoRepository{db: db}
}

func (r *todoRepository) Create(todo *models.Todo) error {
    return r.db.Create(todo).Error
}

func (r *todoRepository) GetByUserID(userID uint, status, category string) ([]models.Todo, error) {
    var todos []models.Todo
    query := r.db.Where("user_id = ?", userID)
    
    if status != "" {
        query = query.Where("status = ?", status)
    }
    
    if category != "" {
        query = query.Where("category = ?", category)
    }
    
    err := query.Order("created_at DESC").Find(&todos).Error
    return todos, err
}

func (r *todoRepository) GetByID(id, userID uint) (*models.Todo, error) {
    var todo models.Todo
    err := r.db.Where("todo_id = ? AND user_id = ?", id, userID).
        Preload("Subtasks").
        First(&todo).Error
    return &todo, err
}

func (r *todoRepository) Update(todo *models.Todo) error {
    return r.db.Save(todo).Error
}

func (r *todoRepository) Delete(id, userID uint) error {
    return r.db.Where("todo_id = ? AND user_id = ?", id, userID).
        Delete(&models.Todo{}).Error
}

func (r *todoRepository) GetByIDPublic(id uint) (*models.Todo, error) {
	var todo models.Todo
	err := r.db.Where("todo_id = ?", id).
		Preload("Subtasks").
		First(&todo).Error
	return &todo, err
}
