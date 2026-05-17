package service

import (
	"errors"
	"gaming-lag-platform/internal/models"
	"gaming-lag-platform/internal/repository"
	"gaming-lag-platform/pkg/utils"

	"github.com/google/uuid"
)

type AuthService struct {
	userRepo *repository.UserRepository
	jwtUtils *utils.JWTUtils
}

func NewAuthService(userRepo *repository.UserRepository, jwtUtils *utils.JWTUtils) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		jwtUtils: jwtUtils,
	}
}

type RegisterInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Nickname string `json:"nickname" validate:"required,min=3,max=100"`
}

type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func (s *AuthService) Register(input RegisterInput) (*models.User, string, error) {
	existingUser, _ := s.userRepo.GetByEmail(input.Email)
	if existingUser != nil {
		return nil, "", errors.New("email already registered")
	}

	existingUser, _ = s.userRepo.GetByNickname(input.Nickname)
	if existingUser != nil {
		return nil, "", errors.New("nickname already taken")
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, "", err
	}

	user := &models.User{
		Email:        input.Email,
		PasswordHash: hashedPassword,
		Nickname:     input.Nickname,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, "", err
	}

	token, err := s.jwtUtils.GenerateToken(user.ID, user.Email, user.Nickname, user.Role)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) Login(input LoginInput) (*models.User, string, error) {
	user, err := s.userRepo.GetByEmail(input.Email)
	if err != nil {
		return nil, "", errors.New("invalid email or password")
	}

	if !utils.CheckPasswordHash(input.Password, user.PasswordHash) {
		return nil, "", errors.New("invalid email or password")
	}

	token, err := s.jwtUtils.GenerateToken(user.ID, user.Email, user.Nickname, user.Role)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

type UpdateProfileInput struct {
	Nickname string `json:"nickname"`
}

func (s *AuthService) UpdateProfile(userID uuid.UUID, input UpdateProfileInput) (*models.User, string, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, "", errors.New("user not found")
	}

	if input.Nickname != "" && input.Nickname != user.Nickname {
		runes := []rune(input.Nickname)
		if len(runes) < 3 || len(runes) > 100 {
			return nil, "", errors.New("nickname must be 3-100 characters")
		}
		existing, _ := s.userRepo.GetByNickname(input.Nickname)
		if existing != nil {
			return nil, "", errors.New("nickname already taken")
		}
		user.Nickname = input.Nickname
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, "", err
	}

	token, err := s.jwtUtils.GenerateToken(user.ID, user.Email, user.Nickname, user.Role)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) GetMe(userID string) (*models.User, error) {
	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}
	user, err := s.userRepo.GetByID(parsedID)
	if err != nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}
