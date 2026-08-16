import { useMemo } from "react";
import { getPaceStatus, PACE_LABELS, programProgress, PROGRAM_WEEKS, currentWeekNumber, CURRENT_QUARTER } from "../types/index.js";
import { buildLeaderboard } from "../lib/stats.js";
import { Card, Badge, ProgressBar, colors } from "./ui.jsx";

function PaceBadge({ status }) {
  if (!status) return null;
  const p = PACE_LABELS[status];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 99, background: `#${p.bg}`, color: `#${p.color}`,
    }}>{p.label}</span>
  );
}

export default function Leaderboard({ submissions, quarter = CURRENT_QUARTER }) {
  const lb  = useMemo(() => buildLeaderboard(submissions, quarter), [submissions, quarter]);
  const top3 = lb.slice(0, 3);

  return (
    <div>
      {/* Podium */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        {top3.map((c, i) => {
          const accents = ["#f59e0b","#94a3b8","#b45309"];
          const medals  = ["🥇","🥈","🥉"];
          const pace    = c.targets ? getPaceStatus(c.reviews, c.targets.reviews) : null;
          return (
            <div key={c.name} style={{
              background: colors.surface, border: `1px solid ${colors.border}`,
              borderTop: `3px solid ${accents[i]}`, borderRadius: 14,
              padding: "20px 18px", textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{medals[i]}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: colors.dark }}>{c.name}</div>
              <div style={{ fontSize: 11, color: colors.muted, margin: "2px 0 8px" }}>{c.track}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: colors.accent, lineHeight: 1 }}>{c.pts}</div>
              <div style={{ fontSize: 11, color: colors.muted, margin: "4px 0 8px" }}>points</div>
              {pace && <PaceBadge status={pace} />}
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <Card>
        {lb.map((c, i) => {
          const pace      = c.targets ? getPaceStatus(c.reviews, c.targets.reviews) : null;
          const reviewMax = c.targets?.reviews || 0;
          const barColor  = pace === "ahead" ? colors.green : pace === "behind" ? "#ef4444" : colors.accent;
          return (
            <div key={c.name} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 4px",
              borderBottom: i < lb.length - 1 ? `1px solid ${colors.border}` : "none",
            }}>
              <span style={{ width: 28, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#ccc" }}>
                #{i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: colors.muted }}>{c.track}</span>
                  {pace && <PaceBadge status={pace} />}
                </div>
                <div style={{ fontSize: 11, color: colors.muted, marginBottom: 5 }}>
                  {c.reviews} reviews{reviewMax ? ` / ${reviewMax} target` : ""}
                  {" · "}{c.references} refs · {c.stories} stories · {c.activities} total acts
                </div>
                {reviewMax > 0 && <ProgressBar value={c.reviews} max={reviewMax} color={barColor} />}
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: colors.accent, minWidth: 54, textAlign: "right" }}>
                {c.pts} pts
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
