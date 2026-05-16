package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"net/http"
)

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			for _, e := range c.Errors {
				if err, ok := e.Err.(validator.ValidationErrors); ok {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}
			}
		}
	}
}
