package database

import (
	"fmt"
	"log"

	"gaming-lag-platform/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database struct {
	DB *gorm.DB
}

func NewDatabase(databaseURL string) (*Database, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return &Database{DB: db}, nil
}

func (d *Database) Migrate() error {
	log.Println("Running database migrations...")

	err := d.DB.AutoMigrate(
		&models.User{},
		&models.NetworkTest{},
		&models.GameServer{},
		&models.Post{},
		&models.Comment{},
		&models.Article{},
		&models.LFGRequest{},
		&models.ChatRoom{},
		&models.ChatMessage{},
	)
	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("Migrations completed successfully")
	return nil
}

func (d *Database) Seed() error {
	log.Println("Seeding database...")

	var count int64
	d.DB.Model(&models.GameServer{}).Count(&count)
	if count == 0 {
		// Real IPs: Valve SDR relays for CS2/Dota2, port 443 for others (more reliable TCP response)
		gameServers := []models.GameServer{
			{Name: "CS2 Москва",       IP: "185.25.182.9",   Port: 27015, Game: "CS2",       Region: "RU"},
			{Name: "CS2 Франкфурт",    IP: "155.133.248.90", Port: 27015, Game: "CS2",       Region: "EU"},
			{Name: "CS2 Варшава",      IP: "185.40.64.5",    Port: 27015, Game: "CS2",       Region: "EU"},
			{Name: "Dota 2 Москва",    IP: "185.25.182.10",  Port: 27015, Game: "Dota2",     Region: "RU"},
			{Name: "Dota 2 Стокгольм", IP: "155.133.249.6",  Port: 27015, Game: "Dota2",     Region: "EU"},
			{Name: "Valorant EU",      IP: "104.160.131.3",  Port: 443,   Game: "Valorant",  Region: "EU"},
			{Name: "WoW EU",           IP: "37.244.47.12",   Port: 443,   Game: "WoW",       Region: "EU"},
			{Name: "Apex Amsterdam",   IP: "104.22.52.230",  Port: 443,   Game: "Apex",      Region: "EU"},
			{Name: "PUBG Сеул",        IP: "203.248.160.0",  Port: 443,   Game: "PUBG",      Region: "ASIA"},
			{Name: "Overwatch 2 EU",   IP: "37.244.48.0",    Port: 443,   Game: "Overwatch2", Region: "EU"},
		}
		for _, server := range gameServers {
			d.DB.Create(&server)
		}
		log.Println("Game servers seeded")
	}

	// Create system/editor account so posts & articles are always available
	var userCount int64
	d.DB.Model(&models.User{}).Count(&userCount)
	if userCount == 0 {
		hash, _ := bcrypt.GenerateFromPassword([]byte("Nereguet2025!"), bcrypt.DefaultCost)
		admin := models.User{
			Email:        "admin@nereguet.ru",
			PasswordHash: string(hash),
			Nickname:     "Редакция",
		}
		if err := d.DB.Create(&admin).Error; err != nil {
			log.Printf("Warning: could not create admin user: %v", err)
		} else {
			log.Println("Admin user created: admin@nereguet.ru / Nereguet2025!")
		}
	}

	// Seed posts and articles (uses first user as author)
	if err := d.SeedPostsAndArticles(); err != nil {
		log.Printf("Warning: Failed to seed posts and articles: %v", err)
	}

	if err := d.SeedChatRooms(); err != nil {
		log.Printf("Warning: Failed to seed chat rooms: %v", err)
	}

	return nil
}
