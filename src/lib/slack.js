// Slack notifications routed through Apps Script backend
// This avoids the browser CORS issue with Slack webhooks directly

import {
  currentWeekNumber, PROGRAM_WEEKS, getPaceStatus,
} from "../types/index.js";
import { buildTeamSummary, buildCsmStats } from "./stats.js";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "";

export function isSlackConfigured() {
  return Boolean(APPS_SCRIPT_URL);
}

function progressBar(actual, target, length = 10) {
  if (!target) return "";
  const filled = Math.round(Math.min(1, actual / target) * length);
  return "▓".repeat(filled) + "░".repeat(length - filled);
}

function paceEmoji(status) {
  if (status === "ahead")    return "🟢";
  if (status === "on_track") return "🟡";
  if (status === "behind")   return "🔴";
  return "⚪";
}

const SLACK_NAMES = {
  "Mohammed Tamiz Uddin": "Tamiz",
  "Aravinda G": "Aravinda",
  "Subhopriyo Sen": "Subho",
  "sakshi.bagri": "Sakshi",
  "Rama Varma": "Ram",
  "Arun S": "Arun",
  "Varun Thakur": "Varun",
  "Shabrish BM": "Shabrish",
  "Tauseef Feraz": "Tauseef",
  "Aarathy Sundaresan": "Aarathy",
};

function shortName(name) {
  return SLACK_NAMES[name] || name;
}

function padRight(value, width) {
  return String(value).padEnd(width, " ");
}

export function buildSlackMessage(submissions) {
  const week    = currentWeekNumber();
  const summary = buildTeamSummary(submissions);
  const lb      = buildCsmStats(submissions);

  const today   = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const reviewPct = Math.round((summary.totalReviews / summary.targets.reviews) * 100) || 0;
  const refPct    = Math.round((summary.totalRefs    / summary.targets.references) * 100) || 0;
  const storyPct  = Math.round((summary.totalStories / summary.targets.stories) * 100) || 0;

  const medals = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣"];
  const topRows = lb.slice(0, 5);
  const lbLines = topRows.map((c, i) => {
    const pace = c.targets ? getPaceStatus(c.reviews, c.targets.reviews) : null;
    return `${medals[i]} ${padRight(shortName(c.name), 9)} — ${c.pts} pts  ${pace ? paceEmoji(pace) : "⚪"}`;
  }).join("\n");
  const leaderboardBlock = lb.length > 5 ? `${lbLines}\n...` : lbLines;

  const withTargets = lb.filter(c => c.targets);
  const ahead   = withTargets.filter(c => getPaceStatus(c.reviews, c.targets.reviews) === "ahead").map(c => shortName(c.name));
  const onTrack = withTargets.filter(c => getPaceStatus(c.reviews, c.targets.reviews) === "on_track").map(c => shortName(c.name));
  const behind  = withTargets.filter(c => getPaceStatus(c.reviews, c.targets.reviews) === "behind").map(c => shortName(c.name));

  const paceLines = [
    ahead.length   ? `🟢 Ahead    — ${ahead.join(", ")}`   : null,
    onTrack.length ? `🟡 On Track — ${onTrack.join(", ")}` : null,
    behind.length  ? `🔴 Behind   — ${behind.join(", ")}`  : null,
  ].filter(Boolean).join("\n") || "No pace data yet.";

  return `📊 SPIF Tracker — Snapshot | ${dateStr} · Week ${week} of ${PROGRAM_WEEKS}

📊 Team Progress
Reviews      ${progressBar(summary.totalReviews, summary.targets.reviews)}  ${summary.totalReviews} / ${summary.targets.reviews}  (${reviewPct}%)
References   ${progressBar(summary.totalRefs, summary.targets.references)}  ${summary.totalRefs} / ${summary.targets.references}  (${refPct}%)
Stories      ${progressBar(summary.totalStories, summary.targets.stories)}  ${summary.totalStories} / ${summary.targets.stories}  (${storyPct}%)

🏆 Leaderboard
${leaderboardBlock}

⚡ Pace Check
${paceLines}`;
}

export async function sendSlackUpdate(submissions) {
  if (!APPS_SCRIPT_URL) {
    throw new Error("Apps Script URL not configured.");
  }

  const text = buildSlackMessage(submissions);

  // Route through Apps Script backend to avoid CORS
  await fetch(APPS_SCRIPT_URL, {
    method:  "POST",
    mode:    "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body:    JSON.stringify({ _action: "slack", text }),
  });

  return { ok: true, text };
}
