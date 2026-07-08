# Magnifique — Правила для агента

Внутренний PWA-инструмент кейтеринговой компании (~150 сотрудников, ~60 мероприятий/месяц в сезон).
Детальная документация — в папке `docs/`. Она является **источником правды**.

---

## О проекте (быстрый ввод в контекст)

**Magnifique Catering Group** — внутренний рабочий инструмент кейтеринговой компании.
Заменяет Excel и WhatsApp-чаты. Клиентам не продаётся, только внутреннее использование.

**Зачем:** автоматизация набора персонала на мероприятия и сбора складских заявок.

**Стек:** Next.js 14 (App Router) + TypeScript · PostgreSQL + Prisma · NextAuth v5 ·
shadcn/ui + Tailwind · framer-motion v12 · Web Push (VAPID). PWA (iOS + Android).

**БД:** Supabase (PostgreSQL, eu-central-1). `DATABASE_URL` — pgbouncer (6543), `DIRECT_URL` — прямой (5432).
**Хостинг:** пока dev локально + Supabase. Продакшн — Россия (152-ФЗ), ещё не задеплоено.
**Конфиги:** `next.config.js` и `tailwind.config.js` — оба `.js` (не `.ts`).

**Рабочий цикл компании (упрощённо):**
1. Менеджер создаёт мероприятие + кухонные позиции → push шеф-повару (`cook + tier=core`) и менеджерам.
2. Повара видят мероприятие (без подтверждения, информационно).
3. Менеджер добавляет позиции официантов + складскую заявку → push официантам и складу.
4. Официанты подтверждают/отклоняют. Набор идёт волнами: `core` → `pool` → `remind` (порядок нельзя нарушать).
5. Склад собирает инвентарь и завершает заявку.
6. Мероприятие прошло → статус `done`. Официанты сами заполняют табель, менеджер может править.

Подробнее — `docs/PRODUCT.md` (продукт), `docs/DATA_MODEL.md` (данные и инварианты).

---

## Текущее состояние

- Фазы 1–3 завершены: auth, сотрудники CRUD, мероприятия + набор + Web Push, складские заявки, чат, табель, настройки.
- **Активная ветка: `redesign/dark-saffron`** — редизайн под тёмную тему `#09090b` + шафран `#F6B73C`, шрифты Sora/Hanken, Framer Motion. В `main` ещё НЕ смёржено.
- Также добавлены: карточки сотрудников, шаблоны мероприятий, половая сегрегация (пол + требование по позиции), зарплаты/«Мои часы».

**Ключевые файлы темы:** `src/app/globals.css` (CSS-переменные `.dark`, `--ok/--warn/--bad/--info`) ·
`src/lib/theme.tsx` (ThemeProvider, localStorage `mq-theme`) · `src/app/layout.tsx` (шрифты, anti-FOUC) ·
`src/lib/motion.tsx` (MagneticCard, StaffBar, Ring, Tap, stagger/fadeUp).

**Паттерны дизайна (тёмная тема — светлые цвета запрещены):**
- Цвета только через CSS-переменные: `hsl(var(--ok/--warn/--bad/--primary))`. НЕ хардкодить zinc/green/red, НЕ использовать `bg-white`, `bg-*-50`, `border-*-200`.
- Карточки: `rounded-3xl mq-hair` + `style={{ background: "hsl(var(--card))" }}`.
- Заголовки: `font-display text-[28px] font-extrabold tracking-[-0.03em]`.
- Кнопки: `rounded-xl` / `rounded-2xl`. Фильтр-чипы: active `bg-primary text-primary-foreground`, inactive `bg-muted text-muted-foreground`.

**Известная проблема dev-сервера:** после `npm run build` CSS не грузится до первого запроса → `Ctrl+Shift+R`. Лечится: kill node → `rm -rf .next` → `npm run dev` → `Ctrl+Shift+R`.

---

## Работа вдвоём (два разработчика)

Над проектом теперь работают два человека — соблюдаем гигиену git, чтобы не затирать друг друга:

- **Не коммитить прямо в `main`.** Каждая задача — своя ветка от `main` (или от `redesign/dark-saffron`, если это часть редизайна).
- Перед началом работы — `git pull`. Перед push — снова `pull`/`rebase`, чтобы поймать конфликты локально.
- **Атомарные коммиты** с осмысленным сообщением (стиль из `git log`: `feat(scope):`, `fix(scope):`). Один экран/одна фича = один коммит.
- После каждого изменения: `npm run lint && npm run build` — оба зелёные до коммита.
- Не переформатировать чужие файлы «заодно» — только целевые изменения, чтобы diff был читаемым.
- Крупные решения (схема БД, новые пакеты, архитектура) — согласовывать, а не решать в одиночку.

---

## Карта модулей

