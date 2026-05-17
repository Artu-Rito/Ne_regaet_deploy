package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTClaims struct {
	UserID   uuid.UUID `json:"user_id"`
	Email    string    `json:"email"`
	Nickname string    `json:"nickname"`
	Role     string    `json:"role"`
	jwt.RegisteredClaims
}

type JWTUtils struct {
	secret     []byte
	expiration time.Duration
}

func NewJWTUtils(secret string, expiration time.Duration) *JWTUtils {
	return &JWTUtils{
		secret:     []byte(secret),
		expiration: expiration,
	}
}

func (j *JWTUtils) GenerateToken(userID uuid.UUID, email, nickname, role string) (string, error) {
	claims := JWTClaims{
		UserID:   userID,
		Email:    email,
		Nickname: nickname,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.expiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secret)
}

func (j *JWTUtils) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return j.secret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
