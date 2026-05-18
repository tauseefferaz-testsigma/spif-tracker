import { useMemo, useState } from "react";
import {
  TEAM_TARGETS, PROGRAM_WEEKS, currentWeekNumber,
  programProgress, getPaceStatus, PACE_LABELS,
} from "../types/index.js";
import {
  buildTeamSummary, buildCsmStats, buildActivityBreakdown,
} from "../lib/stats.js";
import { exportReport } from "../lib/pdf.js";
import { sendSlackUpdate, isSlackConfigured } from "../lib/slack.js";
import { Card, StatCard, Badge, ProgressBar, Button, SectionTitle, colors } from "./ui.jsx";

// ─── PACE BADGE ───────────────────────────────────────────────────────────────
function PaceBadge({ status }) {
  if (!status) return null;
  const p = PACE_LABELS[status];
  async function handleSendSlack() {
    setSlacking(true);
    setSlackMsg(null);
    try {
      const result = await sendSlackUpdate(submissions);
      setSlackMsg({ ok: true, text: "✅ Sent to #spiff-ops!" });
    } catch (err) {
      setSlackMsg({ ok: false, text: `❌ ${err.message}` });
    } finally {
      setSlacking(false);
      setTimeout(() => setSlackMsg(null), 5000);
    }
  }

  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 99, background: `#${p.bg}`, color: `#${p.color}`,
    }}>{p.label}</span>
  );
}

// ─── MINI PROGRESS ────────────────────────────────────────────────────────────
function MiniProgress({ label, actual, target, color = colors.accent }) {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: colors.muted }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: colors.dark }}>
          {actual}{target ? ` / ${target}` : ""}
        </span>
      </div>
      <ProgressBar value={actual} max={target || 1} color={color} />
    </div>
  );
}

