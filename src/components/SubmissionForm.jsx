import { useState, useEffect } from "react";
import { CSM_NAMES, ACTIVITIES, ACTIVITY_CATEGORIES, validateSubmission, calcPoints } from "../types/index.js";
import { Card, FormField, Spinner, colors } from "./ui.jsx";

const EMPTY = { csm: "", activity: "", reviews: "", customerName: "", customerEmail: "", context: "", notes: "" };

const inp = (err) => ({
  width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14,
  border: `1.5px solid ${err ? colors.red : colors.border}`,
  background: "#fff", boxSizing: "border-box", outline: "none", fontFamily: "inherit",
});

export default function SubmissionForm({ onSubmit, editTarget, onCancelEdit, disabled }) {
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [touched, setTouched] = useState({});
  const isEditing = Boolean(editTarget);

  useEffect(() => {
    if (editTarget) {
      setForm({
        csm:           editTarget.csm           || "",
        activity:      editTarget.activity      || "",
        reviews:       String(editTarget.reviews || ""),
        customerName:  editTarget.customerName  || "",
        customerEmail: editTarget.customerEmail || "",
        context:       editTarget.context       || "",
        notes:         editTarget.notes         || "",
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({}); setTouched({});
  }, [editTarget]);

  function set(field, value) {
    setForm(p => ({ ...p, [field]: value }));
    setTouched(p => ({ ...p, [field]: true }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }));
  }

  const act  = ACTIVITIES.find(a => a.label === form.activity);
  const pts  = form.activity ? calcPoints(form.activity, form.reviews) : null;

  const ready = (() => {
    if (!form.csm || !form.activity) return false;
    if (act?.showCount) { const n = parseInt(form.reviews,10); if (!form.reviews||!Number.isFinite(n)||n<1) return false; }
    if (act?.showCustomer) { if (!form.customerName?.trim()) return false; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) return false; }
    if (act?.showContext) { if (!form.context?.trim()) return false; }
    return true;
  })();

  const missing = [];
  if (!form.csm) missing.push("CSM name");
  if (!form.activity) missing.push("Activity");
  if (act?.showCount && !form.reviews) missing.push("No. of reviews");
  if (act?.showCustomer && !form.customerName?.trim()) missing.push("Customer name");
  if (act?.showCustomer && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) missing.push("Customer email");
  if (act?.showContext && !form.context?.trim()) missing.push(act.contextLabel);

  async function save() {
    setTouched({ csm:true,activity:true,reviews:true,customerName:true,customerEmail:true,context:true,notes:true });
    const { valid, errors: ve } = validateSubmission(form);
    if (!valid) { setErrors(ve); return; }
    setSaving(true);
    const res = await onSubmit(form, editTarget?.rowIndex);
    setSaving(false);
    if (res.ok) { setForm(EMPTY); setErrors({}); setTouched({}); }
    else if (res.errors) setErrors(res.errors);
  }

  function cancel() { setForm(EMPTY); setErrors({}); setTouched({}); onCancelEdit?.(); }
  function fe(n) { return touched[n] ? errors[n] : null; }

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>
            {isEditing ? "✏️ Edit submission" : "✏️ Log an activity"}
          </div>
          <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            Fields marked <span style={{ color: colors.red }}>*</span> are required.
          </div>
        </div>

        {errors._global && (
          <div style={{ background:"#fee2e2",color:"#7f1d1d",padding:"10px 14px",borderRadius:8,marginBottom:16,fontSize:13,fontWeight:500 }}>
            ⚠️ {errors._global}
          </div>
        )}

        <FormField label="CSM Name *" error={fe("csm")}>
          <select value={form.csm} onChange={e => set("csm", e.target.value)} style={inp(touched.csm && !form.csm)}>
            <option value="">— select CSM —</option>
            {CSM_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>

        <FormField label="Activity *" error={fe("activity")}>
          <select value={form.activity} onChange={e => { set("activity", e.target.value); set("reviews",""); }}
            style={inp(touched.activity && !form.activity)}>
            <option value="">— select activity —</option>
            {ACTIVITY_CATEGORIES.map(cat => (
              <optgroup key={cat} label={cat}>
                {ACTIVITIES.filter(a => a.category === cat).map(a => (
                  <option key={a.id} value={a.label}>
                    {a.label} — {a.perReview ? `${a.points} pts/review` : `${a.points} pts flat`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </FormField>

        {act?.showCount && (
          <FormField label={`${act.countLabel} *`} error={fe("reviews")}>
            <input type="number" min={1} max={100} value={form.reviews}
              onChange={e => set("reviews", e.target.value)} placeholder="e.g. 3"
              style={inp(touched.reviews && (!form.reviews || parseInt(form.reviews)<1))} />
          </FormField>
        )}

        {act?.showCustomer && (<>
          <FormField label="Customer Name *" error={fe("customerName")}>
            <input type="text" value={form.customerName} onChange={e => set("customerName", e.target.value)}
              placeholder="e.g. John Smith" style={inp(touched.customerName && !form.customerName?.trim())} />
          </FormField>
          <FormField label="Customer Email *" error={fe("customerEmail")}>
            <input type="email" value={form.customerEmail} onChange={e => set("customerEmail", e.target.value)}
              placeholder="e.g. john@acme.com"
              style={inp(touched.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail))} />
          </FormField>
        </>)}

        {act?.showContext && (
          <FormField label={`${act.contextLabel} *`} error={fe("context")}>
            <input type="text" value={form.context} onChange={e => set("context", e.target.value)}
              placeholder={act.contextPlaceholder} style={inp(touched.context && !form.context?.trim())} />
          </FormField>
        )}

        <FormField label="Notes (optional)" error={null}>
          <input value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Any extra context…" style={inp(false)} />
          <div style={{ fontSize:11, color:colors.muted, marginTop:4, textAlign:"right" }}>{form.notes.length}/500</div>
        </FormField>

        {pts !== null && (
          <div style={{ background:"#f0eeff",padding:"12px 16px",borderRadius:10,
            display:"flex",justifyContent:"space-between",alignItems:"center",
            marginBottom:20,border:"1px solid #ddd9ff" }}>
            <span style={{ fontSize:13, color:colors.mid, fontWeight:500 }}>Points for this submission</span>
            <span style={{ fontSize:22, fontWeight:800, color:colors.accent }}>{pts} pts</span>
          </div>
        )}

        {!ready && missing.length > 0 && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {missing.map(m => (
              <span key={m} style={{ fontSize:12, color:colors.muted, background:"#f7f6f2",
                border:`1px solid ${colors.border}`, padding:"3px 9px", borderRadius:20 }}>• {m}</span>
            ))}
          </div>
        )}

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={save} disabled={saving||disabled||!ready} style={{
            flex:1, border:"none", borderRadius:10, fontSize:14, fontWeight:600,
            padding:"12px 20px", cursor:(saving||disabled||!ready)?"not-allowed":"pointer",
            background: ready ? colors.dark : "#d1d5db",
            color: ready ? "#fff" : "#9ca3af",
            transition:"background 0.2s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}>
            {saving ? <><Spinner /> Saving…</> : isEditing ? "✅ Save changes" : ready ? "➕ Submit" : "Complete required fields"}
          </button>
          {isEditing && (
            <button onClick={cancel} disabled={saving} style={{
              border:`1px solid ${colors.border}`,borderRadius:10,fontSize:14,
              fontWeight:600,padding:"12px 20px",cursor:"pointer",background:"#fff",color:colors.dark }}>
              Cancel
            </button>
          )}
        </div>
      </Card>

      {!isEditing && (
        <div style={{ marginTop:20,padding:"18px 20px",background:"#fff",
          border:`1px solid ${colors.border}`,borderRadius:14,fontSize:13,color:colors.mid,lineHeight:1.8 }}>
          <div style={{ fontWeight:700,color:colors.dark,marginBottom:10,fontSize:14 }}>📖 How to use</div>
          <div style={{ display:"grid", gap:5 }}>
            <div><strong style={{color:colors.dark}}>1.</strong> Select your name from the CSM dropdown.</div>
            <div><strong style={{color:colors.dark}}>2.</strong> Pick an activity — grouped into Reviews, Customer Advocacy, and Recognition.</div>
            <div><strong style={{color:colors.dark}}>3.</strong> Fill in required fields — they change based on the activity.</div>
            <div><strong style={{color:colors.dark}}>4.</strong> Submit unlocks once all required fields are valid.</div>
          </div>
          <div style={{ marginTop:14,paddingTop:14,borderTop:`1px solid ${colors.border}`,
            display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))",gap:8 }}>
            {ACTIVITIES.map(a => (
              <div key={a.id} style={{ background:"#f7f6f2",padding:"8px 12px",borderRadius:8 }}>
                <div style={{ fontWeight:600,color:colors.dark,marginBottom:2,fontSize:12 }}>{a.label}</div>
                <div style={{ color:colors.muted,fontSize:11 }}>{a.perReview?`${a.points} pts × reviews`:`${a.points} pts flat`} · {a.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
