/**
 * stress-auth.ts — получает сессионные куки для всех 150 стресс-аккаунтов.
 * Сохраняет их в scripts/stress-tokens.json для использования k6.
 * Запуск: npm run stress:auth
 *
 * Требования: dev-сервер запущен на http://localhost:3000
 */
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { STRESS_PHONE_PREFIX, STRESS_PASSWORD, STRESS_TOTAL } from "./stress-seed";

const BASE_URL = process.env.STRESS_BASE_URL ?? "http://localhost:3000";
const OUT_FILE = path.join(__dirname, "stress-tokens.json");
const CONCURRENCY = 10;

interface TokenEntry {
  phone: string;
  cookie: string;
}

async function fetchSignIn(phone: string): Promise<string> {
  // Шаг 1: получаем CSRF-токен
  const csrfRes = await get(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = JSON.parse(csrfRes.body);
  const sessionCookies = csrfRes.cookies;

  // Шаг 2: логинимся
  const formBody = new URLSearchParams({
    phone,
    password: STRESS_PASSWORD,
    csrfToken,
    callbackUrl: `${BASE_URL}/events`,
    json: "true",
  }).toString();

  const signInRes = await post(
    `${BASE_URL}/api/auth/callback/credentials`,
    formBody,
    "application/x-www-form-urlencoded",
    sessionCookies
  );

  // Собираем итоговые куки из обоих ответов
  const allCookies = mergeCookies(sessionCookies, signInRes.cookies);
  const sessionToken = allCookies
    .split("; ")
    .find((c) => c.startsWith("authjs.session-token=") || c.startsWith("next-auth.session-token="));

  if (!sessionToken) {
    throw new Error(`Нет session-token для ${phone}. Статус: ${signInRes.status}. Куки: ${allCookies}`);
  }

  return allCookies;
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

interface HttpResult {
  status: number;
  body: string;
  cookies: string;
}

function get(url: string, cookie = ""): Promise<HttpResult> {
  return request("GET", url, "", "application/json", cookie);
}

function post(url: string, body: string, contentType: string, cookie = ""): Promise<HttpResult> {
  return request("POST", url, body, contentType, cookie);
}

function request(
  method: string,
  url: string,
  body: string,
  contentType: string,
  cookie: string
): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;

    const opts: http.RequestOptions = {
      method,
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers: {
        "Content-Type": contentType,
        "Content-Length": Buffer.byteLength(body),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    };

    const req = lib.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const setCookies = (res.headers["set-cookie"] ?? []) as string[];
        const cookies = setCookies
          .map((c) => c.split(";")[0])
          .join("; ");
        resolve({ status: res.statusCode ?? 0, body: data, cookies });
      });
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function mergeCookies(...parts: string[]): string {
  const map = new Map<string, string>();
  for (const part of parts) {
    if (!part) continue;
    part.split("; ").forEach((kv) => {
      const eq = kv.indexOf("=");
      if (eq > 0) map.set(kv.slice(0, eq), kv.slice(eq + 1));
    });
  }
  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Stress auth: логинимся на ${BASE_URL} за ${STRESS_TOTAL} аккаунтов...`);

  const phones = Array.from({ length: STRESS_TOTAL }, (_, i) =>
    `${STRESS_PHONE_PREFIX}${String(i + 1).padStart(4, "0")}`
  );

  const tokens: TokenEntry[] = [];
  let ok = 0;
  let fail = 0;

  // Обрабатываем параллельно пачками CONCURRENCY
  for (let i = 0; i < phones.length; i += CONCURRENCY) {
    const batch = phones.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (phone) => {
        const cookie = await fetchSignIn(phone);
        return { phone, cookie };
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        tokens.push(r.value);
        ok++;
      } else {
        console.error(`  ✗ ${r.reason}`);
        fail++;
      }
    }

    process.stdout.write(`\r  ${ok + fail}/${phones.length} (✓${ok} ✗${fail})...`);
  }

  console.log(`\n✓ Авторизовано: ${ok}, ошибок: ${fail}`);

  fs.writeFileSync(OUT_FILE, JSON.stringify(tokens, null, 2), "utf-8");
  console.log(`  Токены сохранены в ${OUT_FILE}`);

  if (fail > 0) {
    console.warn(`\nПредупреждение: ${fail} аккаунтов не авторизовались.`);
    console.warn(`Убедитесь что запущен 'npm run stress:seed' и сервер доступен.`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
