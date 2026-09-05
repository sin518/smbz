import type { Metadata } from "next";
import { PerpetualCalendar } from "@/components/calendar/perpetual-calendar";

export const metadata: Metadata = {
  title: "万年历"
};

export default function CalendarPage() {
  return <PerpetualCalendar />;
}

