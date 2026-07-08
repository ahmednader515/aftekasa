"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "admin-intro-shown";

export function AdminIntroLoader({
  hello,
  back,
  again,
}: {
  hello: string;
  back: string;
  again: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      return;
    }
    setVisible(true);
    const hideTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setVisible(false);
    }, 2450);
    return () => window.clearTimeout(hideTimer);
  }, []);

  if (!visible) return null;

  return (
    <div className="admin-intro-loader" aria-hidden>
      <div className="admin-intro-stripe" />
      <div className="admin-intro-stripe" />
      <div className="admin-intro-stripe" />
      <div className="admin-intro-stripe" />
      <div className="admin-intro-claim">
        <span>{hello}</span>
        <span>{back}</span>
        <span>{again}</span>
      </div>
    </div>
  );
}
