package models

import (
	"time"
)

type User struct {
	ID           uint      `json:"id" gorm:"primaryKey;column:user_id"`
	Username     string    `json:"username" gorm:"uniqueIndex;not null"`
	Email        string    `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string    `json:"-" gorm:"not null"`
	Password     string    `json:"password" gorm:"not null"`
	FullName     string    `json:"full_name"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`

	Todos []Todo `json:"todos,omitempty" gorm:"foreignKey:UserID"`
}

func (User) TableName() string {
	return "users"
}
