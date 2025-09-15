package services

import (
    "errors"
    "task-management/internal/config"
    "task-management/internal/models"
    "task-management/internal/repository"
    "task-management/internal/utils"
    "task-management/internal/auth"
    
    "gorm.io/gorm"
)

type AuthService interface {
    Register(username, email, password, firstName string) (*models.User, error)
    Login(username, password string) (string, *models.User, error)
}

type authService struct {
    userRepo repository.UserRepository
    config   *config.Config
}

func NewAuthService(userRepo repository.UserRepository, cfg *config.Config) AuthService {
    return &authService{
        userRepo: userRepo,
        config:   cfg,
    }
}

func (s *authService) Register(username, email, password, firstName string) (*models.User, error) {
    // Check if user exists
    if _, err := s.userRepo.GetByUsername(username); err == nil {
        return nil, errors.New("username already exists")
    }
    
    if _, err := s.userRepo.GetByEmail(email); err == nil {
        return nil, errors.New("email already exists")
    }
    
    // Hash password
    hashedPassword, err := utils.HashPassword(password)
    if err != nil {
        return nil, errors.New("failed to hash password")
    }
    
    // Create user
    user := &models.User{
        Username:     username,
        Email:        email,
        PasswordHash: hashedPassword,
        FirstName:    firstName,
        IsActive:     true,
    }
    
    if err := s.userRepo.Create(user); err != nil {
        return nil, errors.New("failed to create user")
    }
    
    return user, nil
}

func (s *authService) Login(username, password string) (string, *models.User, error) {
    user, err := s.userRepo.GetByUsername(username)
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return "", nil, errors.New("invalid credentials")
        }
        return "", nil, errors.New("database error")
    }
    
    if !utils.CheckPasswordHash(password, user.PasswordHash) {
        return "", nil, errors.New("invalid credentials")
    }
    
    token, err := auth.GenerateToken(user.ID, s.config)
    if err != nil {
        return "", nil, errors.New("failed to generate token")
    }
    
    return token, user, nil
}