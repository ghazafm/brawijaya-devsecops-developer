package models

import (
    "time"
    "gorm.io/gorm"
)

type Priority string
type Category string
type Status string

const (
    PriorityLow    Priority = "low"
    PriorityMedium Priority = "medium"
    PriorityHigh   Priority = "high"
)

const (
    CategoryWork     Category = "work"
    CategoryPersonal Category = "personal"
    CategoryShopping Category = "shopping"
    CategoryHealth   Category = "health"
    CategoryOther    Category = "other"
)

const (
    StatusTodo       Status = "todo"
    StatusInProgress Status = "inprogress"
    StatusDone       Status = "done"
)

type Todo struct {
    ID          uint       `json:"id" gorm:"primaryKey;column:todo_id"`
    PublicID    uint       `json:"public_id" gorm:"uniqueIndex;autoIncrement"`
    UserID      uint       `json:"user_id" gorm:"not null"`
    CategoryID  *uint      `json:"category_id"`
    Title       string     `json:"title" gorm:"not null"`
    Description string     `json:"description"`
    Priority    Priority   `json:"priority" gorm:"type:varchar(50);default:medium"`
    Category    Category   `json:"category" gorm:"type:varchar(50);default:personal"`
    Status      Status     `json:"status" gorm:"type:varchar(50);default:todo"`
    DueDate     *time.Time `json:"due_date"`
    CreatedAt   time.Time  `json:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at"`
    DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
    
    // Relations
    User     User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
    Subtasks []Subtask `json:"subtasks,omitempty" gorm:"foreignKey:TodoID"`
}

func (Todo) TableName() string {
    return "todos"
}