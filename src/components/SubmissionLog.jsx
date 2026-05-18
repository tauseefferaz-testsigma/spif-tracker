import { useState, useMemo } from "react";
import { CSM_NAMES, ACTIVITY_CATEGORIES, formatDate, parseEmailList } from "../types/index.js";
import { Card, Badge, EmptyState, colors } from "./ui.jsx";

export default function SubmissionLog({ submissions, onEdit, onDelete }) {
  const [search,     setSearch]     = useState("");
  const [filterCsm,  setFilterCsm]  = useState("All");
  const [filterCat,  setFilterCat]  = useState("All");
  const [deletingId, setDeletingId] = useState(null);

  const sty = {
    padding: "9px 12px", borderRadius: 8, fontSize: 13,
    border: `1px solid ${colors.border}`, background: "#fff",
    outline: "none", fontFamily: "inherit",
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return submissions
      .filter(r => filterCsm === "All" || r.csm === filterCsm)
      .filter(r => filterCat === "All" || r.category === filterCat)
      .filter(r => {
        if (!q) return true;
        return [r.csm, r.activity, r.customerName, r.customerEmail, r.context, r.notes || ""]
          .some(v => String(v || "").toLowerCase().includes(q));
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [submissions, search, filterCsm, filterCat]);

  async function handleDelete(row) {
    if (!window.confirm(`Delete this entry?\n\n${row.csm} — ${row.activity} (${formatDate(row.date)})\n\nThis cannot be undone.`)) return;
    setDeletingId(row.rowIndex);
    await onDelete(row.rowIndex);
    setDeletingId(null);
  }

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search CSM, activity, customer…"
          style={{ ...sty, flex:1, minWidth:180 }} />
        <select value={filterCsm} onChange={e => setFilterCsm(e.target.value)} style={{ ...sty, width:220 }}>
          <option value="All">All CSMs</option>
          {CSM_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...sty, width:180 }}>
          <option value="All">All categories</option>
          {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <Card>
        {filtered.length === 0
          ? <EmptyState message={submissions.length === 0 ? "No submissions yet. Log the first one!" : "No results match your filters."} />
          : filtered.map((s, i) => (
            <div key={`${s.rowIndex}_${i}`} style={{
              padding:"13px 4px",
              borderBottom: i < filtered.length-1 ? `1px solid ${colors.border}` : "none",
              opacity: s._pending || deletingId === s.rowIndex ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start", justifyContent:"space-between" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", marginBottom:3 }}>
                    <span style={{ fontWeight:600, fontSize:13, color:colors.dark }}>{s.csm}</span>
                    <Badge color={s.category==="Reviews"?"green":s.category==="Customer Advocacy"?"blue":"purple"}>
                      {s.category}
                    </Badge>
                    {s.reviews && Number(s.reviews) > 0 && <Badge color="blue">×{s.reviews} reviews</Badge>}
                    {s._pending && <Badge color="amber">saving…</Badge>}
                  </div>
                  <div style={{ fontSize:13, color:colors.mid }}>{s.activity}</div>
                  {(s.customerName || s.customerEmail) && (
                    <div style={{ fontSize:12, color:colors.muted, marginTop:2 }}>
                      👤 {s.customerName}
                      {s.customerEmail && (
                        <span style={{ display:"block", whiteSpace:"pre-wrap", marginTop:2 }}>
                          {parseEmailList(s.customerEmail).join("\n")}
                        </span>
                      )}
                    </div>
                  )}
                  {s.context && <div style={{ fontSize:12, color:colors.muted, marginTop:2 }}>🔗 {s.context}</div>}
                  {s.notes   && <div style={{ fontSize:12, color:colors.muted, marginTop:2, fontStyle:"italic" }}>{s.notes}</div>}
                  <div style={{ fontSize:11, color:"#bbb", marginTop:3 }}>{formatDate(s.date)}</div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                  <span style={{ fontWeight:700, fontSize:15, color:colors.accent }}>+{s.points}</span>
                  {!s._pending && (<>
                    <button onClick={() => onEdit(s)} disabled={deletingId===s.rowIndex}
                      style={{ border:`1px solid ${colors.border}`,borderRadius:8,fontSize:12,
                        fontWeight:600,padding:"5px 10px",cursor:"pointer",background:"#fff",color:colors.dark }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(s)} disabled={deletingId===s.rowIndex}
                      style={{ border:"1px solid #fecaca",borderRadius:8,fontSize:12,
                        fontWeight:600,padding:"5px 10px",cursor:"pointer",background:"#fee2e2",color:"#b91c1c" }}>
                      {deletingId===s.rowIndex ? "…" : "🗑️"}
                    </button>
                  </>)}
                </div>
              </div>
            </div>
          ))
        }
      </Card>
      <div style={{ marginTop:10,fontSize:12,color:colors.muted,textAlign:"right" }}>
        {filtered.length} of {submissions.length} submissions
      </div>
    </div>
  );
}
