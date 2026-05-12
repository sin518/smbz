"use client";

import { useEffect, useState } from "react";

type StoredUser = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
};

export function SettingsAccountName() {
  const [accountName, setAccountName] = useState("访客");

  useEffect(() => {
    const rawUser = window.localStorage.getItem("sm1:user");

    if (!rawUser) {
      setAccountName("访客");
      return;
    }

    try {
      const user = JSON.parse(rawUser) as StoredUser;
      setAccountName(user.name || user.phone || user.email || "访客");
    } catch {
      setAccountName("访客");
    }
  }, []);

  return <p className="max-w-full truncate text-[30px] font-light leading-none tracking-wide">{accountName}</p>;
}