```
src/
├── app/
│   ├── (auth)/login/          # Страница входа — только публичный маршрут
│   ├── (dashboard)/           # Всё, что требует авторизации
│   │   ├── employees/         # CRUD сотрудников — только role=manager
│   │   ├── events/            # Мероприятия и набор — все роли (доступ разный)
│   │   ├── requisitions/      # Складские заявки — manager + warehouse
│   │   ├── timesheet/         # Табель рабочего времени
│   │   ├── settings/          # Смена пароля — все роли
│   │   └── calendar/          # Календарь мероприятий
│   └── api/                   # Route Handlers — вся серверная логика здесь
│       ├── auth/              # NextAuth эндпоинты (не трогать)
│       ├── employees/         # CRUD сотрудников
│       ├── events/            # Мероприятия + назначения + комментарии
│       ├── requisitions/      # Складские заявки + позиции
│       ├── assignments/       # Ответы на приглашения
│       ├── push/              # Web Push подписки и отправка
│       ├── me/                # Текущий пользователь (смена пароля)
│       ├── staff/             # Список приглашений для сотрудника
│       └── time-entries/      # Записи рабочего времени
├── components/
│   ├── ui/                    # shadcn/ui примитивы — НЕ редактировать вручную
│   ├── events/                # EventCard, StaffingBar — переиспользуемые
│   ├── layout/                # Sidebar, NavLinks, Logo, PWA-обёртки
│   └── push/                  # PushSubscribeButton
├── lib/
│   ├── auth.ts                # NextAuth конфиг — трогать только по явному ТЗ
│   ├── db.ts                  # Prisma Client singleton
│   ├── crypto.ts              # AES-256-GCM шифрование паспортных данных
│   ├── push.ts                # VAPID-отправка push-уведомлений
│   └── utils.ts               # normalizePhone(), cn()
├── hooks/use-toast.ts
├── types/next-auth.d.ts       # Расширение типов сессии
└── middleware.ts              # Auth guard + редиректы по ролям
prisma/
├── schema.prisma              # Единственный источник правды для структуры БД
└── seed.ts                    # Первый менеджер (не менять телефон/пароль в seed)
```

---

## Запреты

- **НЕ изменять `prisma/schema.prisma`** без явного указания в задаче. Схема = миграция = риск данных.
- **НЕ добавлять npm-пакеты** без обсуждения. Сначала проверь, есть ли уже нужное в зависимостях.
- **НЕ хардкодить секреты** — только `process.env.*`. Секреты в `.env.local`, не в коде.
- **НЕ отключать проверки авторизации** "чтобы быстрее заработало".
- **НЕ трогать `src/components/ui/`** — shadcn/ui, обновляется только через CLI.
- **НЕ делать запросы в БД из клиентских компонентов** — только через API-маршруты.
- **НЕ использовать `any`** в TypeScript без крайней необходимости.
- **НЕ писать файлы длиннее 300 строк.** Длинный файл = признак нарушения границ модуля.

---

## Обязанности при каждом изменении

1. Каждая новая функция — тест (хотя бы один: happy path + отказ авторизации).
2. После изменений — `npm run lint` без ошибок.
3. Каждое завершённое изменение — атомарный коммит с осмысленным сообщением.
4. Новый API-маршрут — пройти чеклист из `docs/SECURITY.md` перед коммитом.

---

## Паттерн API-маршрута (обязательный шаблон)

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 1. Zod-схема — всегда, для любого входящего тела
const schema = z.object({ /* ... */ });

// 2. Хелпер проверки роли (при необходимости)
function requireManager(session: ReturnType<typeof auth> extends Promise<infer T> ? T : never) {
  if (!session?.user || session.user.role !== "manager")
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  return null;
}

export async function POST(req: NextRequest) {
  // 3. Auth — ПЕРВЫМ, до любой логики
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  // 4. Парсинг и валидация
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });

  // 5. Бизнес-логика через Prisma
  // 6. Возврат
}
```

---

## Роли и матрица доступа

| Роль | Сотрудники | Мероприятия | Заявки | Табель |
|------|-----------|-------------|--------|--------|
| `manager` | CRUD | Создание, набор, все | Создание, отправка | Все |
| `cook` | — | Свои (информационно) | — | Своё |
| `waiter` | — | Свои + ответ на приглашение | — | Своё |
| `warehouse` | — | — | Получение, сборка | — |

**Роли `bartender` нет.** Официанты и бармены — одна роль `waiter`.
`cook + tier=core` = шеф-повар (получает уведомления о кухонных позициях первым).

Middleware защищает страницы. **Каждый API-маршрут проверяет роль независимо.**

---

## Документация

| Файл | Содержание |
|------|-----------|
| `docs/PRODUCT.md` | Продукт, пользователи, что вне скоупа |
| `docs/DATA_MODEL.md` | Модель данных, инварианты, стейт-машины |
| `docs/ARCHITECTURE.md` | Архитектурная карта, потоки данных |
| `docs/SECURITY.md` | Чеклист безопасности (до каждого PR и перед деплоем) |
| `docs/WORKFLOW.md` | Процесс Архитектор / Исполнитель / Ревьюер |

---

## Команды

```bash
npm run dev          # разработка
npm run build        # production-сборка
npm run lint         # ESLint (запускать перед коммитом)
npm run db:push      # применить изменения схемы к БД (без миграции)
npm run db:migrate   # создать SQL-миграцию + применить
npm run db:seed      # первый менеджер (+7 900 000-00-00 / admin123)
npm run db:studio    # Prisma Studio — GUI для БД
```

Переменные окружения: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`,
`PASSPORT_ENCRYPTION_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

## graphify

This project has a knowledge graph at .graphify/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when .graphify/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If .graphify/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read .graphify/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
