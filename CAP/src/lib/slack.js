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
  if (status === "ahead")    return "🟢";
  if (status === "on_track") return "🟡";
  if (status === "behind")   return "🔴";
  return "⚪";
}

const SLACK_NAMES = {
  "Mohammed Tamiz": "Tamiz",
  "Aravinda G": "Aravinda",
  "Subhopriyo Sen": "Subho",
  "Sakshi Bagri": "Sakshi",
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

  return `📊 Customer Advocacy App — Snapshot | ${dateStr} · Week ${week} of ${PROGRAM_WEEKS}

📊 Team Progress
Reviews      ${progressBar(summary.totalReviews, summary.targets.reviews)}  ${summary.totalReviews} / ${summary.targets.reviews}  (${reviewPct}%)
References   ${progressBar(summary.totalRefs, summary.targets.references)}  ${summary.totalRefs} / ${summary.targets.references}  (${refPct}%)
Stories      ${progressBar(summary.totalStories, summary.targets.stories)}  ${summary.totalStories} / ${summary.targets.stories}  (${storyPct}%)

🏆 Leaderboard
${leaderboardBlock}

⚡ Pace Check
${paceLines}`;
}

export function buildConsolidatedSlackMessage(submissions) {
  const week    = currentWeekNumber();
  const stats   = buildCsmStats(submissions);
  const today   = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  let message = `📊 Customer Advocacy App — CSM Snapshot | ${dateStr} · Week ${week} of ${PROGRAM_WEEKS}\n\n`;
  
  message += `Name                        Reviews      References    Stories\n`;
  message += `─────────────────────────────────────────────────────────────\n\n`;

  for (const csm of stats) {
    const name = csm.name.padEnd(26, " ");
    
    if (!csm.targets) {
      message += `${name}📝 ${csm.reviews}       📋 ${csm.references}           📖 ${csm.stories}\n`;
    } else {
      message += `${name}📝 ${csm.reviews}/${csm.targets.reviews}       📋 ${csm.references}/${csm.targets.references}         📖 ${csm.stories}/${csm.targets.stories}\n`;
    }
  }

  return message;
}

export function buildWeeklySnapshotMessage(submissions) {
  const week    = currentWeekNumber();
  const summary = buildTeamSummary(submissions);
  const stats   = buildCsmStats(submissions);
  const today   = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  const reviewPct = Math.round((summary.totalReviews / summary.targets.reviews) * 100) || 0;
  const refPct    = Math.round((summary.totalRefs / summary.targets.references) * 100) || 0;
  const storyPct  = Math.round((summary.totalStories / summary.targets.stories) * 100) || 0;

  let message = `🎯 Weekly Snapshot — ${dateStr} | Week ${week} of ${PROGRAM_WEEKS}\n`;
  message += `════════════════════════════════════════════════════════════════\n\n`;

  // Team Progress Header
  message += `📊 TEAM PROGRESS\n`;
  message += `─────────────────────────────────────────────────────────────\n`;
  message += `Reviews      ${progressBar(summary.totalReviews, summary.targets.reviews)}  ${summary.totalReviews} / ${summary.targets.reviews}  (${reviewPct}%)\n`;
  message += `References   ${progressBar(summary.totalRefs, summary.targets.references)}  ${summary.totalRefs} / ${summary.targets.references}  (${refPct}%)\n`;
  message += `Stories      ${progressBar(summary.totalStories, summary.targets.stories)}  ${summary.totalStories} / ${summary.targets.stories}  (${storyPct}%)\n\n`;

  // All CSM Members with Real-time Data
  message += `👥 ALL CSM MEMBERS — Live Data\n`;
  message += `─────────────────────────────────────────────────────────────\n`;
  message += `Rank | Name                      | Reviews    | References | Stories    | Points | Pace\n`;
  message += `─────────────────────────────────────────────────────────────\n`;

  for (let i = 0; i < stats.length; i++) {
    const csm = stats[i];
    const rank = i + 1;
    const name = csm.name.length > 23 ? csm.name.substring(0, 23) : csm.name;
    const paddedName = name.padEnd(23, " ");
    
    let reviewsStr, refsStr, storiesStr, paceStr;
    
    if (csm.targets) {
      reviewsStr = `${csm.reviews}/${csm.targets.reviews}`.padEnd(10, " ");
      refsStr = `${csm.references}/${csm.targets.references}`.padEnd(10, " ");
      storiesStr = `${csm.stories}/${csm.targets.stories}`.padEnd(10, " ");
      
      const pace = getPaceStatus(csm.reviews, csm.targets.reviews);
      const paceSymbol = paceEmoji(pace);
      paceStr = paceSymbol;
    } else {
      reviewsStr = `${csm.reviews}`.padEnd(10, " ");
      refsStr = `${csm.references}`.padEnd(10, " ");
      storiesStr = `${csm.stories}`.padEnd(10, " ");
      paceStr = "—";
    }
    
    const rankStr = String(rank).padEnd(4, " ");
    const pointsStr = String(csm.pts).padEnd(6, " ");
    
    message += `${rankStr} | ${paddedName} | ${reviewsStr} | ${refsStr} | ${storiesStr} | ${pointsStr} | ${paceStr}\n`;
  }

  message += `\n════════════════════════════════════════════════════════════════\n`;
  message += `✨ Real-time data • All members included • Updated ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`;

  return message;
}

export async function sendSlackUpdate(submissions, messageFormat = "team") {
  let text;
  if (messageFormat === "csm") {
    text = buildConsolidatedSlackMessage(submissions);
  } else if (messageFormat === "team") {
    text = buildWeeklySnapshotMessage(submissions);
  } else {
    text = buildSlackMessage(submissions);
  }
  
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

export async function sendSnapshotImageToSlack(submissions) {
  try {
    // Build formatted text message with dashboard data
    const week = currentWeekNumber();
    const summary = buildTeamSummary(submissions);
    const lb = buildCsmStats(submissions);
    
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const reviewPct = Math.round((summary.totalReviews / summary.targets.reviews) * 100) || 0;
    const refPct = Math.round((summary.totalRefs / summary.targets.references) * 100) || 0;
    const storyPct = Math.round((summary.totalStories / summary.targets.stories) * 100) || 0;

    // Get top performers
    const topPerformers = lb.slice(0, 4);
    const topList = topPerformers.map((c, i) => `${i + 1}. ${c.name} — ${c.pts} pts`).join("\n");

    // Create formatted message
    const message = `📸 *Weekly Snapshot - ${dateStr} | Week ${week} of ${PROGRAM_WEEKS}*

*Reviews:* ${summary.totalReviews} / ${summary.targets.reviews} (${reviewPct}%)
*References:* ${summary.totalRefs} / ${summary.targets.references} (${refPct}%)
*Stories:* ${summary.totalStories} / ${summary.targets.stories} (${storyPct}%)

*Top Performers:*
${topList}`;

    // Send to Slack
    const response = await fetch("/api/slack-snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });

    const result = await response.json();
    if (!response.ok || !result?.ok) {
      throw new Error(result?.error || "Failed to send snapshot to Slack.");
    }

    return { ok: true, message: "Snapshot sent to Slack! 📸" };
  } catch (error) {
    throw new Error(`Failed to send snapshot: ${error.message}`);
  }
}
