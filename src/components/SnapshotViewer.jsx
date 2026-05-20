import { useState, useRef, useEffect } from "react";
import { currentWeekNumber, PROGRAM_WEEKS, formatDate } from "../types/index.js";
import { buildTeamSummary, buildLeaderboard } from "../lib/stats.js";
import { Card, Button, colors } from "./ui.jsx";

export default function SnapshotViewer({ submissions, onClose, onSnapshot }) {
  const [snapshotData, setSnapshotData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const snapshotRef = useRef(null);

  useEffect(() => {
    // Build snapshot data from current submissions
    const summary = buildTeamSummary(submissions);
    const leaderboard = buildLeaderboard(submissions);
    const topPerformers = leaderboard.slice(0, 4);
    const week = currentWeekNumber();
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const reviewPct = summary.targets.reviews > 0 
      ? Math.round((summary.totalReviews / summary.targets.reviews) * 100) 
      : 0;
    const refPct = summary.targets.references > 0 
      ? Math.round((summary.totalRefs / summary.targets.references) * 100) 
      : 0;
    const storyPct = summary.targets.stories > 0 
      ? Math.round((summary.totalStories / summary.targets.stories) * 100) 
      : 0;

    const data = {
      week,
      dateStr,
      totalReviews: summary.totalReviews,
      targetReviews: summary.targets.reviews,
      reviewPct,
      totalRefs: summary.totalRefs,
      targetRefs: summary.targets.references,
      refPct,
      totalStories: summary.totalStories,
      targetStories: summary.targets.stories,
      storyPct,
      topPerformers,
      generatedAt: new Date().toISOString(),
    };

    setSnapshotData(data);

    if (onSnapshot) {
      onSnapshot(data);
    }
  }, [submissions, onSnapshot]);

  async function exportAsImage() {
    if (!snapshotRef.current) return;
    setIsExporting(true);
    setExportError(null);
    try {
      // Use html2canvas if available, otherwise fall back to print
      if (typeof window !== 'undefined' && window.html2canvas) {
        const canvas = await window.html2canvas(snapshotRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
          logging: false,
        });
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `advocacy-snapshot-${snapshotData.dateStr.replace(/\s/g, "-")}.png`;
        link.click();
      } else {
        // Fallback: use print dialog or provide alternative
        setExportError("Image export requires html2canvas library. Use print-to-PDF instead.");
      }
    } catch (err) {
      setExportError(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  }

  function printSnapshot() {
    if (!snapshotRef.current) return;
    const printWindow = window.open('', '', 'height=800,width=1000');
    const snapshotHTML = snapshotRef.current.innerHTML;
    const styles = `
      <style>
        * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        body { background: #fff; padding: 20px; margin: 0; }
        @media print { body { padding: 0; } }
      </style>
    `;
    printWindow.document.write(`<!DOCTYPE html><html><head>${styles}</head><body>${snapshotHTML}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  }

  if (!snapshotData) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: colors.muted }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        Loading snapshot data…
      </div>
    );
  }

  return (
    <div style={{ background: colors.bg, borderRadius: 16, padding: "24px", marginBottom: 20 }}>
      {/* Snapshot Container */}
      <div
        ref={snapshotRef}
        style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: "32px",
          marginBottom: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 700, margin: "0 0 8px 0", color: colors.dark }}>
              Weekly Snapshot
            </h1>
            <p style={{ fontSize: 18, color: colors.mid, margin: 0 }}>of the Program</p>
          </div>
          <div style={{ textAlign: "right", color: colors.mid, fontSize: 14 }}>
            📅 Week {snapshotData.week} of {PROGRAM_WEEKS} · {snapshotData.dateStr}
          </div>
        </div>

        {/* Three Main Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {/* Reviews Card */}
          <div style={{
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 24,
              }}>
                ⭐
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>Reviews</div>
              </div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#4f46e5", marginBottom: 4 }}>
              {snapshotData.totalReviews} <span style={{ fontSize: 24, color: colors.dark }}> / {snapshotData.targetReviews}</span>
            </div>
            <div style={{ fontSize: 14, color: colors.mid, marginBottom: 12 }}>
              {snapshotData.reviewPct}% Completed
            </div>
            <div style={{ width: "100%", height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${snapshotData.reviewPct}%`,
                background: "#4f46e5",
                borderRadius: 3,
              }} />
            </div>
          </div>

          {/* References Card */}
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #dcfce7",
            borderRadius: 12,
            padding: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 24,
              }}>
                👥
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>References</div>
              </div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#059669", marginBottom: 4 }}>
              {snapshotData.totalRefs} <span style={{ fontSize: 24, color: colors.dark }}> / {snapshotData.targetRefs}</span>
            </div>
            <div style={{ fontSize: 14, color: colors.mid, marginBottom: 12 }}>
              {snapshotData.refPct}% Completed
            </div>
            <div style={{ width: "100%", height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${snapshotData.refPct}%`,
                background: "#059669",
                borderRadius: 3,
              }} />
            </div>
          </div>

          {/* Stories Card */}
          <div style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: 12,
            padding: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 24,
              }}>
                📖
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>Stories</div>
              </div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#d97706", marginBottom: 4 }}>
              {snapshotData.totalStories} <span style={{ fontSize: 24, color: colors.dark }}> / {snapshotData.targetStories}</span>
            </div>
            <div style={{ fontSize: 14, color: colors.mid, marginBottom: 12 }}>
              {snapshotData.storyPct}% Completed
            </div>
            <div style={{ width: "100%", height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${snapshotData.storyPct}%`,
                background: "#d97706",
                borderRadius: 3,
              }} />
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Team Progress */}
          <div style={{
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>📈</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: colors.dark }}>Team Progress</h3>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { label: "Reviews", actual: snapshotData.totalReviews, target: snapshotData.targetReviews, pct: snapshotData.reviewPct },
                { label: "References", actual: snapshotData.totalRefs, target: snapshotData.targetRefs, pct: snapshotData.refPct },
                { label: "Stories", actual: snapshotData.totalStories, target: snapshotData.targetStories, pct: snapshotData.storyPct },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: colors.dark }}>{item.label}</span>
                    <span style={{ color: colors.muted }}>{item.actual}/{item.target} ({item.pct}%)</span>
                  </div>
                  <div style={{ width: "100%", height: 5, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${item.pct}%`,
                      background: "#6366f1",
                      borderRadius: 99,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div style={{
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>🏆</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: colors.dark }}>Top Performers</h3>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {snapshotData.topPerformers.map((csm, i) => {
                let ptsBg = "transparent";
                if (csm.pts > 10) ptsBg = "#dcfce7";
                else if (csm.pts > 5) ptsBg = "#fef3c7";
                else if (csm.pts > 0) ptsBg = "#fee2e2";

                return (
                  <div key={csm.name} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "#ffffff",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: colors.muted, minWidth: 20 }}>
                        {i + 1}.
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>
                        {csm.name.split(" ")[0]}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#059669",
                      background: ptsBg,
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}>
                      {csm.pts} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingTop: 16,
          borderTop: "1px solid #e5e7eb",
          marginTop: 16,
          fontSize: 12,
          color: colors.muted,
        }}>
          <span>✨</span>
          <span>Snapshot generated on {snapshotData.dateStr} • Ready to share</span>
        </div>
      </div>

      {/* Export Error */}
      {exportError && (
        <div style={{
          background: "#fee2e2",
          color: "#7f1d1d",
          padding: "10px 14px",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
        }}>
          ⚠️ {exportError}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="secondary" onClick={printSnapshot}>
          🖨 Print / Save as PDF
        </Button>
      </div>
    </div>
  );
}
