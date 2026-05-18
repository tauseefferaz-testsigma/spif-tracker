// ─── SLACK NOTIFICATION ───────────────────────────────────────────────────────
// Uses Incoming Webhook URL stored in VITE_SLACK_WEBHOOK_URL env var
// All writes go through POST (no-cors limitation doesn't apply here since
// Slack webhooks support CORS)

import {
  currentWeekNumber, PROGRAM_WEEKS, PACE_LABELS, getPaceStatus,
} from "../types/index.js";
import { buildTeamSummary, buildCsmStats } from "./stats.js";

const WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL || "";

export function isSlackConfigured() {
  return Boolean(WEBHOOK_URL);
}

function progressBar(actual, target, length = 10) {
  if (!target) return "";
  const filled = Math.round(Math.min(1, actual / target) * length);
  const empty  = length - filled;
  return "▓".repeat(filled) + "░".repeat(empty);
}

function paceEmoji(status) {
  if (status === "ahead")    return "🟢";
  if (status === "on_track") return "🟡";
  if (status === "behind")   return "🔴";
  return "⚪";
}

export function buildSlackMessage(submissions) {
  const week    = currentWeekNumber();
  const summary = buildTeamSummary(submissions);
  const lb      = buildCsmStats(submissions); // sorted by pts desc

  const today     = new Date();
  const dayName   = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr   = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const isMonday  = today.getDay() === 1;
  const isFriday  = today.getDay() === 5;

  // decide tone based on day — fallback to snapshot format
  const tone = isMonday ? "monday" : isFriday ? "friday" : "snapshot";

  // ── Progress bars
  const reviewBar = progressBar(summary.totalReviews,   summary.targets.reviews);
  const refBar    = progressBar(summary.totalRefs,       summary.targets.references);
  const storyBar  = progressBar(summary.totalStories,    summary.targets.stories);

  const reviewPct = Math.round((summary.totalReviews / summary.targets.reviews) * 100);
  const refPct    = Math.round((summary.totalRefs    / summary.targets.references) * 100);
  const storyPct  = Math.round((summary.totalStories / summary.targets.stories) * 100);

  // ── Leaderboard (top 5)
  const top5 = lb.slice(0, 5);
  const medals = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣"];
  const lbLines = top5.map((c, i) => {
    const pace   = c.targets ? getPaceStatus(c.reviews, c.targets.reviews) : null;
    const pEmoji = pace ? paceEmoji(pace) : "⚪";
    return `${medals[i]} *${c.displayName}* — ${c.pts} pts  ${pEmoji}`;
  }).join("\n");

  // ── Pace summary
  const withTargets = lb.filter(c => c.targets);
  const ahead    = withTargets.filter(c => getPaceStatus(c.reviews, c.targets.reviews) === "ahead").map(c => c.displayName);
  const onTrack  = withTargets.filter(c => getPaceStatus(c.reviews, c.targets.reviews) === "on_track").map(c => c.displayName);
  const behind   = withTargets.filter(c => getPaceStatus(c.reviews, c.targets.reviews) === "behind").map(c => c.displayName);

  const paceBlock = [
    ahead.length   ? `🟢 *Ahead*     — ${ahead.join(", ")}`    : null,
    onTrack.length ? `🟡 *On Track*  — ${onTrack.join(", ")}` : null,
    behind.length  ? `🔴 *Behind*    — ${behind.join(", ")}`   : null,
  ].filter(Boolean).join("\n");

  // ── Assemble message based on tone
  let header = "";
  if (tone === "monday") {
    header = `🏅 *SPIF Tracker — Week ${week} of ${PROGRAM_WEEKS} kicks off today* | ${dateStr}`;
  } else if (tone === "friday") {
    header = `📋 *SPIF — Week ${week} of ${PROGRAM_WEEKS} wrap-up* | ${dateStr}`;
  } else {
    header = `📊 *SPIF Tracker — Snapshot* | ${dateStr} · Week ${week} of ${PROGRAM_WEEKS}`;
  }

  const message = `${header}

*📊 Team Progress*
Reviews      ${reviewBar}  ${summary.totalReviews} / ${summary.targets.reviews}  (${reviewPct}%)
References   ${refBar}  ${summary.totalRefs} / ${summary.targets.references}  (${refPct}%)
Stories      ${storyBar}  ${summary.totalStories} / ${summary.targets.stories}  (${storyPct}%)

*🏆 Leaderboard*
${lbLines}

*⚡ Pace Check*
${paceBlock || "No pace data yet — start logging!"}

_Log your activities → https://spif-tracker.vercel.app_`;

  return message;
}

export async function sendSlackUpdate(submissions) {
  if (!WEBHOOK_URL) {
    throw new Error("Slack webhook URL not configured. Add VITE_SLACK_WEBHOOK_URL to Vercel environment variables.");
  }

  const message = buildSlackMessage(submissions);

  const res = await fetch(WEBHOOK_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ text: message }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Slack returned ${res.status}: ${body}`);
  }

  return { ok: true, message };
}
