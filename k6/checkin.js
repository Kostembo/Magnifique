/**
 * k6 нагрузочный тест: 150 VU одновременный чек-ин.
 *
 * Запуск (после stress:seed + stress:auth + stress:setup):
 *   k6 run k6/checkin.js
 *
 * Переменные среды:
 *   BASE_URL     — базовый URL (по умолчанию http://localhost:3000)
 *   TOKENS_FILE  — путь к stress-tokens.json (читается через __ENV)
 *   EVENT_ID     — ID мероприятия (из stress-event.json)
 *
 * Пример с переменными:
 *   k6 run -e BASE_URL=http://192.168.1.100:3000 k6/checkin.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";

// ── Метрики ───────────────────────────────────────────────────────────────────

const checkinDuration   = new Trend("checkin_duration_ms", true);
const checkoutDuration  = new Trend("checkout_duration_ms", true);
const duplicateErrors   = new Counter("duplicate_errors");
const authErrors        = new Counter("auth_errors");
const successRate       = new Rate("success_rate");

// ── Конфиг ────────────────────────────────────────────────────────────────────

const BASE_URL  = __ENV.BASE_URL  || "http://localhost:3000";
const EVENT_ID  = __ENV.EVENT_ID  || JSON.parse(open("../scripts/stress-event.json")).event_id;

// Загружаем токены: массив { phone, cookie }
const TOKENS = JSON.parse(open("../scripts/stress-tokens.json"));

export const options = {
  // 150 VU — каждый получает свой токен из массива
  vus: TOKENS.length,
  iterations: TOKENS.length, // ровно 1 итерация на VU

  // Пороги (умеренные — локальная среда)
  thresholds: {
    // p95 чек-ина < 3с (локально; на сервере цель 2с)
    "checkin_duration_ms": ["p(95)<3000"],
    // Ошибок < 5%
    "http_req_failed":     ["rate<0.05"],
    // Успешных > 95%
    "success_rate":        ["rate>0.95"],
    // Дублей = 0
    "duplicate_errors":    ["count==0"],
  },
};

// ── Сценарий ──────────────────────────────────────────────────────────────────

export default function () {
  // Каждый VU берёт свой токен по VU-индексу (0-based)
  const vuIndex = __VU - 1;
  const tokenEntry = TOKENS[vuIndex % TOKENS.length];

  if (!tokenEntry || !tokenEntry.cookie) {
    authErrors.add(1);
    successRate.add(false);
    console.error(`VU ${__VU}: нет токена`);
    return;
  }

  const headers = {
    "Cookie":       tokenEntry.cookie,
    "Content-Type": "application/json",
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const work_date = tomorrow.toISOString().slice(0, 10);

  // ── Создание записи (check-in) ───────────────────────────────────────────────
  const checkinStart = Date.now();
  const checkinRes = http.post(
    `${BASE_URL}/api/time-entries`,
    JSON.stringify({ event_id: EVENT_ID, work_date, start_time: "09:00", end_time: "18:00" }),
    { headers, tags: { name: "checkin" } }
  );
  checkinDuration.add(Date.now() - checkinStart);

  if (__VU <= 3) {
    console.log(`VU${__VU} status=${checkinRes.status} body=${checkinRes.body.slice(0, 120)}`);
  }

  const checkinOk = check(checkinRes, {
    "time-entry 200/201": (r) => r.status === 200 || r.status === 201,
    "не 403": (r) => r.status !== 403,
  });

  if (checkinRes.status === 403) {
    authErrors.add(1);
    console.warn(`VU ${__VU} (${tokenEntry.phone}): 403 — нет назначения`);
  }

  successRate.add(checkinOk);

  sleep(Math.random() * 1 + 0.5);

  // ── Обновление времени (check-out = upsert с другим end_time) ────────────────
  const checkoutStart = Date.now();
  const checkoutRes = http.post(
    `${BASE_URL}/api/time-entries`,
    JSON.stringify({ event_id: EVENT_ID, work_date, start_time: "09:00", end_time: "19:30" }),
    { headers, tags: { name: "checkout" } }
  );
  checkoutDuration.add(Date.now() - checkoutStart);

  check(checkoutRes, {
    "upsert 200/201": (r) => r.status === 200 || r.status === 201,
  });

  if (checkoutRes.status !== 200 && checkoutRes.status !== 201) {
    duplicateErrors.add(1);
  }
}

// ── Итоговый отчёт ────────────────────────────────────────────────────────────

export function handleSummary(data) {
  const dup  = data.metrics.duplicate_errors?.values?.count ?? 0;
  const auth = data.metrics.auth_errors?.values?.count ?? 0;
  const p95  = data.metrics.checkin_duration_ms?.values?.["p(95)"] ?? 0;
  const rate = ((data.metrics.success_rate?.values?.rate ?? 0) * 100).toFixed(1);

  console.log("\n══════════════════════════════════════════");
  console.log("  СТРЕСС-ТЕСТ: РЕЗУЛЬТАТЫ");
  console.log("══════════════════════════════════════════");
  console.log(`  VU:               ${TOKENS.length}`);
  console.log(`  p95 чек-ин:       ${p95.toFixed(0)} мс`);
  console.log(`  Успешных:         ${rate}%`);
  console.log(`  Дублей (❌=fail): ${dup}`);
  console.log(`  Ошибок авторизации: ${auth}`);
  console.log("══════════════════════════════════════════\n");

  if (dup > 0) {
    console.error(`❌ КРИТИЧНО: обнаружено ${dup} дублирующих записей!`);
  }

  return {
    "k6/summary.json": JSON.stringify(data),
  };
}
