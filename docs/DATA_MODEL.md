# Модель данных

Единственный источник правды — `prisma/schema.prisma`. Этот документ объясняет **бизнес-смысл** полей и инварианты, которые не видны из схемы.

---

## Перечисления (enums)

```
Role:   waiter | cook | warehouse | manager
        (bartender удалён — официанты и бармены объединены в waiter)

Tier:   core | regular | trainee
        core + role=cook = шеф-повар (первый получает уведомления о кухонных позициях)

EventStatus:       draft | recruiting | staffed | done
AssignmentStatus:  invited | confirmed | declined | expired
RequisitionStatus: draft | sent | picking | done
```

---

## Сущности

### Employee (сотрудник)

```
id                cuid — первичный ключ
full_name         ФИО
phone             нормализованный номер (7XXXXXXXXXX), уникален
password_hash     bcrypt, cost=12
role              waiter | cook | warehouse | manager
tier              core | regular | trainee
passport_data_enc AES-256-GCM, base64. NULL если не введено.
is_active         false = уволен, не может войти в систему
push_subscription JSON подписки Web Push. NULL = не подписан.
```

**Инварианты:**
- `phone` всегда в формате `7XXXXXXXXXX` (нормализуется при создании через `normalizePhone()`).
- `is_active = false` не даёт войти (проверяется в `auth.ts`), но запись не удаляется.
- `passport_data_enc` никогда не возвращается в листингах. Только GET /employees/[id] для manager.
- `role=cook, tier=core` = шеф-повар. Не отдельная роль, а уровень внутри роли.

---

### Event (мероприятие)

```
id           cuid
title        название мероприятия
client       компания-заказчик (опционально)
location     место проведения (опционально)
guests_count количество гостей (опционально) ← новое поле
starts_at    дата и время начала
status       draft | recruiting | staffed | done
created_by   FK → Employee (менеджер-создатель)
```

**Стейт-машина статусов:**

```
draft ──→ recruiting ──→ staffed ──→ done
                ↑              |
                └──────────────┘  (назад в recruiting, если не хватает людей)
```

- `draft` — создан менеджером, позиции ещё заполняются.
- `recruiting` — набор открыт, отправляются приглашения официантам.
- `staffed` — укомплектован. Push официантам больше не отправляются.
- `done` — завершён. Скрывается из основного списка (`status: { notIn: ['done'] }`).

**Двухэтапное создание в реальном процессе:**
1. Менеджер создаёт Event + позиции поваров → уведомление шеф-повару.
2. Позже менеджер добавляет позиции официантов → уведомление официантам + создаёт Requisition.

Схема поддерживает оба этапа: позиции добавляются через редактирование мероприятия.

---

### EventPosition (позиция в мероприятии)

```
id                autoincrement
event_id          FK → Event
role              waiter | cook | warehouse
needed_count      сколько нужно людей
reserved_for_core сколько мест для tier=core (костяк)
priority_deadline до которого времени core должны ответить (опционально)
```

**Инварианты:**
- `reserved_for_core <= needed_count` всегда.
- `role=manager` в позициях не используется — менеджеры не нанимаются на мероприятия.
- Одно мероприятие может иметь несколько позиций: например, cook × 3 + waiter × 5.

**Логика назначений по роли:**
- Для `cook`: назначения информационные — шеф-повар (tier=core) получает уведомление, повара видят своё мероприятие.
- Для `waiter`: полный цикл приглашений (core → pool → remind) с подтверждением/отказом.

---

### Assignment (назначение / приглашение)

```
id           cuid
event_id     FK → Event
position_id  FK → EventPosition
employee_id  FK → Employee
status       invited | confirmed | declined | expired
is_priority  true = волна core, false = пул
invited_at   когда создано приглашение
responded_at когда сотрудник ответил (NULL = ещё не ответил)

UNIQUE(position_id, employee_id)
```

**Стейт-машина:**

```
invited ──→ confirmed
       ──→ declined
       ──→ expired  (менеджер переключает в mode=pool — незакрытые core становятся expired)
```

**Инвариант:** при переходе `core → pool` все `is_priority=true, status=invited` → `expired`. Нельзя иметь два активных приглашения одного человека на одну позицию.

---

### Requisition (складская заявка / сбор)

```
id          cuid
event_id    FK → Event
status      draft | sent | picking | done
assignee_id FK → Employee (кладовщик, NULL до назначения)
sent_at     когда менеджер отправил на склад
```

**Стейт-машина:**

```
draft ──→ sent ──→ picking ──→ done
```

- `draft` — менеджер заполняет список инвентаря.
- `sent` — отправлена. Кладовщик видит заявку и получает push-уведомление.
- `picking` — кладовщик начал сборку.
- `done` — всё собрано, готово к мероприятию.

**Связь с процессом:** Requisition создаётся одновременно с добавлением позиций официантов (шаг 3 цикла компании). Дедлайн сборки = `event.starts_at`.

---

### RequisitionItem (позиция заявки)

```
id             autoincrement
requisition_id FK → Requisition
name           название инвентаря или заготовки
quantity       Decimal(10,2)
unit           единица измерения (по умолчанию "шт")
is_picked      собрано ли кладовщиком
```

---

### TimeEntry (рабочее время)

```
id          cuid
employee_id FK → Employee
event_id    FK → Event
work_date   Date
start_time  String "HH:MM"
end_time    String "HH:MM"

UNIQUE(employee_id, event_id)  — одна запись на сотрудника на мероприятие
```

---

### Comment (чат мероприятия)

```
id        cuid
event_id  FK → Event
author_id FK → Employee
body      текст
```

---

## Ключевые связи

```
Event
  ├── EventPosition[] (кухонные + официантские позиции)
  │     └── Assignment[] (назначения сотрудников)
  ├── Requisition[] (складские заявки, обычно одна на мероприятие)
  ├── Comment[] (чат)
  └── TimeEntry[] (табель)

Employee
  ├── created_events: Event[]
  ├── assignments: Assignment[]
  ├── requisitions: Requisition[] (assignee — кладовщик)
  ├── comments: Comment[]
  └── time_entries: TimeEntry[]
```

---

## Каскадное удаление

| Что удаляем | Что удаляется каскадом |
|-------------|----------------------|
| Event | EventPosition, Assignment, Requisition, RequisitionItem, Comment, TimeEntry |
| EventPosition | Assignment |
| Requisition | RequisitionItem |
| Employee | **Никогда не удаляется** — только `is_active = false` |

---

## Изменения схемы (необходима миграция)

Следующие изменения зафиксированы в этом документе и **требуют применения** к БД:

1. **Удалить** `bartender` из enum `Role` → перевести существующих сотрудников с `role=bartender` в `role=waiter` до миграции.
2. **Добавить** поле `guests_count Int?` в модель `Event`.

Команды после внесения изменений в `schema.prisma`:
```bash
# Перенести bartender → waiter в БД вручную или через скрипт ПЕРЕД migrate
npm run db:migrate  # создать SQL-миграцию с именем (например: add_guests_count_remove_bartender)
```
