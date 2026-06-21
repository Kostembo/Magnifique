# Карта данных: прототип → твоя Prisma-схема

Источник твоих моделей: `docs/DATA_MODEL.md`. Слева — mock из прототипа
(`handoff/reference/data.jsx`), справа — что использовать в реальном коде.
Перед переносом каждого экрана сверяйся с этой таблицей.

## Перечисления (приводим прототип к твоим enum)
| Прототип | Твой enum | Действие |
|---|---|---|
| статус события `live` | — (у тебя нет `live`) | показывай `live` как `staffed` + бейдж «идёт» по `starts_at` (сегодня/сейчас). Либо просто убери `live`. |
| `recruiting / staffed / draft` | `EventStatus: recruiting / staffed / draft / done` | совпадает, добавь `done` |
| приглашение `accepted/pending/declined` | `AssignmentStatus: confirmed/invited/declined/expired` | `accepted→confirmed`, `pending→invited`, `+expired` |
| роль `waiter/cook/bartender/host` | `Role: waiter/cook/warehouse/manager` | **`bartender`→`waiter`** (объединены), `host` у тебя нет — убери или маппь в `waiter` |
| `tier: core/regular/trainee` | `Tier: core/regular/trainee` | совпадает. `cook+core` = шеф-повар |

## Event (мероприятие)
| Прототип | Твоя модель | Примечание |
|---|---|---|
| `title` | `Event.title` | ✓ |
| `client` | `Event.client` | ✓ (опционально) |
| `venue` | `Event.location` | переименовать |
| `start` (ISO строка) | `Event.starts_at` (DateTime) | формат через `date-fns` |
| `guests` | `Event.guests_count` (Int?) | переименовать |
| `status` | `Event.status` | привести enum (см. выше) |
| `positions[]` | `Event.positions: EventPosition[]` | связь |
| `comments` (число) | `Event.comments: Comment[]` | считать `.length` |
| `call`, `dress` | — | **в схеме нет.** Либо добавь поля, либо убери из вида (это были mock-детали брифа) |

## EventPosition (позиция) + Assignment (назначение)
| Прототип | Твоя модель | Примечание |
|---|---|---|
| `position.role` | `EventPosition.role` | ✓ |
| `position.need` | `EventPosition.needed_count` | переименовать |
| `position.slots[]` | `EventPosition.assignments: Assignment[]` | связь |
| `slot.id` (= staffId) | `Assignment.employee_id` | FK |
| `slot.invite` | `Assignment.status` | `confirmed/invited/declined/expired` |
| — | `EventPosition.reserved_for_core` | у тебя есть «брони для костяка» — можно показать в виде |
| — | `Assignment.is_priority` | волна core vs пул — можно бейджем |

> Хелперы прототипа `tally(ev)` (счёт укомплектованности), `myEvents(staffId)` переноси
> как чистые функции, но считай по `assignments`, где `status === "confirmed"`.

## Employee (сотрудник)
| Прототип | Твоя модель | Примечание |
|---|---|---|
| `name` | `Employee.full_name` | переименовать |
| `phone` | `Employee.phone` | формат `7XXXXXXXXXX` |
| `role` | `Employee.role` | ✓ |
| `tier` | `Employee.tier` | ✓ |
| `active` | `Employee.is_active` | переименовать |
| `rating`, `events`, `since`, `avail` | — | **в схеме нет.** `events` можно посчитать (count assignments), остальное — убери или добавь поля |

## Requisition (складская заявка)
| Прототип | Твоя модель | Примечание |
|---|---|---|
| `event` | `Requisition.event` → `Event.title` | через связь |
| `status` (`pending/collecting/ready/issued`) | `RequisitionStatus: draft/sent/picking/done` | маппь: `pending→sent`, `collecting→picking`, `ready/issued→done` |
| `items` (число) | `Requisition.items: RequisitionItem[]` | считать `.length` |
| `due` | = `event.starts_at` | дедлайн сборки |
| `by` | `Requisition.assignee` → `Employee.full_name` | кладовщик |

## TimeEntry (табель)
| Прототип `TIMESHEET` | Твоя модель | Примечание |
|---|---|---|
| `staff` | `TimeEntry.employee_id` | FK |
| `event` | `TimeEntry.event` → title | связь |
| `date` | `TimeEntry.work_date` (Date) | ✓ |
| `hours` | вычислять из `start_time`/`end_time` | "HH:MM" разница |
| `rate`, `status` | — | **в схеме нет.** Ставку добавь полем или считай вне; статус убери |

---

## Чего в прототипе нет, а в твоём проекте есть (не потеряй)
Эти экраны/сущности уже есть в `src/` — им тоже нужен новый вид, эталон бери из ближайшего по смыслу:
- **Меню/блюда** (`menu-items/`) — нет в прототипе. Сделай в стиле карточек «Заявок».
- **Чат мероприятия** (`Comment`) — есть кусок в `screens-shared.jsx` (блок «Обсуждение»).
- **Календарь** (FullCalendar) — оставь как есть, только перекрась токенами темы.
- **Приглашение-ответ** (`invite/[eventId]`) — экран официанта, стиль как карточка смены в `screens-staff.jsx`.

## Правило
Где в прототипе поля нет в твоей схеме (`call`, `dress`, `rating`, `rate`) — **не выдумывай данные**.
Либо добавь поле осознанно через миграцию, либо убери элемент из вида. Лучше чистый экран без
лишних цифр, чем красивый mock, который не подключить к БД.
