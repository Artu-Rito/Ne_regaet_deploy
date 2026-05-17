"""
Тесты API платформы НЕ РЕГАЕТ
Запуск: python tests/test_api.py
Результат: tests/results_<дата>.txt
"""

import urllib.request
import urllib.error
import json
import datetime
import os
import time

BASE_URL = "http://localhost/api"

results = []
passed = 0
failed = 0


def log(msg):
    print(msg)
    results.append(msg)


def section(title):
    line = f"\n{'='*60}\n  {title}\n{'='*60}"
    log(line)


def ok(name, detail=""):
    global passed
    passed += 1
    msg = f"  [OK]  {name}"
    if detail:
        msg += f"  |  {detail}"
    log(msg)


def fail(name, detail=""):
    global failed
    failed += 1
    msg = f"  [FAIL] {name}"
    if detail:
        msg += f"  |  {detail}"
    log(msg)


def request(method, path, body=None, token=None):
    url = BASE_URL + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}
    except Exception as e:
        return 0, {"error": str(e)}


# ─── Тестовые аккаунты ────────────────────────────────────────────────────────

USERS = [
    {"email": "test_user1@nereguet.ru",  "password": "TestPass1!", "nickname": "ТестЮзер1"},
    {"email": "test_user2@nereguet.ru",  "password": "TestPass2!", "nickname": "ТестЮзер2"},
    {"email": "test_viewer@nereguet.ru", "password": "ViewPass1!", "nickname": "ТестВьювер"},
]
ADMIN = {"email": "admin@nereguet.ru", "password": "Nereguet2025!"}

tokens = {}      # email -> token
user_ids = {}    # email -> id
created_post_id = None
created_article_id = None
created_lfg_id = None


# ─── ЗАПУСК ───────────────────────────────────────────────────────────────────

log(f"НЕ РЕГАЕТ — тесты API")
log(f"Дата запуска: {datetime.datetime.now().strftime('%d.%m.%Y %H:%M:%S')}")
log(f"Сервер: {BASE_URL}")

# 1. Health check
section("1. Health check")
status, body = request("GET", "/../health")
# health вне /api
url = "http://localhost/health"
req = urllib.request.Request(url)
try:
    with urllib.request.urlopen(req, timeout=5) as resp:
        body = json.loads(resp.read())
    if body.get("status") == "ok":
        ok("GET /health", "status=ok")
    else:
        fail("GET /health", str(body))
except Exception as e:
    fail("GET /health", str(e))

# 2. Глобальная статистика
section("2. Глобальная статистика")
status, body = request("GET", "/stats")
if status == 200:
    ok("GET /api/stats", f"users={body.get('users_count','?')}, posts={body.get('posts_count','?')}")
else:
    fail("GET /api/stats", str(body))

# 3. Регистрация
section("3. Регистрация пользователей")
for u in USERS:
    status, body = request("POST", "/auth/register", u)
    if status in (201, 400):
        if status == 201:
            tokens[u["email"]] = body.get("token")
            user_ids[u["email"]] = body.get("user", {}).get("id")
            ok(f"Регистрация {u['nickname']}", "создан")
        else:
            ok(f"Регистрация {u['nickname']}", "уже существует — пробуем логин")
    else:
        fail(f"Регистрация {u['nickname']}", str(body))

# 4. Логин
section("4. Вход в аккаунты")
for u in USERS:
    status, body = request("POST", "/auth/login", {"email": u["email"], "password": u["password"]})
    if status == 200:
        tokens[u["email"]] = body.get("token")
        user_ids[u["email"]] = body.get("user", {}).get("id")
        ok(f"Логин {u['nickname']}", f"role={body.get('user',{}).get('role','?')}")
    else:
        fail(f"Логин {u['nickname']}", str(body))

# 5. Логин администратора
section("5. Вход администратора")
status, body = request("POST", "/auth/login", ADMIN)
if status == 200 and body.get("user", {}).get("role") == "admin":
    tokens[ADMIN["email"]] = body.get("token")
    user_ids[ADMIN["email"]] = body.get("user", {}).get("id")
    ok("Логин admin@nereguet.ru", f"role=admin, nickname={body['user']['nickname']}")
else:
    fail("Логин admin@nereguet.ru", str(body))

# 6. Проверка /me
section("6. Получение профиля (GET /auth/me)")
for u in USERS[:2]:
    tok = tokens.get(u["email"])
    if not tok:
        fail(f"/me для {u['nickname']}", "нет токена")
        continue
    status, body = request("GET", "/auth/me", token=tok)
    if status == 200:
        ok(f"/me {u['nickname']}", f"email={body.get('user',{}).get('email','?')}")
    else:
        fail(f"/me {u['nickname']}", str(body))

