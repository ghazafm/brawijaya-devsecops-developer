package auth

import (
    "fmt"
    "time"
    
    "task-management/internal/config"
    
    "github.com/golang-jwt/jwt/v4"
)

type Claims struct {
    UserID uint `json:"user_id"`
    jwt.RegisteredClaims
}

func GenerateToken(userID uint, cfg *config.Config) (string, error) {
    expirationTime := time.Now().Add(cfg.JWT.Expiration)
    claims := &Claims{
        UserID: userID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(expirationTime),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(cfg.JWT.Secret))
}

func ValidateToken(tokenString string, cfg *config.Config) (*Claims, error) {
    claims := &Claims{}
    token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return []byte(cfg.JWT.Secret), nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if !token.Valid {
        return nil, fmt.Errorf("invalid token")
    }
    
    return claims, nil
}