// ─── CSM CARD ─────────────────────────────────────────────────────────────────
function CsmCard({ csm }) {
  const hasTargets = Boolean(csm.targets);
  const reviewPace = hasTargets ? getPaceStatus(csm.reviews, csm.targets.reviews) : null;

  return (
    <div style={{
      background: colors.surface, border: `1px solid ${colors.border}`,
      borderRadius: 12, padding: "14px 16px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: colors.dark }}>{csm.name}</div>
          <div style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>{csm.track}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: colors.accent }}>{csm.pts}</span>
          <span style={{ fontSize: 10, color: colors.muted }}>pts</span>
        </div>
      </div>

      {hasTargets ? (
        <>
          {/* Pace */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: colors.muted }}>Pace:</span>
            <PaceBadge status={reviewPace} />
          </div>

          {/* Progress bars */}
          <MiniProgress
            label="Reviews"
            actual={csm.reviews}
            target={csm.targets.reviews}
            color={colors.green}
          />
          <MiniProgress
            label="References"
            actual={csm.references}
            target={csm.targets.references}
            color={colors.accent}
          />
          <MiniProgress
            label="Stories"
            actual={csm.stories}
            target={csm.targets.stories}
            color={colors.purple}
          />
        </>
      ) : (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: colors.muted }}>
            <span>Reviews: <strong style={{ color: colors.dark }}>{csm.reviews}</strong></span>
            <span>References: <strong style={{ color: colors.dark }}>{csm.references}</strong></span>
            <span>Stories: <strong style={{ color: colors.dark }}>{csm.stories}</strong></span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: colors.muted, fontStyle: "italic" }}>
            No Q2 target assigned
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
export default function Dashboard({ submissions }) {
  const summary  = useMemo(() => buildTeamSummary(submissions),    [submissions]);
  const csmStats = useMemo(() => buildCsmStats(submissions),       [submissions]);
  const actBreak = useMemo(() => buildActivityBreakdown(submissions), [submissions]);

  const [slacking,  setSlacking]  = useState(false);
  const [slackMsg,   setSlackMsg]  = useState(null); // {ok, text}
  const week     = currentWeekNumber();
  const progress = programProgress();

  // split into with-targets and without
  const withTargets    = csmStats.filter(c => c.targets);
  const withoutTargets = csmStats.filter(c => !c.targets);

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.dark, margin: 0 }}>📊 Q2 Dashboard</h2>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>
            Week {week} of {PROGRAM_WEEKS} · Program starts {new Date("2026-05-01").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {isSlackConfigured() && (
            <Button variant="secondary" onClick={handleSendSlack} disabled={slacking}>
              {slacking ? "Sending…" : "💬 Send to Slack"}
            </Button>
          )}
          <Button variant="secondary" onClick={() => exportReport(submissions)}>
            ⬇ Download PDF
          </Button>
        </div>
      </div>

      {/* Slack feedback */}
      {slackMsg && (
        <div style={{
          padding: "10px 16px", borderRadius: 10, marginBottom: 16,
          fontSize: 13, fontWeight: 500,
          background: slackMsg.ok ? "#dcfce7" : "#fee2e2",
          color:      slackMsg.ok ? "#14532d" : "#7f1d1d",
        }}>
          {slackMsg.text}
        </div>
      )}

      {/* ── PROGRAM PROGRESS BAR ───────────────────────────────────────────── */}
      <Card style={{ marginBottom: 20, padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: colors.mid }}>Q2 Sprint Progress</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.dark }}>
            Week {week} / {PROGRAM_WEEKS} ({Math.round(progress * 100)}% of program elapsed)
          </span>
        </div>
        <div style={{ background: "#f0efe9", borderRadius: 99, height: 8, overflow: "hidden" }}>
          <div style={{ width: `${progress * 100}%`, background: colors.dark, height: "100%", transition: "width 0.5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {Array.from({ length: PROGRAM_WEEKS }).map((_, i) => (
            <span key={i} style={{ fontSize: 10, color: i < week ? colors.dark : colors.muted, fontWeight: i < week ? 700 : 400 }}>
              W{i + 1}
            </span>
          ))}
        </div>
      </Card>

      {/* ── TEAM SUMMARY CARDS ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Points"   value={summary.totalPts}     accent={colors.accent} />
        <StatCard
          label="Reviews"
          value={`${summary.totalReviews} / ${summary.targets.reviews}`}
          accent={colors.green}
          sub={`${Math.round((summary.totalReviews / summary.targets.reviews) * 100)}% of team target`}
        />
        <StatCard
          label="References"
          value={`${summary.totalRefs} / ${summary.targets.references}`}
          accent={colors.purple}
          sub={`${Math.round((summary.totalRefs / summary.targets.references) * 100)}% of team target`}
        />
        <StatCard
          label="Stories"
          value={`${summary.totalStories} / ${summary.targets.stories}`}
          accent={colors.amber}
          sub={`${Math.round((summary.totalStories / summary.targets.stories) * 100)}% of team target`}
        />
        <StatCard label="Activities Logged" value={summary.totalActs} accent={colors.dark} />
      </div>

      {/* ── TEAM PROGRESS BARS ──────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Team Target Progress</SectionTitle>
        <div style={{ display: "grid", gap: 14 }}>
          {[
            { label: "Reviews",    actual: summary.totalReviews, target: summary.targets.reviews,   color: colors.green  },
            { label: "References", actual: summary.totalRefs,    target: summary.targets.references, color: colors.purple },
            { label: "Stories",    actual: summary.totalStories, target: summary.targets.stories,    color: colors.amber  },
          ].map(({ label, actual, target, color }) => {
            const pct = Math.min(100, Math.round((actual / target) * 100));
            return (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{label}</span>
                  <span style={{ fontSize: 13, color: colors.muted }}>
                    <strong style={{ color: colors.dark }}>{actual}</strong> / {target}
                    <span style={{ marginLeft: 8, fontWeight: 700, color }}>{pct}%</span>
                  </span>
                </div>
                <ProgressBar value={actual} max={target} color={color} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── PER-CSM TARGET GRID ──────────────────────────────────────────────── */}
      <SectionTitle>Individual Progress — Q2 Targets</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 20 }}>
        {withTargets.map(csm => <CsmCard key={csm.name} csm={csm} />)}
      </div>

      {/* CSMs without targets */}
      {withoutTargets.length > 0 && (
        <>
          <SectionTitle>Team Members — No Q2 Target Assigned</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 20 }}>
            {withoutTargets.map(csm => <CsmCard key={csm.name} csm={csm} />)}
          </div>
        </>
      )}

      {/* ── ACTIVITY BREAKDOWN ───────────────────────────────────────────────── */}
      <Card>
        <SectionTitle>Activity Breakdown</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f7f6f2" }}>
              <th style={{ textAlign: "left",   padding: "9px 12px", fontWeight: 600, color: colors.muted }}>Activity</th>
              <th style={{ textAlign: "left",   padding: "9px 12px", fontWeight: 600, color: colors.muted }}>Category</th>
              <th style={{ textAlign: "center", padding: "9px 12px", fontWeight: 600, color: colors.muted }}>Count</th>
              <th style={{ textAlign: "center", padding: "9px 12px", fontWeight: 600, color: colors.muted }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {actBreak.map(a => (
              <tr key={a.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "9px 12px" }}>{a.label}</td>
                <td style={{ padding: "9px 12px" }}>
                  <Badge color={a.category === "Reviews" ? "green" : a.category === "Customer Advocacy" ? "blue" : "purple"}>
                    {a.category}
                  </Badge>
                </td>
                <td style={{ textAlign: "center", padding: "9px 12px" }}>{a.count}</td>
                <td style={{ textAlign: "center", padding: "9px 12px", fontWeight: 600, color: colors.accent }}>{a.pts}</td>
              </tr>
            ))}
            <tr style={{ borderTop: `2px solid ${colors.dark}`, background: "#f7f6f2" }}>
              <td colSpan={2} style={{ padding: "9px 12px", fontWeight: 700 }}>TOTAL</td>
              <td style={{ textAlign: "center", padding: "9px 12px", fontWeight: 700 }}>
                {actBreak.reduce((s, a) => s + a.count, 0)}
              </td>
              <td style={{ textAlign: "center", padding: "9px 12px", fontWeight: 700, color: colors.accent }}>
                {actBreak.reduce((s, a) => s + a.pts, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
