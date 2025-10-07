package models

import (
    "time"
)

type CompletionStatus string

const (
    CompletionYes CompletionStatus = "yes"
    CompletionNo  CompletionStatus = "no"
)

type Subtask struct {
    ID          uint             `json:"id" gorm:"primaryKey;column:subtask_id"`
    TodoID      uint             `json:"todo_id" gorm:"not null"`
    Title       string           `json:"title" gorm:"not null"`
    IsCompleted CompletionStatus `json:"is_completed" gorm:"type:varchar(10);default:no"`
    CompletedAt *time.Time       `json:"completed_at"`
    CreatedAt   time.Time        `json:"created_at"`
    UpdatedAt   time.Time        `json:"updated_at"`
    
    // Relations
    Todo Todo `json:"todo,omitempty" gorm:"foreignKey:TodoID"`
}

func (Subtask) TableName() string {
    return "subtasks"
}