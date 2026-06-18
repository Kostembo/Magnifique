import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { InviteResponseClient } from "./_components/invite-response-client";

export default async function InvitePage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role !== "waiter" && role !== "cook") redirect("/events");

  const assignment = await prisma.assignment.findFirst({
    where: {
      employee_id: session.user.id,
      event_id: params.eventId,
      status: "invited",
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          client: true,
          location: true,
          starts_at: true,
        },
      },
    },
  });

  if (!assignment) redirect("/events");

  return (
    <InviteResponseClient
      assignmentId={assignment.id}
      event={{
        ...assignment.event,
        starts_at: assignment.event.starts_at.toISOString(),
      }}
    />
  );
}
