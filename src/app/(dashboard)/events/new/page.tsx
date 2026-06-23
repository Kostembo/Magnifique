import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canCreateEvents } from "@/lib/roles";
import { EventForm } from "./_components/event-form";

export const metadata = { title: "Новое мероприятие — Magnifique" };

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user || !canCreateEvents(session.user.role ?? "")) redirect("/");

  return <EventForm />;
}
