package config

import (
    "log"
    "os"
    "strconv"
    "time"
    
    "github.com/joho/godotenv"
)

type Config struct {
    Database DatabaseConfig
    JWT      JWTConfig
    Server   ServerConfig
}

type DatabaseConfig struct {
    Host     string
    Port     string
    Name     string
    User     string
    Password string
    SSLMode  string
}

type JWTConfig struct {
    Secret     string
    Expiration time.Duration
}

type ServerConfig struct {
    Host string
    Port string
}

func Load() *Config {
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found, using environment variables")
    }
    
    jwtExpHours, _ := strconv.Atoi(getEnv("JWT_EXPIRATION_HOURS", "24"))
    
    return &Config{
        Database: DatabaseConfig{
            Host:     getEnv("DB_HOST", "localhost"),
            Port:     getEnv("DB_PORT", "5432"),
            Name:     getEnv("DB_NAME", "taskmanagement"),
            User:     getEnv("DB_USER", "postgres"),
            Password: getEnv("DB_PASSWORD", ""),
            SSLMode:  getEnv("DB_SSLMODE", "disable"),
        },
        JWT: JWTConfig{
            Secret:     getEnv("JWT_SECRET", "your-secret-key"),
            Expiration: time.Duration(jwtExpHours) * time.Hour,
        },
        Server: ServerConfig{
            Host: getEnv("SERVER_HOST", "localhost"),
            Port: getEnv("SERVER_PORT", "8080"),
        },
    }
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}