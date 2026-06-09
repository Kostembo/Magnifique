import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EventEditClient } from "./_components/event-edit-client";

export const metadata = { title: "Редактировать мероприятие — Magnifique" };

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "manager") redirect("/");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: {
      id: true, title: true, client: true, location: true, starts_at: true, status: true,
    },
  });

  if (!event) notFound();

  return <EventEditClient event={event} />;
}
