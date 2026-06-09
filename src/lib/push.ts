import webpush from "web-push";
import { prisma } from "./db";
import { Prisma } from "@prisma/client";

function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@magnifique.ru";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY не заданы в env");
  }
  return { publicKey, privateKey, subject };
}

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const { publicKey, privateKey, subject } = getVapidConfig();
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPushToEmployee(
  employeeId: string,
  payload: PushPayload
): Promise<"sent" | "no_subscription" | "error"> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { push_subscription: true },
  });

  if (!employee?.push_subscription) return "no_subscription";

  try {
    ensureVapid();
    await webpush.sendNotification(
      employee.push_subscription as unknown as webpush.PushSubscription,
      JSON.stringify(payload)
    );
    return "sent";
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "statusCode" in err &&
      ((err as { statusCode: number }).statusCode === 404 || (err as { statusCode: number }).statusCode === 410)
    ) {
      // Подписка устарела — очищаем
      await prisma.employee.update({
        where: { id: employeeId },
        data: { push_subscription: Prisma.DbNull },
      });
    }
    return "error";
  }
}

export async function sendPushToMany(
  employeeIds: string[],
  payload: PushPayload
): Promise<void> {
  await Promise.allSettled(
    employeeIds.map((id) => sendPushToEmployee(id, payload))
  );
}

export async function sendPushToManagers(payload: PushPayload): Promise<void> {
  const managers = await prisma.employee.findMany({
    where: { role: "manager", is_active: true },
    select: { id: true, push_subscription: true },
  });
  const withSub = managers.filter((m) => m.push_subscription !== null);
  await sendPushToMany(withSub.map((m) => m.id), payload);
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY ?? "";
}