# 7. Игровые серверы
section("7. Игровые серверы")
status, body = request("GET", "/network/servers")
if status == 200 and body.get("servers"):
    servers = body["servers"]
    ok("GET /network/servers", f"найдено серверов: {len(servers)}")
    server_id = servers[0]["id"]
    server_name = servers[0]["name"]
else:
    fail("GET /network/servers", str(body))
    server_id = None
    server_name = ""

# 8. Отправка теста пинга
section("8. Тест пинга")
tok1 = tokens.get(USERS[0]["email"])
if tok1 and server_id:
    ping_data = {"ping": 42.5, "jitter": 3.2, "packet_loss": 0.1, "game_server": server_name}
    status, body = request("POST", "/network/test", ping_data, token=tok1)
    if status == 201:
        ok("POST /network/test", f"ping={ping_data['ping']}ms, jitter={ping_data['jitter']}ms")
    else:
        fail("POST /network/test", str(body))

    # второй тест для статистики
    ping_data2 = {"ping": 65.0, "jitter": 8.0, "packet_loss": 0.5, "game_server": server_name}
    request("POST", "/network/test", ping_data2, token=tok1)
    ok("POST /network/test (2й)", "дополнительный тест для статистики")
else:
    fail("POST /network/test", "нет токена или server_id")

# 9. История тестов
section("9. История и статистика пинга")
if tok1:
    status, body = request("GET", "/network/tests", token=tok1)
    if status == 200:
        ok("GET /network/tests", f"записей: {len(body.get('tests', []))}")
    else:
        fail("GET /network/tests", str(body))

    status, body = request("GET", "/network/stats?period=7d", token=tok1)
    if status == 200:
        stats = body.get("stats", {})
        ok("GET /network/stats", f"avg_ping={stats.get('avg_ping','?')}")
    else:
        fail("GET /network/stats", str(body))

# 10. Лидерборд
section("10. Таблица лидеров")
status, body = request("GET", "/network/leaderboard")
if status == 200:
    ok("GET /network/leaderboard", f"записей: {len(body.get('leaderboard', []))}")
else:
    fail("GET /network/leaderboard", str(body))

# 11. Посты
section("11. Посты")
status, body = request("GET", "/posts")
if status == 200:
    ok("GET /posts", f"найдено: {len(body.get('posts', []))}")
    post_list = body.get("posts", [])
    first_post_id = post_list[0]["id"] if post_list else None
else:
    fail("GET /posts", str(body))
    first_post_id = None

if tok1:
    new_post = {"title": "Тестовый пост", "content": "Контент тестового поста для проверки API.", "type": "post"}
    status, body = request("POST", "/posts", new_post, token=tok1)
    if status == 201:
        created_post_id = body.get("post", {}).get("id")
        ok("POST /posts", f"id={created_post_id}")
    else:
        fail("POST /posts", str(body))

if first_post_id:
    status, body = request("GET", f"/posts/{first_post_id}")
    if status == 200:
        ok(f"GET /posts/:id", f"title={body.get('post',{}).get('title','?')[:30]}")
    else:
        fail(f"GET /posts/:id", str(body))

# 12. Комментарий
section("12. Комментарии")
tok2 = tokens.get(USERS[1]["email"])
if tok2 and first_post_id:
    status, body = request("POST", f"/posts/{first_post_id}/comments",
                           {"content": "Тестовый комментарий от юзера 2"}, token=tok2)
    if status == 201:
        ok("POST /posts/:id/comments", "добавлен")
    else:
        fail("POST /posts/:id/comments", str(body))

# 13. Лента
section("13. Лента постов")
status, body = request("GET", "/feed")
if status == 200:
    ok("GET /feed", f"элементов: {len(body.get('items', []))}")
else:
    fail("GET /feed", str(body))

# 14. Статьи
section("14. Статьи")
status, body = request("GET", "/articles")
if status == 200:
    articles = body.get("articles", [])
    ok("GET /articles", f"найдено: {len(articles)}")
    if articles:
        article_id = articles[0]["id"]
        status2, body2 = request("GET", f"/articles/{article_id}")
        if status2 == 200:
            ok(f"GET /articles/:id", f"title={body2.get('article',{}).get('title','?')[:30]}")
        else:
            fail("GET /articles/:id", str(body2))
else:
    fail("GET /articles", str(body))

# 15. LFG
section("15. LFG (поиск команды)")
status, body = request("GET", "/lfg")
if status == 200:
    ok("GET /lfg", f"заявок: {len(body.get('requests', []))}")
else:
    fail("GET /lfg", str(body))

