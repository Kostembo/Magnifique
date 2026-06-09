# Magnifique — Внутренний инструмент кейтеринговой компании

PWA для управления персоналом, мероприятиями, набором и складскими заявками.

## Стек

- **Next.js 14** (App Router) + TypeScript
- **PostgreSQL** + Prisma ORM
- **NextAuth v5** — вход по телефону + пароль, JWT сессии 30 дней
- **shadcn/ui** + Tailwind CSS (mobile-first, tap targets 44px)
- **Web Push** (VAPID) — Фаза 2

## Первый запуск

### 1. Переменные окружения и VAPID-ключи

Сгенерировать VAPID-ключи (один раз):
```bash
npx web-push generate-vapid-keys
```

### 2. Переменные окружения

Скопировать `.env.example` → `.env.local`:

```bash
cp .env.example .env.local
```

Заполнить:
- `DATABASE_URL` — строка подключения к PostgreSQL
- `AUTH_SECRET` — случайная строка: `openssl rand -base64 32`
- `NEXTAUTH_URL` — URL приложения (http://localhost:3000 для разработки)
- `PASSPORT_ENCRYPTION_KEY` — 64 символа hex: `openssl rand -hex 32`

### 2. База данных

```bash
# Применить схему (создаёт таблицы)
npm run db:push

# Создать первого менеджера (телефон: +7 900 000-00-00, пароль: admin123)
npm run db:seed
```

Сменить пароль после первого входа!

### 3. Запуск

```bash
npm run dev       # разработка
npm run build     # сборка
npm run start     # продакшн
```

## Роли

| Роль | Доступ |
|------|--------|
| `manager` | Сотрудники, Мероприятия, Заявки |
| `waiter/cook/bartender` | Свои мероприятия и приглашения |
| `warehouse` | Заявки на сбор |

## Иконки PWA (нужно добавить)

Создать папку `public/icons/` с файлами:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

Генерация из любого логотипа: https://maskable.app/

## Безопасность

- `passport_data_enc` — AES-256-GCM шифрование, ключ в env
- Все API проверяют роль на уровне сервера, не только на фронте
- Персональные данные — только на серверах РФ (152-ФЗ)
- Получить согласие сотрудников на обработку ПД перед вводом паспортных данных

## Фазы разработки

- [x] **Фаза 1** — Сотрудники, аутентификация, CRUD, экспорт CSV/PDF
- [x] **Фаза 2** — Мероприятия, набор персонала, Web Push уведомления
- [ ] **Фаза 3** — Складские заявки (requisitions)
- [ ] **Фаза 4** — Обсуждения (асинхронные комментарии)

## Команды

```bash
npm run db:push      # применить изменения схемы к БД
npm run db:seed      # создать первого менеджера
npm run db:studio    # Prisma Studio (GUI для БД)
npm run db:migrate   # создать и применить миграцию
```
