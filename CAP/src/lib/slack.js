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

export async function sendSnapshotImageToSlack(submissions) {
  try {
    // Dynamically import html2canvas
    const html2canvas = (await import("html2canvas")).default;
    
    // Find the main dashboard content area
    const dashboardElement = document.querySelector('main') || 
                            document.querySelector('[role="main"]') ||
                            document.querySelector('.dashboard') ||
                            document.body.querySelector('div[style*="maxWidth"]') ||
                            document.body;
    
    if (!dashboardElement) {
      throw new Error("Could not find dashboard element to capture.");
    }

    // Capture the element as a canvas with high quality
    const canvas = await html2canvas(dashboardElement, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowHeight: dashboardElement.scrollHeight,
      windowWidth: dashboardElement.scrollWidth,
    });

    // Convert canvas to PNG blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error("Failed to create image blob."));
          return;
        }

        try {
          // Convert blob to base64
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const base64 = reader.result.split(",")[1];
              
              // Send to backend API
              const response = await fetch("/api/slack-snapshot", {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({
                  text: `📸 Weekly Snapshot - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
                  image_base64: base64,
                  image_type: "png",
                  isImage: true,
                }),
              });

              const result = await response.json();
              if (!response.ok || !result?.ok) {
                throw new Error(result?.error || "Failed to send snapshot to Slack.");
              }

              resolve({ ok: true, message: "Snapshot sent to Slack! 📸" });
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error("Failed to read blob as base64."));
          reader.readAsDataURL(blob);
        } catch (error) {
          reject(error);
        }
      }, "image/png", 1.0);
    });
  } catch (error) {
    throw new Error(`Failed to capture and send snapshot: ${error.message}`);
  }
}
