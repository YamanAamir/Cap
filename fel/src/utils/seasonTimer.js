// ============================================================
//  seasonTimer.js  –  Season Order Deadline Controller
//  Usage: import { useSeasonTimer } from '../utils/seasonTimer';
// ============================================================

import { useState, useEffect, useRef } from "react";

// ── CONFIG ───────────────────────────────────────────────────
// Change these two values to update the deadline for the season.
// Month is 0-indexed: 0=Jan, 1=Feb, ..., 4=May
const DEADLINE = {
  year: null,   // null  → use current year automatically
  month: 4,     // May  (0-indexed)
  day: 2,
  hour: 23,
  minute: 59,
  second: 59,
};

// ── HELPERS ──────────────────────────────────────────────────
function getDeadlineDate() {
  const now = new Date();
  const year = DEADLINE.year ?? now.getFullYear();
  return new Date(
    year,
    DEADLINE.month,
    DEADLINE.day,
    DEADLINE.hour,
    DEADLINE.minute,
    DEADLINE.second,
    999
  );
}

function pad(n) {
  return String(n).padStart(2, "0");
}

/**
 * Formats a millisecond diff into  "Xd : HH : MM : SS"
 */
function formatDiff(diffMs) {
  if (diffMs <= 0) return "00d : 00h : 00m : 00s";
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${days}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
}

// ── HOOK ─────────────────────────────────────────────────────
/**
 * useSeasonTimer()
 *
 * Returns:
 *   {
 *     timeLeft   : string   – formatted countdown string, e.g. "3d : 04h : 12m : 09s"
 *     isExpired  : boolean  – true when the deadline has passed
 *     deadlineLabel: string – human-readable deadline date, e.g. "2. maj"
 *   }
 */
export function useSeasonTimer() {
  const deadline = useRef(getDeadlineDate());
  const [timeLeft, setTimeLeft] = useState(() => formatDiff(deadline.current - Date.now()));
  const [isExpired, setIsExpired] = useState(() => Date.now() >= deadline.current.getTime());

  useEffect(() => {
    // Already expired on mount – nothing to tick
    if (isExpired) return;

    const tick = () => {
      const diff = deadline.current.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("00d : 00h : 00m : 00s");
        setIsExpired(true);
        clearInterval(id);
      } else {
        setTimeLeft(formatDiff(diff));
      }
    };

    tick(); // run immediately
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []); // run once

  // "2. maj"  →  day + month name in Danish
  const DANISH_MONTHS = [
    "jan", "feb", "mar", "apr", "maj", "jun",
    "jul", "aug", "sep", "okt", "nov", "dec",
  ];
  const d = deadline.current;
  const deadlineLabel = `${d.getDate()}. ${DANISH_MONTHS[d.getMonth()]}`;

  return { timeLeft, isExpired, deadlineLabel };
}
