import RNCalendarEvents, { CalendarEvent } from "react-native-calendar-events";
import { ensurePermissions } from "./permissions";

export async function getTodayEvents(): Promise<CalendarEvent[]> {
  const granted = await ensurePermissions(["calendar"]);
  if (!granted) throw new Error("Calendar permission denied");

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return RNCalendarEvents.fetchAllEvents(start.toISOString(), end.toISOString());
} 