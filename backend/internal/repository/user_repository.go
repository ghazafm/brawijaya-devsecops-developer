package repository

import (
	"task-management/internal/models"

	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *models.User) error
	GetByUsername(username string) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	GetByID(id uint) (*models.User, error)
	RawQuery(query string, dest interface{}) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

// SAFE VERSION
func (r *userRepository) GetByUsername(username string) (*models.User, error) {
    var user models.User
    err := r.db.Where("username = ? AND is_active = ?", username, true).First(&user).Error
    return &user, err
}


func (r *userRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ? AND is_active = ?", email, true).First(&user).Error
	return &user, err
}

func (r *userRepository) GetByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.Where("user_id = ? AND is_active = ?", id, true).First(&user).Error
	return &user, err
}

func (r *userRepository) RawQuery(query string, dest interface{}) error {
	return r.db.Raw(query).Scan(dest).Error
}
