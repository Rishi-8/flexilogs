"use client";

import { useState } from "react";
import { Calendar } from "@/components/calendar";
import { DayPanel } from "@/components/day-panel";

export default function Page() {
  const [date, setDate] = useState<string | null>(null);
  return (
    <>
      <Calendar onPickDate={setDate} />
      <DayPanel date={date} onClose={() => setDate(null)} />
    </>
  );
}
