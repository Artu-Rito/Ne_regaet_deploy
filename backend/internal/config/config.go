package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	DatabaseURL   string
	JWTSecret     string
	JWTExpiration time.Duration
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	jwtExpirationStr := os.Getenv("JWT_EXPIRATION")
	if jwtExpirationStr == "" {
		jwtExpirationStr = "24h"
	}

	jwtExpiration, err := time.ParseDuration(jwtExpirationStr)
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRATION: %w", err)
	}

	return &Config{
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://gaming_user:gaming_password@localhost:5432/gaming_db?sslmode=disable"),
		JWTSecret:     getEnv("JWT_SECRET", "super-secret-jwt-key-change-in-production"),
		JWTExpiration: jwtExpiration,
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
