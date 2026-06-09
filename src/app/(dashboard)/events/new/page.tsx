import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EventForm } from "./_components/event-form";

export const metadata = { title: "Новое мероприятие — Magnifique" };

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "manager") redirect("/");

  return <EventForm />;
}
