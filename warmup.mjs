// Прогрев всех маршрутов Next.js dev сервера
const BASE = "http://localhost:3000";
const ROUTES = [
  "/",
  "/employees",
  "/events",
  "/requisitions",
  "/timesheet",
  "/calendar",
  "/menu-items",
  "/warehouse-items",
  "/settings",
];

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function warmup() {
  console.log("⏳ Ожидание запуска сервера...");
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE}/login`);
      if (res.ok) break;
    } catch {}
    await wait(1000);
  }

  console.log("🔥 Прогрев страниц...");
  for (const route of ROUTES) {
    try {
      await fetch(`${BASE}${route}`, { redirect: "manual" });
      process.stdout.write(`  ✓ ${route}\n`);
    } catch {}
  }
  console.log("✅ Готово — все страницы скомпилированы");
}

warmup();
