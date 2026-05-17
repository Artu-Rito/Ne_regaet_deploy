# НЕ РЕГАЕТ

Платформа для геймеров — замер пинга, лента постов, чат, статьи и LFG.

## Стек

- Backend: Go 1.23, Gin, GORM, PostgreSQL, JWT, WebSocket
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Zustand
- Инфраструктура: Docker Compose, Nginx

## Запуск

```bash
docker-compose up --build
```

Приложение: http://localhost  
API: http://localhost/api

Для сброса данных:

```bash
docker-compose down -v
```

## Аккаунт администратора

```
Email: admin@nereguet.ru
Пароль: Nereguet2025!
```

Панель: http://localhost/admin

## Переменные окружения (backend)

| Переменная | По умолчанию |
|------------|--------------|
| PORT | 8080 |
| DATABASE_URL | postgres://gaming_user:gaming_password@postgres:5432/gaming_db?sslmode=disable |
| JWT_SECRET | super-secret-jwt-key-change-in-production |
| JWT_EXPIRATION | 24h |

## API

| Метод | Endpoint | Доступ |
|-------|----------|--------|
| POST | /api/auth/register | публичный |
| POST | /api/auth/login | публичный |
| GET | /api/auth/me | авторизован |
| GET | /api/feed | публичный |
| GET | /api/posts | публичный |
| POST | /api/posts | авторизован |
| DELETE | /api/posts/:id | авторизован |
| GET | /api/articles | публичный |
| GET | /api/network/servers | публичный |
| POST | /api/network/test | авторизован |
| GET | /api/network/leaderboard | публичный |
| GET | /api/lfg | публичный |
| POST | /api/lfg | авторизован |
| GET | /api/admin/users | только admin |
| GET | /api/admin/posts | только admin |
| DELETE | /api/admin/posts/:id | только admin |
| GET | /api/admin/articles | только admin |
| DELETE | /api/admin/articles/:id | только admin |

## Команда

| Участник | Роль |
|----------|------|
| Сарибекян Артур | Тимлид, бэкенд социальной части (посты, комментарии, лента, LFG, статьи) |
| Николаев Алексей | Бэкенд сетевой части, база данных |
| Мартинес Анастасия | Фронтенд, DevOps (Docker, nginx) |
| Борисов Вячеслав | UI/UX дизайн, фронтенд, тесты |

## Тестирование

Запустить проект через `docker-compose up --build`, затем:

```bash
python tests/test_api.py
```

Скрипт проверяет все основные функции: регистрацию, вход, замер пинга, посты, статьи, LFG, чат, админ-панель.  
Результат сохраняется в `tests/results_<дата>.txt`.

## Структура проекта

```
ppproject/
├── backend/
│   ├── cmd/api/main.go
│   ├── internal/
│   │   ├── handlers/
│   │   ├── models/
│   │   ├── repository/
│   │   ├── service/
│   │   └── middleware/
│   ├── pkg/
│   │   ├── database/
│   │   └── utils/
│   └── migrations/
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── store/
│       ├── services/
│       └── types/
├── nginx/nginx.conf
└── docker-compose.yml
```
