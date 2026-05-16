package database

import (
	"gaming-lag-platform/internal/models"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func (d *Database) SeedDemoUsers() []models.User {
	type demoUser struct {
		email, password, nickname string
	}
	demos := []demoUser{
		{"player1@nereguet.ru", "Demo1234!", "ZeroLatency"},
		{"player2@nereguet.ru", "Demo1234!", "PingMaster99"},
		{"player3@nereguet.ru", "Demo1234!", "LowPing_Alex"},
	}
	var result []models.User
	for _, d2 := range demos {
		var u models.User
		if d.DB.Where("email = ?", d2.email).First(&u).Error == nil {
			result = append(result, u)
			continue
		}
		hash, _ := bcrypt.GenerateFromPassword([]byte(d2.password), bcrypt.DefaultCost)
		u = models.User{Email: d2.email, PasswordHash: string(hash), Nickname: d2.nickname}
		if err := d.DB.Create(&u).Error; err == nil {
			result = append(result, u)
		}
	}
	return result
}

func (d *Database) SeedPostsAndArticles() error {
	log.Println("Seeding posts and articles...")

	var adminUser models.User
	if err := d.DB.First(&adminUser).Error; err != nil {
		log.Println("No users found, skipping posts/articles seed")
		return nil
	}

	demoUsers := d.SeedDemoUsers()
	u := func(i int) models.User {
		if i < len(demoUsers) {
			return demoUsers[i]
		}
		return adminUser
	}

	var postCount int64
	d.DB.Model(&models.Post{}).Count(&postCount)
	if postCount == 0 {
		posts := []models.Post{
			{
				AuthorID: adminUser.ID,
				Title:    "Добро пожаловать в НЕ РЕГАЕТ У МЕНЯ!",
				Content:  "Запускаем платформу. Здесь вы можете:\n\n— Замерить пинг до игровых серверов прямо из браузера\n— Сравнить свою задержку с другими игроками\n— Найти тиммейтов по игре и региону\n— Читать гайды по настройке сети\n— Постить своё и комментировать чужое\n\nЕсли лагает — ты не один. Давайте разберёмся вместе.",
				PostType: "news",
				IsPinned: true,
			},
			{
				AuthorID: u(0).ID,
				Title:    "Вечерние лаги на CS2: что происходит?",
				Content:  "Снова вечер пятницы, снова московские серверы захлёбываются. Пинг скачет от 20 до 180ms, тикрейт падает, matchmaking еле живой.\n\nЗамерял сегодня в 21:00 — у меня 34ms, у коллеги из того же района 89ms. Один и тот же провайдер. Явно что-то на маршруте до дата-центра Valve.\n\nКто видит похожее — пишите в комментах свой город и провайдер. Попробуем нарисовать карту проблем.",
				PostType: "post",
				Game:     "CS2",
			},
			{
				AuthorID: u(1).ID,
				Title:    "Нашёл тиммейтов через раздел Команды — рассказываю",
				Content:  "Неделю назад запостил объявление в разделе «Найти команду» — CS2, Москва, Gold Nova 3, ищу двух адекватных на вечерние сессии.\n\nЗа три дня получил 4 отклика. Один оказался смоукером с 3000 часов, второй — стабильный AWPer. Уже сыграли 12 матчей, 8 побед.\n\nФункция реально работает. Главное — нормально заполните описание и укажите контакт в Discord.",
				PostType: "post",
				Game:     "CS2",
			},
			{
				AuthorID: u(0).ID,
				Title:    "Dota 2: стокгольмский сервер стал лучше после патча 7.37",
				Content:  "После обновления 7.37 Valve что-то починили на стокгольмском дата-центре. Стабильно держу 58-62ms вместо прежних 70-90ms с джиттером.\n\nПроверял три вечера подряд. Пока держится. Московский как был 15-18ms, так и остался — топ.",
				PostType: "news",
				Game:     "Dota2",
			},
			{
				AuthorID: u(2).ID,
				Title:    "Лайфхак: DNS от Cloudflare реально снижает пинг до серверов",
				Content:  "Сменил DNS с провайдерских на 1.1.1.1 + 1.0.0.1 (Cloudflare) — пинг до CS2 Moscow упал на 8ms, до Valorant EU на 12ms.\n\nПроцедура на 2 минуты:\n1. Панель управления → Сеть → Свойства адаптера\n2. IPv4 → свойства\n3. DNS: 1.1.1.1 и 1.0.0.1\n\nНе 100% гарантия, но у трёх человек из нашей пати сработало.",
				PostType: "guide",
				Game:     "",
			},
			{
				AuthorID: u(1).ID,
				Title:    "Valorant — гайд на позицию Controller для новичков",
				Content:  "Играю Controller уже 600 часов. Ваша задача не убивать — ваша задача делать убийства возможными для тиммейтов. Смоуки, замедления, Omen-телепорт в неожиданные места.\n\nОсновной принцип: смоук всегда ставится ДО входа команды на точку, а не во время перестрелки. Большинство новичков путают порядок.\n\nЕщё важный момент — не переставайте коммуницировать. «Смоук готов» и «смоук падает» — разные вещи.",
				PostType: "guide",
				Game:     "Valorant",
			},
			{
				AuthorID: u(0).ID,
				Title:    "WoW Dragonflight: как не словить лаги в рейде",
				Content:  "Перед рейдом обязательно:\n— Закрыть браузер (да, он жрёт память)\n— Выключить стриминг/торрент\n— Очистить кэш аддонов если тормозит интерфейс\n\nЕсли лагает только в рейде — скорее всего дело не в пинге, а в FPS. Снизьте тени и дальность прорисовки.\n\nМой конфиг: пинг 22ms, FPS 144, интерфейс минимальный. Даже на 25+ человек всё плавно.",
				PostType: "guide",
				Game:     "WoW",
			},
			{
				AuthorID: u(2).ID,
				Title:    "Apex Legends: заметил паттерн с пингом на EU серверах",
				Content:  "Наблюдаю уже месяц: в будние дни с 19 до 23 МСК пинг на EU-Amsterdam стабильно +15-20ms к обычному значению.\n\nСкорее всего перегрузка CDN или самих серверов EA. Помогает переключиться на Data Center Selection и выбрать конкретный. Auto иногда выбирает не оптимальный при нагрузке.",
				PostType: "post",
				Game:     "Apex",
			},
		}
		for i := range posts {
			if err := d.DB.Create(&posts[i]).Error; err != nil {
				log.Printf("Failed to create post %d: %v", i, err)
			}
		}
		log.Printf("Created %d posts", len(posts))
	}

	var articleCount int64
	d.DB.Model(&models.Article{}).Count(&articleCount)
	if articleCount == 0 {
		articles := []models.Article{
			{
				AuthorID: adminUser.ID,
				Title:    "Почему лагает в онлайн-играх: полный разбор",
				Content: `Если вы читаете это — значит, уже словили резиновые пули или телепортирующегося врага. Разберёмся откуда это берётся.

## Три главных виновника

**Высокий пинг** — просто большое расстояние или перегруженный маршрут до сервера. Пакеты идут дольше.

**Джиттер** — нестабильный пинг хуже стабильно высокого. Игра не может предсказать ваше следующее положение и начинает «резинить».

**Потеря пакетов** — часть данных вообще не доходит. Даже 1-2% убивают игровой опыт.

## Что делать прямо сейчас

1. Кабель вместо Wi-Fi. Серьёзно, это даёт -10 до -30ms и убирает джиттер в большинстве случаев
2. Закройте YouTube/торренты во время игры. Буферизация видео съедает полосу и создаёт лаги
3. Выберите ближайший сервер. CS2 Москва для жителей РФ всегда лучше Frankfurt
4. Перезагрузите роутер если не делали это больше недели

## Когда дело в провайдере

Если пинг стабильно высокий только до игровых серверов, но скорость интернета нормальная — проблема на маршруте. Пишите в поддержку провайдера с результатами traceroute.`,
				Category: "guides",
				Tags:     "пинг,лаги,оптимизация,гайд",
			},
			{
				AuthorID: adminUser.ID,
				Title:    "Рейтинг серверов CS2 для игроков из России (2025)",
				Content: `Протестировали все доступные CS2-серверы из Москвы, Санкт-Петербурга, Екатеринбурга и Краснодара. Вот что получилось.

## Москва и ЦФО

🥇 **CS2 Москва** — 8-22ms, очень стабильный. Идеал для всех в радиусе 1000км от столицы.

## Европейские серверы

🥈 **CS2 Варшава** — 35-55ms. Лучший вариант если Москва перегружена в прайм-тайм.
🥉 **CS2 Франкфурт** — 45-65ms. Надёжный, стабильный джиттер.
4️⃣ **CS2 Стокгольм** — 55-75ms. Чуть хуже Frankfurt, но меньше нагрузка вечером.

## Реальность vs маркетинг

Valve пишет «выбирается оптимальный сервер автоматически», но это не всегда правда. Иногда вас кидает во Frankfurt когда Москва недоступна. Отслеживайте через наш инструмент — если видите что сервер внезапно поменялся, это объясняет почему вдруг стало хуже.

## Итог

Для большинства российских игроков: Москва > Варшава > Frankfurt. Если живёте за Уралом — иногда Helsinki или Stockholm могут быть лучше Москвы из-за маршрутизации.`,
				Category: "network",
				Tags:     "CS2,серверы,рейтинг,Россия",
			},
			{
				AuthorID: adminUser.ID,
				Title:    "Wi-Fi vs кабель: реальные цифры, мифы и когда Wi-Fi всё-таки ок",
				Content: `Холивар старый как мир. Давайте с цифрами.

## Реальный тест (наши замеры)

| Подключение | Средний пинг | Джиттер | Потери |
|-------------|-------------|---------|--------|
| Кабель Ethernet | 18ms | 1.2ms | 0% |
| Wi-Fi 5GHz (рядом) | 22ms | 3.8ms | 0.1% |
| Wi-Fi 2.4GHz (рядом) | 25ms | 8.1ms | 0.3% |
| Wi-Fi (сквозь стену) | 31ms | 14ms | 1.2% |

Кабель побеждает, но разрыв меньше чем вы думаете **при хороших условиях**.

## Когда Wi-Fi реально проблема

- Много соседей на том же канале (частный сектор — окей, многоэтажка — ад)
- Микроволновка, Bluetooth-устройства создают интерференцию на 2.4GHz
- Стены из армированного бетона или фольгированного утеплителя

## Когда Wi-Fi норм

На 5GHz в прямой видимости от роутера — разница с кабелем минимальная. Если у вас роутер Wi-Fi 6 и сетевая карта его поддерживает, джиттер будет в районе 2-3ms, что абсолютно приемлемо для любой игры.

**Вывод**: для серьёзного гейминга — кабель. Но если нет возможности — 5GHz Wi-Fi 6 в прямой видимости это не катастрофа.`,
				Category: "network",
				Tags:     "Wi-Fi,кабель,Ethernet,сравнение",
			},
			{
				AuthorID: adminUser.ID,
				Title:    "Как настроить Windows 11 для минимального пинга",
				Content: `Несколько твиков которые реально работают. Без шаманства и «отключения ненужных служб».

## 1. Электропитание — самое важное

Панель управления → Электропитание → **Высокая производительность**.

Режим сбалансированного питания снижает частоту процессора и может добавить 5-15ms к пингу. Это реальный эффект, проверено.

## 2. Таймер прерываний сетевой карты

В диспетчере устройств → ваш сетевой адаптер → Свойства → Дополнительно:
- **Interrupt Moderation Rate**: Low или Extreme (не Auto)
- **Flow Control**: выкл
- **Energy Efficient Ethernet**: выкл

## 3. DNS серверы

В свойствах сетевого адаптера замените DNS провайдера на:
- Предпочитаемый: **1.1.1.1** (Cloudflare)
- Альтернативный: **8.8.8.8** (Google)

DNS влияет на время подключения к серверу, а не на пинг в игре — но для соединений с матчмейкингом это важно.

## 4. Обновления Windows

Идут в фоне и жрут трафик в самый неподходящий момент. В настройках обновлений → Дополнительно → **Активные часы** — укажите время когда играете.

## Чего НЕ делать

Не трогайте реестр по гайдам с YouTube 2018 года. Большинство «оптимизаций TCP» давно не работают в современных Windows.`,
				Category: "software",
				Tags:     "Windows,оптимизация,настройка,пинг",
			},
			{
				AuthorID: adminUser.ID,
				Title:    "Как найти тиммейтов которые не испортят игру",
				Content: `Играть с рандомами — это лотерея. Играть с адекватными — это кайф. Расскажу как искать последних.

## Что писать в объявлении

**Плохо**: «ищу тиммейтов в CS2»
**Хорошо**: «CS2 | Gold Nova 3 | Москва | вечер по будням 21-24 | тихий AWP | ищу 1-2 человек для стабильной пати, скиллом не хвастаюсь но и не сливаю»

Конкретика отсеивает неподходящих людей раньше чем вы успеете поиграть с ними.

## На что смотреть в чужих объявлениях

- Время активности должно совпадать с вашим
- Регион важен — пинг до сервера у вас должен быть схожим
- Если человек пишет «ищу тиммейтов, не терплю токсиков» — это часто тревожный звоночек (тот кто сам токсит обычно так и пишет)

## После первого матча

Не торопитесь добавлять в постоянную пати после одной игры. Три-пять игр достаточно чтобы понять:
1. Как человек реагирует на поражения
2. Слушает ли он и принимает ли решения команды
3. Не мешает ли его игровой стиль вашему

## Ресурсы

Наш раздел «Найти команду» — с фильтрами по игре и региону. Плюс у каждого человека видна его статистика пинга — сразу понятно откуда он играет.`,
				Category: "guides",
				Tags:     "тиммейты,команда,LFG,совет",
			},
		}
		for i := range articles {
			if err := d.DB.Create(&articles[i]).Error; err != nil {
				log.Printf("Failed to create article %d: %v", i, err)
			}
		}
		log.Printf("Created %d articles", len(articles))
	}

	var lfgCount int64
	d.DB.Model(&models.LFGRequest{}).Count(&lfgCount)
	if lfgCount == 0 {
		lfgRequests := []models.LFGRequest{
			{UserID: adminUser.ID, Game: "CS2", Region: "RU", Rank: "Gold Nova 3", Description: "Ищу 1-2 тиммейта на вечерние сессии в CS2. Играю стабильно, без токсика. Предпочитаю нормально общаться в войсе.", Contact: "Discord: redact#0001", IsActive: true},
			{UserID: adminUser.ID, Game: "Dota2", Region: "RU", Rank: "3200 MMR", Description: "Ищу команду на Dota 2 для турнирного режима. Нужны позиции 1 и 5. Играю на позиции 3.", Contact: "Steam: редакция_нерегает", IsActive: true},
			{UserID: adminUser.ID, Game: "Valorant", Region: "EU", Rank: "Gold 2", Description: "Looking for Valorant teammates, EU servers, evenings CET. Duelist/Initiator, chill vibes only.", Contact: "Discord: editorial#7777", IsActive: true},
			{UserID: adminUser.ID, Game: "CS2", Region: "EU", Rank: "MG2", Description: "Need IGL and AWPer for CS2 Frankfurt server. Playing weekends mostly. Semi-serious team.", Contact: "Discord: redaction#1234", IsActive: true},
		}
		for i := range lfgRequests {
			if err := d.DB.Create(&lfgRequests[i]).Error; err != nil {
				log.Printf("Failed to create LFG %d: %v", i, err)
			}
		}
		log.Printf("Created %d LFG requests", len(lfgRequests))
	}

	return nil
}

func (d *Database) SeedChatRooms() error {
	var count int64
	d.DB.Model(&models.ChatRoom{}).Count(&count)
	if count > 0 {
		return nil
	}

	type channel struct {
		suffix string
		name   string
	}

	gameChannels := map[string][]channel{
		"CS2":        {{"general", "Общий"}, {"lfg", "Найти команду"}, {"tips", "Гайды и советы"}, {"trade", "Обмен"}, {"offtopic", "Оффтоп"}},
		"Dota2":      {{"general", "Общий"}, {"lfg", "Найти команду"}, {"tips", "Гайды и советы"}, {"trade", "Обмен"}, {"offtopic", "Оффтоп"}},
		"Valorant":   {{"general", "Общий"}, {"lfg", "Найти команду"}, {"tips", "Гайды и советы"}, {"clips", "Клипы"}, {"offtopic", "Оффтоп"}},
		"Apex":       {{"general", "Общий"}, {"lfg", "Найти команду"}, {"tips", "Гайды и советы"}, {"clips", "Клипы"}, {"offtopic", "Оффтоп"}},
		"WoW":        {{"general", "Общий"}, {"lfg", "Найти команду"}, {"tips", "Гайды и советы"}, {"trade", "Обмен"}, {"offtopic", "Оффтоп"}},
		"PUBG":       {{"general", "Общий"}, {"lfg", "Найти команду"}, {"tips", "Гайды и советы"}, {"trade", "Обмен"}, {"offtopic", "Оффтоп"}},
		"Overwatch2": {{"general", "Общий"}, {"lfg", "Найти команду"}, {"tips", "Гайды и советы"}, {"clips", "Клипы"}, {"offtopic", "Оффтоп"}},
	}

	gameOrder := []string{"CS2", "Dota2", "Valorant", "Apex", "WoW", "PUBG", "Overwatch2"}

	gameDescriptions := map[string]map[string]string{
		"CS2": {
			"general": "Общение по Counter-Strike 2",
			"lfg":     "Ищем тиммейтов в CS2",
			"tips":    "Тактики, раскидки, позиции",
			"trade":   "Обмен скинами и предметами CS2",
			"offtopic": "Всё остальное",
		},
		"Dota2": {
			"general": "Общение по Dota 2",
			"lfg":     "Ищем тиммейтов в Dota 2",
			"tips":    "Гайды по героям, стратегии",
			"trade":   "Обмен предметами Dota 2",
			"offtopic": "Всё остальное",
		},
		"Valorant": {
			"general": "Общение по Valorant",
			"lfg":     "Ищем тиммейтов в Valorant",
			"tips":    "Гайды по агентам, кроссхейры",
			"clips":   "Делимся клипами и хайлайтами",
			"offtopic": "Всё остальное",
		},
		"Apex": {
			"general": "Общение по Apex Legends",
			"lfg":     "Ищем тиммейтов в Apex",
			"tips":    "Легенды, тактики, дроп-споты",
			"clips":   "Делимся клипами и хайлайтами",
			"offtopic": "Всё остальное",
		},
		"WoW": {
			"general": "Общение по World of Warcraft",
			"lfg":     "Ищем группу в WoW",
			"tips":    "Гайды, билды, данжи",
			"trade":   "Торговля и аукцион",
			"offtopic": "Всё остальное",
		},
		"PUBG": {
			"general": "Общение по PUBG",
			"lfg":     "Ищем тиммейтов в PUBG",
			"tips":    "Тактики, лут-споты, зоны",
			"trade":   "Обмен предметами PUBG",
			"offtopic": "Всё остальное",
		},
		"Overwatch2": {
			"general": "Общение по Overwatch 2",
			"lfg":     "Ищем тиммейтов в OW2",
			"tips":    "Гайды по героям, компы",
			"clips":   "Делимся клипами и хайлайтами",
			"offtopic": "Всё остальное",
		},
	}

	var rooms []models.ChatRoom
	for _, game := range gameOrder {
		channels := gameChannels[game]
		descs := gameDescriptions[game]
		gameLower := map[string]string{
			"CS2": "cs2", "Dota2": "dota2", "Valorant": "val",
			"Apex": "apex", "WoW": "wow", "PUBG": "pubg", "Overwatch2": "ow2",
		}[game]
		for i, ch := range channels {
			slug := gameLower + "-" + ch.suffix
			desc := ""
			if descs != nil {
				desc = descs[ch.suffix]
			}
			rooms = append(rooms, models.ChatRoom{
				Game:        game,
				Slug:        slug,
				Name:        ch.name,
				Description: desc,
				OrderIndex:  i,
			})
		}
	}

	for i := range rooms {
		if err := d.DB.Create(&rooms[i]).Error; err != nil {
			log.Printf("Failed to create chat room %s: %v", rooms[i].Slug, err)
		}
	}
	log.Printf("Created %d chat rooms", len(rooms))
	return nil
}
