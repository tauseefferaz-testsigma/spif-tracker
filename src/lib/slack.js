import {
  currentWeekNumber, PROGRAM_WEEKS, getPaceStatus,
} from "../types/index.js";
import { buildTeamSummary, buildCsmStats } from "./stats.js";

const SLACK_API_URL = "/api/slack-snapshot";

export function isSlackConfigured() {
  return true;
}

function progressBar(actual, target, length = 10) {
  if (!target) return "";
  const filled = Math.round(Math.min(1, actual / target) * length);
  return "▓".repeat(filled) + "░".repeat(length - filled);
}

function paceEmoji(status) {
  if (status === "ahead")    return ":large_green_circle:";
  if (status === "on_track") return ":large_yellow_circle:";
  if (status === "behind")   return ":red_circle:";
  return ":white_circle:";
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

  const medals = [":one:",":two:",":three:",":four:",":five:"];
  const topRows = lb.slice(0, 5);
  const lbLines = topRows.map((c, i) => {
    const pace = c.targets ? getPaceStatus(c.reviews, c.targets.reviews) : null;
    return `${medals[i]} ${padRight(shortName(c.name), 9)} — ${c.pts} pts  ${pace ? paceEmoji(pace) : ":white_circle:"}`;
  }).join("\n");
  const leaderboardBlock = lb.length > 5 ? `${lbLines}\n...` : lbLines;

  const withTargets = lb.filter(c => c.targets);
  const ahead   = withTargets.filter(c => getPaceStatus(c.reviews, c.targets.reviews) === "ahead").map(c => shortName(c.name));
  const onTrack = withTargets.filter(c => getPaceStatus(c.reviews, c.targets.reviews) === "on_track").map(c => shortName(c.name));
  const behind  = withTargets.filter(c => getPaceStatus(c.reviews, c.targets.reviews) === "behind").map(c => shortName(c.name));

  const paceLines = [
    ahead.length   ? `:large_green_circle: Ahead    — ${ahead.join(", ")}`   : null,
    onTrack.length ? `:large_yellow_circle: On Track — ${onTrack.join(", ")}` : null,
    behind.length  ? `:red_circle: Behind   — ${behind.join(", ")}`  : null,
  ].filter(Boolean).join("\n") || "No pace data yet.";

  return `:bar_chart: Customer Advocacy App — Snapshot | ${dateStr} · Week ${week} of ${PROGRAM_WEEKS}

:bar_chart: Team Progress
Reviews      ${progressBar(summary.totalReviews, summary.targets.reviews)}  ${summary.totalReviews} / ${summary.targets.reviews}  (${reviewPct}%)
References   ${progressBar(summary.totalRefs, summary.targets.references)}  ${summary.totalRefs} / ${summary.targets.references}  (${refPct}%)
Stories      ${progressBar(summary.totalStories, summary.targets.stories)}  ${summary.totalStories} / ${summary.targets.stories}  (${storyPct}%)

:trophy: Leaderboard
${leaderboardBlock}

:zap: Pace Check
${paceLines}`;
}

export function buildConsolidatedSlackMessage(submissions) {
  const week    = currentWeekNumber();
  const stats   = buildCsmStats(submissions);
  const today   = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  let message = `:bar_chart: Customer Advocacy App — CSM Snapshot | ${dateStr} · Week ${week} of ${PROGRAM_WEEKS}\n\n`;

  message += `Name                        Reviews      References    Stories\n`;
  message += `─────────────────────────────────────────────────────────────\n\n`;

  for (const csm of stats) {
    const name = csm.name.padEnd(26, " ");

    if (!csm.targets) {
      message += `${name}:memo: ${csm.reviews}       :clipboard: ${csm.references}           :book: ${csm.stories}\n`;
    } else {
      message += `${name}:memo: ${csm.reviews}/${csm.targets.reviews}       :clipboard: ${csm.references}/${csm.targets.references}         :book: ${csm.stories}/${csm.targets.stories}\n`;
    }
  }

  return message;
}

export async function sendSlackUpdate(submissions, messageFormat = "team") {
  const text = messageFormat === "csm"
    ? buildConsolidatedSlackMessage(submissions)
    : buildSlackMessage(submissions);
  const response = await fetch(SLACK_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ text }),
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    throw new Error("Slack endpoint returned an unreadable response.");
  }

  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || "Slack send failed.");
  }

  return { ok: true, text, message: result.message || "Sent to Slack." };
}
