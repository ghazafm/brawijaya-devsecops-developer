package database

import (
    "fmt"
    "log"
    
    "task-management/internal/config"
    "task-management/internal/models"
    
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
    dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
        cfg.Database.Host,
        cfg.Database.User,
        cfg.Database.Password,
        cfg.Database.Name,
        cfg.Database.Port,
        cfg.Database.SSLMode,
    )
    
    var err error
    DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    
    if err != nil {
        return fmt.Errorf("failed to connect to database: %w", err)
    }
    
    log.Println("Database connected successfully")
    return nil
}

func Migrate() error {
    err := DB.AutoMigrate(
        &models.User{},
        &models.Todo{},
        &models.Subtask{},
    )
    
    if err != nil {
        return fmt.Errorf("failed to migrate database: %w", err)
    }
    
    log.Println("Database migrated successfully")
    return nil
}

func GetDB() *gorm.DB {
    return DB
}