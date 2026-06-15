# Архитектура

## Стек

| Слой | Технология |
|------|-----------|
| Фреймворк | Next.js 14, App Router |
| Язык | TypeScript (strict) |
| БД | PostgreSQL (Supabase) + Prisma ORM |
| Аутентификация | NextAuth v5, Credentials provider (телефон + пароль), JWT, 30 дней |
| UI | shadcn/ui + Radix UI + Tailwind CSS |
| Push | Web Push (VAPID) |
| PWA | next-pwa manifest + Service Worker |
| Шифрование | AES-256-GCM (Node.js crypto) для паспортных данных |

---

## Структура файлов (детально)

```
Magnifique/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Корневой layout — Toaster, SW register
│   │   ├── globals.css             # Tailwind base + CSS-переменные темы
│   │   ├── (auth)/
│   │   │   ├── layout.tsx          # Auth layout (фон, центрирование)
│   │   │   └── login/page.tsx      # Форма входа
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Dashboard layout — Sidebar + main
│   │   │   ├── page.tsx            # / — редирект на /events
│   │   │   ├── employees/          # Список и CRUD сотрудников
│   │   │   ├── events/             # Мероприятия (список, детали, редактирование)
│   │   │   ├── requisitions/       # Складские заявки
│   │   │   ├── timesheet/          # Табель
│   │   │   ├── settings/           # Настройки пользователя
│   │   │   └── calendar/           # Календарь
│   │   └── api/
│   │       ├── auth/[...nextauth]/ # NextAuth (не трогать)
│   │       ├── employees/          # GET /employees, POST /employees
│   │       │   ├── [id]/           # GET/PATCH/DELETE /employees/:id
│   │       │   │   └── password/   # PATCH — сброс пароля менеджером
│   │       │   └── export/csv/     # GET — экспорт CSV
│   │       ├── events/             # GET /events, POST /events
│   │       │   └── [id]/
│   │       │       ├── route.ts    # GET/PATCH/DELETE мероприятия
│   │       │       ├── invite/     # POST — волны набора (core/pool/remind)
│   │       │       ├── assignments/[assignmentId]/ # PATCH — ответ сотрудника
│   │       │       ├── comments/   # GET/POST — чат мероприятия
│   │       │       ├── requisitions/ # GET — заявки мероприятия
│   │       │       └── export-staff/ # GET — экспорт состава PDF
│   │       ├── assignments/[id]/respond/ # POST — confirm/decline
│   │       ├── requisitions/       # GET/POST заявки
│   │       │   └── [id]/
│   │       │       ├── route.ts    # GET/PATCH/DELETE заявки
│   │       │       └── items/      # GET/POST позиций, PATCH item
│   │       ├── push/               # subscribe, test, vapid-public-key
│   │       ├── me/password/        # PATCH — смена пароля самим сотрудником
│   │       ├── staff/invitations/  # GET — приглашения для текущего сотрудника
│   │       ├── time-entries/       # GET/POST/PATCH табеля
│   │       └── logo/               # GET — логотип (из /public через API для ngrok)
│   ├── components/
│   │   ├── ui/                     # shadcn/ui (checkbox, button, dialog, etc.)
│   │   ├── events/
│   │   │   ├── event-card.tsx      # Карточка мероприятия (список)
│   │   │   └── staffing-bar.tsx    # Полоса укомплектованности
│   │   ├── layout/
│   │   │   ├── sidebar.tsx         # Боковое меню (desktop) + bottom nav (mobile)
│   │   │   ├── nav-links.tsx       # Навигационные ссылки с иконками
│   │   │   ├── logo.tsx            # Логотип компании
│   │   │   ├── splash-screen.tsx   # PWA splash screen
│   │   │   ├── pull-to-refresh.tsx # Pull-to-refresh для мобильных
│   │   │   └── tag-cloud-bg.tsx    # Анимированный фон (matter.js)
│   │   ├── push/push-subscribe-button.tsx
│   │   └── sw-register.tsx         # Service Worker регистрация
│   ├── lib/
│   │   ├── auth.ts      # NextAuth: Credentials provider, JWT/session callbacks
│   │   ├── db.ts        # PrismaClient singleton (предотвращает множественные подключения)
│   │   ├── crypto.ts    # encryptPassportData() / decryptPassportData() — AES-256-GCM
│   │   ├── push.ts      # sendPushToMany() / sendPushToManagers() — VAPID
│   │   └── utils.ts     # normalizePhone(), cn()
│   ├── hooks/use-toast.ts
│   ├── types/next-auth.d.ts  # Расширение Session: id, role, tier, phone
│   └── middleware.ts    # Auth guard + ролевые редиректы
├── prisma/
│   ├── schema.prisma    # Модели, enums, связи
│   └── seed.ts          # Создание первого менеджера
├── public/
│   ├── manifest.json    # PWA манифест
│   ├── sw.js            # Service Worker
│   └── icons/           # PWA иконки (192, 512)
└── scripts/
    └── make-icons.js    # Генерация иконок из исходника
```

