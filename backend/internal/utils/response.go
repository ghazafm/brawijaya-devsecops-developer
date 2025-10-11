package utils

import (
    "net/http"
    
    "github.com/gin-gonic/gin"
)

type Response struct {
    Status  string      `json:"status"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}

func SuccessResponse(c *gin.Context, message string, data interface{}) {
    c.JSON(http.StatusOK, Response{
        Status:  "success",
        Message: message,
        Data:    data,
    })
}

func ErrorResponse(c *gin.Context, statusCode int, message string) {
    c.JSON(statusCode, Response{
        Status:  "error",
        Message: message,
    })
}

func ValidationErrorResponse(c *gin.Context, message string) {
    c.JSON(http.StatusBadRequest, Response{
        Status:  "error",
        Message: message,
    })
}