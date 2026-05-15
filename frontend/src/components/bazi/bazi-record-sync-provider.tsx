"use client";

import { useEffect } from "react";
import { scheduleBaziRecordAutoSync } from "@/lib/bazi/local-records";

export function BaziRecordSyncProvider() {
  useEffect(() => {
    scheduleBaziRecordAutoSync();
  }, []);

  return null;
}