---

## Поток аутентификации

```
1. Пользователь вводит телефон + пароль → POST /api/auth/callback/credentials
2. auth.ts: нормализация телефона → поиск в БД → bcrypt.compare()
3. При успехе: JWT с полями { id, role, tier, phone }
4. middleware.ts: на каждый запрос проверяет JWT
   - Нет JWT → редирект на /login
   - Есть JWT → проверка ролей (например, /employees только для manager)
5. API-маршруты: вызывают auth() и проверяют role независимо от middleware
```

**Важно:** middleware защищает страницы (HTML). API-маршруты проверяют роль самостоятельно — это вторая линия защиты.

---

## Поток создания мероприятия (двухэтапный)

```
Шаг 1 — Кухня (менеджер получил заявку от клиента):
  POST /api/events  { title, client, location, guests_count, starts_at }
  POST /api/events/:id (edit) → добавить EventPosition { role: "cook", needed_count }
      ↓
  POST /api/events/:id/invite { mode: "core", position_id: <cook_position> }
      → Assignment (invited) для cook+tier=core (шеф-повар)
      → Web Push шеф-повару + менеджерам

Шаг 2 — Официанты и склад (после согласования кухни):
  PATCH /api/events/:id → добавить EventPosition { role: "waiter", needed_count }
  POST /api/requisitions { event_id }  → Requisition (draft)
  POST /api/requisitions/:id/items × N → позиции сбора
  PATCH /api/requisitions/:id { status: "sent" }
      → Web Push складу
      ↓
  POST /api/events/:id/invite { mode: "core" }  → набор официантов начинается
```

---

## Поток набора официантов

```
POST /api/events/:id/invite { mode: "core" }
    → Assignment (invited, is_priority=true) для waiter+tier=core
    → Web Push официантам-костяку
    ↓
Официанты отвечают: POST /api/assignments/:id/respond { action: "confirm"|"decline" }
    ↓
POST /api/events/:id/invite { mode: "pool" }
    → is_priority=true, status=invited → expired
    → Assignment (invited, is_priority=false) для waiter+tier=regular+trainee
    → Web Push
    ↓
POST /api/events/:id/invite { mode: "remind" }
    → Web Push молчунам (status=invited)
```

---

## Поток складской заявки

```
Менеджер: POST /api/requisitions (event_id)
    → status: draft
    ↓
POST /api/requisitions/:id/items (name, quantity, unit)
    ↓
PATCH /api/requisitions/:id { status: "sent" }
    → Склад видит заявку
    ↓
PATCH /api/requisitions/:id { status: "picking", assignee_id }
    → Кладовщик начинает
    ↓
PATCH /api/requisitions/:id/items/:itemId { is_picked: true }  (по одному)
    ↓
PATCH /api/requisitions/:id { status: "done" }
```

---

## Соглашения

### Авторизация в API-маршрутах

Всегда первый шаг:
```typescript
const session = await auth();
if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
```

Для manager-only — хелпер `requireManager()` (см. CLAUDE.md).

### Ответы API

- `200` — успешный GET/PATCH
- `201` — успешный POST (создание)
- `400` — ошибка валидации (Zod)
- `401` — нет сессии
- `403` — нет прав (не та роль)
- `404` — объект не найден
- `409` — конфликт (дублирование)

### Клиент/сервер

- Страницы-контейнеры (`page.tsx`) — серверные компоненты, получают данные через `fetch`.
- Интерактивность — клиентские компоненты (`*-client.tsx`, `*-form.tsx`), помечены `'use client'`.
- Данные никогда не передаются напрямую из БД в клиент — только через API.

---

## Известные технические решения

- `next.config.js` и `tailwind.config.js` — в `.js`, не `.ts`. Next.js 14 не поддерживает `.ts` конфиги.
- Prisma Client создаётся как singleton в `lib/db.ts` чтобы избежать "too many connections" в dev.
- Логотип отдаётся через `/api/logo` (Route Handler) — статика из `/public` не работает через ngrok.
- `DATABASE_URL` — pgbouncer порт 6543, `DIRECT_URL` — прямой порт 5432 (нужен для миграций).
