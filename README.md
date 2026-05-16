# НЕ РЕГАЕТ - Платформа мониторинга сети для геймеров

![Status](https://img.shields.io/badge/status-ready-success)
![Go](https://img.shields.io/badge/Go-1.21-blue)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![TimescaleDB](https://img.shields.io/badge/TimescaleDB-latest-blue)

## Описание

Платформа для онлайн-игроков для мониторинга сетевых задержек, сравнения результатов с другими игроками и чтения статей о решении проблем.

### Возможности

- 🚀 **Тест сети** - измерение пинга, джиттера и потерь пакетов
- 📊 **Статистика** - графики и история тестов
- 🏆 **Таблица лидеров** - сравнение с другими игроками
- 📰 **Новости и статьи** - полезная информация о решении сетевых проблем
- 👤 **Профиль** - личная статистика и история тестов

## Технологический стек

### Backend
- **Язык**: Go 1.21+
- **Фреймворк**: Gin
- **База данных**: PostgreSQL 15 + TimescaleDB
- **ORM**: GORM
- **Auth**: JWT-токены
- **Hashing**: bcrypt

### Frontend
- **Фреймворк**: React 18 + TypeScript
- **Build tool**: Vite
- **UI Library**: Ant Design 5.x
- **Charts**: Recharts
- **HTTP client**: Axios
- **Routing**: React Router v6
- **State management**: Zustand

### DevOps
- **Docker** + **Docker Compose**
- **Nginx** (reverse proxy)

## Быстрый старт

### Требования

- Docker
- Docker Compose

### Запуск

```bash
docker-compose up --build
```

После запуска приложение будет доступно по адресу:
- **Frontend**: http://localhost
- **API**: http://localhost:8080/api
- **PostgreSQL**: localhost:5432

### Остановка

```bash
docker-compose down
```

Для удаления данных:

```bash
docker-compose down -v
```

## Переменные окружения

### Backend

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| PORT | Порт сервера | 8080 |
| DATABASE_URL | URL подключения к БД | postgres://gaming_user:gaming_password@postgres:5432/gaming_db?sslmode=disable |
| JWT_SECRET | Секретный ключ JWT | super-secret-jwt-key-change-in-production |
| JWT_EXPIRATION | Время жизни токена | 24h |

### Frontend

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| VITE_API_URL | URL API | http://localhost:8080/api |

## Структура API

### Auth

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| GET | /api/auth/me | Получить текущего пользователя |

### Network

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | /api/network/test | Отправить результат теста |
| GET | /api/network/tests | Получить историю тестов |
| GET | /api/network/stats | Получить статистику |
| GET | /api/network/leaderboard | Таблица лидеров |
| GET | /api/network/servers | Список игровых серверов |
| POST | /api/network/test-server | Тест сервера |

### Posts

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | /api/posts | Получить все посты |
| POST | /api/posts | Создать пост |
| GET | /api/posts/:id | Получить пост |
| PUT | /api/posts/:id | Обновить пост |
| DELETE | /api/posts/:id | Удалить пост |
| POST | /api/posts/:id/comments | Добавить комментарий |

### Articles

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | /api/articles | Получить все статьи |
| GET | /api/articles/:id | Получить статью |

## Структура проекта

```
ppproject/
├── backend/
│   ├── cmd/api/main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── handlers/
│   │   ├── models/
│   │   ├── repository/
│   │   ├── service/
│   │   └── middleware/
│   ├── pkg/
│   │   ├── database/
│   │   └── utils/
│   ├── migrations/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Разработка

### Backend

```bash
cd backend
go mod download
go run cmd/api/main.go
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Команда проекта

Разработано в рамках учебного проекта.

## Лицензия

MIT
