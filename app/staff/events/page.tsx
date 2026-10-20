import type { Metadata } from "next";
import { EventManager } from "@/components/staff/event-manager";
import { getStaffAccess, getStaffEvents } from "@/lib/data/staff";

export const metadata: Metadata = { title: "Agenda" };

export default async function StaffEventsPage() {
  const access = await getStaffAccess();
  if (access.status !== "ok") return null;

  const events = await getStaffEvents(access.mode);
  return <EventManager mode={access.mode} initialEvents={events} />;
}
