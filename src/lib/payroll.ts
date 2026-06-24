// Глобальные дефолты минималки
export const DEFAULT_MIN_PAY_AMOUNT = 5000;
export const DEFAULT_MIN_PAY_HOURS  = 10;

// GMT+3
const TZ_OFFSET_MS = 3 * 60 * 60 * 1000;

function toMoscow(date: Date): Date {
  return new Date(date.getTime() + TZ_OFFSET_MS - date.getTimezoneOffset() * 60000);
}

/**
 * Рассчитывает фактическое время начала смены с учётом правила ±15 мин.
 * - Пришёл раньше или вовремя → отсчёт с scheduled
 * - Опоздал ≤15 мин → отсчёт с scheduled
 * - Опоздал >15 мин → отсчёт со следующего часа
 */
export function calcCheckinTime(checkedInAt: Date, scheduledTime: Date): Date {
  const diffMs = checkedInAt.getTime() - scheduledTime.getTime();
  const diffMin = diffMs / 60000;

  if (diffMin <= 15) {
    // Вовремя или небольшое опоздание → начало с запланированного времени
    return scheduledTime;
  }

  // Опоздал >15 мин → начало со следующего часа от scheduled
  const next = new Date(scheduledTime);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

/**
 * Рассчитывает фактическое время конца смены с правилом округления в пользу сотрудника.
 * - Закончил до отметки :15 следующего часа → округляем вниз (текущий час)
 * - Закончил в :15 или позже → округляем вверх (следующий час)
 */
export function calcCheckoutTime(checkedOutAt: Date): Date {
  const m = toMoscow(checkedOutAt);
  const minutes = m.getMinutes();

  const result = new Date(checkedOutAt);
  if (minutes >= 15) {
    // В пользу сотрудника — следующий час
    result.setMinutes(0, 0, 0);
    result.setHours(result.getHours() + 1);
  } else {
    // Текущий час
    result.setMinutes(0, 0, 0);
  }
  return result;
}

/**
 * Считает количество рабочих часов между началом и концом смены.
 */
export function calcWorkHours(startTime: Date, endTime: Date): number {
  return Math.max(0, (endTime.getTime() - startTime.getTime()) / 3600000);
}

/**
 * Считает зарплату за смену.
 * @param hours        Фактические рабочие часы
 * @param hourlyRate   Ставка в час (руб)
 * @param minPayAmount Минималка (руб), дефолт 5000
 * @param minPayHours  Порог минималки (ч), дефолт 10
 */
export function calcPay(
  hours: number,
  hourlyRate: number,
  minPayAmount: number = DEFAULT_MIN_PAY_AMOUNT,
  minPayHours: number  = DEFAULT_MIN_PAY_HOURS,
): number {
  if (hours <= minPayHours) {
    return minPayAmount;
  }
  return minPayAmount + (hours - minPayHours) * hourlyRate;
}

/**
 * Полный расчёт по TimeEntry.
 * Возвращает { hours, pay, startTime, endTime } для записи в БД.
 */
export function calculateTimeEntry(params: {
  checkedInAt: Date;
  checkedOutAt: Date;
  scheduledTime: Date;
  hourlyRate: number;
  minPayAmount?: number;
  minPayHours?: number;
}): {
  startTime: Date;
  endTime: Date;
  hours: number;
  pay: number;
} {
  const startTime = calcCheckinTime(params.checkedInAt, params.scheduledTime);
  const endTime   = calcCheckoutTime(params.checkedOutAt);
  const hours     = calcWorkHours(startTime, endTime);
  const pay       = calcPay(
    hours,
    params.hourlyRate,
    params.minPayAmount ?? DEFAULT_MIN_PAY_AMOUNT,
    params.minPayHours  ?? DEFAULT_MIN_PAY_HOURS,
  );
  return { startTime, endTime, hours, pay };
}

/** Форматирует DateTime → "HH:mm" в GMT+3 */
export function formatTimeMoscow(date: Date): string {
  const m = toMoscow(date);
  return `${String(m.getHours()).padStart(2, "0")}:${String(m.getMinutes()).padStart(2, "0")}`;
}