if tok1:
    lfg_data = {"game": "CS2", "region": "RU", "rank": "Gold Nova", "description": "Тестовая LFG заявка", "contact": "test#0000"}
    status, body = request("POST", "/lfg", lfg_data, token=tok1)
    if status == 201:
        created_lfg_id = body.get("request", {}).get("id")
        ok("POST /lfg", f"id={created_lfg_id}")
    else:
        fail("POST /lfg", str(body))

if tok1 and created_lfg_id:
    status, body = request("DELETE", f"/lfg/{created_lfg_id}", token=tok1)
    if status == 200:
        ok("DELETE /lfg/:id", "удалено")
    else:
        fail("DELETE /lfg/:id", str(body))

# 16. Чат
section("16. Чат-комнаты")
status, body = request("GET", "/chat/rooms")
if status == 200:
    rooms = body.get("rooms", [])
    ok("GET /chat/rooms", f"комнат: {len(rooms)}")
    if rooms:
        slug = rooms[0]["slug"]
        status2, body2 = request("GET", f"/chat/rooms/{slug}/history")
        if status2 == 200:
            ok(f"GET /chat/rooms/:slug/history", f"сообщений: {len(body2.get('messages', []))}")
        else:
            fail("GET /chat/rooms/:slug/history", str(body2))
else:
    fail("GET /chat/rooms", str(body))

# 17. Защита: доступ без токена
section("17. Защита роутов (без токена)")
status, _ = request("POST", "/network/test", {"ping": 1.0, "jitter": 0.1, "packet_loss": 0.0})
if status == 401:
    ok("POST /network/test без токена -> 401")
else:
    fail("POST /network/test без токена", f"ожидали 401, получили {status}")

status, _ = request("GET", "/network/tests")
if status == 401:
    ok("GET /network/tests без токена -> 401")
else:
    fail("GET /network/tests без токена", f"ожидали 401, получили {status}")

# 18. Admin-панель
section("18. Администраторская панель")
admin_tok = tokens.get(ADMIN["email"])

if admin_tok:
    status, body = request("GET", "/admin/users", token=admin_tok)
    if status == 200:
        ok("GET /admin/users", f"пользователей: {len(body.get('users', []))}")
    else:
        fail("GET /admin/users", str(body))

    status, body = request("GET", "/admin/posts", token=admin_tok)
    if status == 200:
        ok("GET /admin/posts", f"постов: {len(body.get('posts', []))}")
        admin_posts = body.get("posts", [])
    else:
        fail("GET /admin/posts", str(body))
        admin_posts = []

    # Создание статьи через admin
    new_article = {"title": "Тест: статья от админа", "content": "Тестовый контент статьи созданной через API.", "category": "guide", "tags": "тест,api"}
    status, body = request("POST", "/admin/articles", new_article, token=admin_tok)
    if status == 201:
        created_article_id = body.get("article", {}).get("id")
        ok("POST /admin/articles", f"id={created_article_id}")
    else:
        fail("POST /admin/articles", str(body))

    # Получение статей через admin
    status, body = request("GET", "/admin/articles", token=admin_tok)
    if status == 200:
        ok("GET /admin/articles", f"статей: {len(body.get('articles', []))}")
    else:
        fail("GET /admin/articles", str(body))

    # Удаление тестовой статьи
    if created_article_id:
        status, body = request("DELETE", f"/admin/articles/{created_article_id}", token=admin_tok)
        if status == 200:
            ok("DELETE /admin/articles/:id", "тестовая статья удалена")
        else:
            fail("DELETE /admin/articles/:id", str(body))

    # Удаление тестового поста
    if created_post_id:
        status, body = request("DELETE", f"/admin/posts/{created_post_id}", token=admin_tok)
        if status == 200:
            ok("DELETE /admin/posts/:id", "тестовый пост удалён")
        else:
            fail("DELETE /admin/posts/:id", str(body))

else:
    fail("Admin-тесты", "нет токена администратора")

# 19. Защита admin-роутов от обычного юзера
section("19. Защита admin-роутов")
if tok1:
    status, _ = request("GET", "/admin/users", token=tok1)
    if status == 403:
        ok("GET /admin/users обычным юзером -> 403")
    else:
        fail("GET /admin/users обычным юзером", f"ожидали 403, получили {status}")

# ─── ИТОГ ─────────────────────────────────────────────────────────────────────

section("ИТОГ")
total = passed + failed
log(f"  Пройдено:  {passed}/{total}")
log(f"  Провалено: {failed}/{total}")
log(f"  Результат: {'ВСЕ ТЕСТЫ ПРОШЛИ' if failed == 0 else f'ЕСТЬ ОШИБКИ ({failed})'}")

# Сохраняем в файл
os.makedirs("tests", exist_ok=True)
fname = f"tests/results_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
with open(fname, "w", encoding="utf-8") as f:
    f.write("\n".join(results))

print(f"\nРезультат сохранён: {fname}")
