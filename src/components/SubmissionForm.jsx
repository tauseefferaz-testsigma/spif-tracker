import { useState, useEffect } from 'react';
import { CSMS, ACTIVITIES, validateSubmission, calcPoints } from '../types/index.js';
import { Card, FormField, Spinner, colors } from './ui.jsx';

const EMPTY_FORM = {
  csm: '', activity: '', reviews: '',
  customerName: '', customerEmail: '', context: '', notes: '',
};

const inputStyle = (hasError) => ({
  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
  border: `1.5px solid ${hasError ? colors.red : colors.border}`,
  background: '#fff', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
});

export default function SubmissionForm({ onSubmit, editTarget, onCancelEdit, disabled }) {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [touched, setTouched] = useState({});

  const isEditing = Boolean(editTarget);

  useEffect(() => {
    if (editTarget) {
      setForm({
        csm:           editTarget.csm           || '',
        activity:      editTarget.activity      || '',
        reviews:       String(editTarget.reviews || ''),
        customerName:  editTarget.customerName  || '',
        customerEmail: editTarget.customerEmail || '',
        context:       editTarget.context       || '',
        notes:         editTarget.notes         || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setTouched({});
  }, [editTarget]);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }

  const selectedActivity = ACTIVITIES.find(a => a.label === form.activity);
  const previewPoints    = form.activity ? calcPoints(form.activity, form.reviews) : null;

  // Gate submit button — all required fields must be filled
  const isFormReady = (() => {
    if (!form.csm)      return false;
    if (!form.activity) return false;
    if (selectedActivity?.showCount) {
      const n = parseInt(form.reviews, 10);
      if (!form.reviews || !Number.isFinite(n) || n < 1) return false;
    }
    if (selectedActivity?.showCustomer) {
      if (!form.customerName?.trim()) return false;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) return false;
    }
    if (selectedActivity?.showContext) {
      if (!form.context?.trim()) return false;
    }
    return true;
  })();

  const isSubmitDisabled = saving || disabled || !isFormReady;

  async function handleSave() {
    setTouched({
      csm: true, activity: true, reviews: true,
      customerName: true, customerEmail: true, context: true, notes: true,
    });
    const { valid, errors: valErrors } = validateSubmission(form);
    if (!valid) { setErrors(valErrors); return; }
    setSaving(true);
    const result = await onSubmit(form, editTarget?.rowIndex);
    setSaving(false);
    if (result.ok) {
      setForm(EMPTY_FORM);
      setErrors({});
      setTouched({});
    } else if (result.errors) {
      setErrors(result.errors);
    }
  }

  function handleCancel() {
    setForm(EMPTY_FORM);
    setErrors({});
    setTouched({});
    onCancelEdit?.();
  }

  function fieldError(name) {
    return touched[name] ? errors[name] : null;
  }

  // Missing fields hint chips
  const missing = [];
  if (!form.csm) missing.push('CSM name');
  if (!form.activity) missing.push('Activity');
  if (selectedActivity?.showCount && !form.reviews) missing.push('No. of reviews');
  if (selectedActivity?.showCustomer && !form.customerName?.trim()) missing.push('Customer name');
  if (selectedActivity?.showCustomer && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) missing.push('Customer email');
  if (selectedActivity?.showContext && !form.context?.trim()) missing.push(selectedActivity.contextLabel || 'Context');

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>
            {isEditing ? '✏️ Edit submission' : '✏️ Log an activity'}
          </div>
          <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            Fields marked <span style={{ color: colors.red }}>*</span> are required.
            Submit unlocks only when all required fields are filled.
          </div>
        </div>

        {errors._global && (
          <div style={{ background: '#fee2e2', color: '#7f1d1d', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
            ⚠️ {errors._global}
          </div>
        )}

        {/* CSM Name */}
        <FormField label="CSM Name *" error={fieldError('csm')}>
          <select value={form.csm} onChange={e => set('csm', e.target.value)} style={inputStyle(touched.csm && !form.csm)}>
            <option value="">— select CSM —</option>
            {CSMS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>

        {/* Activity */}
        <FormField label="Activity *" error={fieldError('activity')}>
          <select
            value={form.activity}
            onChange={e => {
              set('activity', e.target.value);
              // Reset all conditional fields when activity changes
              setForm(prev => ({ ...prev, activity: e.target.value, reviews: '', customerName: '', customerEmail: '', context: '' }));
            }}
            style={inputStyle(touched.activity && !form.activity)}
          >
            <option value="">— select activity —</option>
            {['Primary', 'Recognition'].map(cat => (
              <optgroup key={cat} label={`── ${cat} ──`}>
                {ACTIVITIES.filter(a => a.category === cat).map(a => (
                  <option key={a.id} value={a.label}>
                    {a.label} — {a.perReview ? `${a.points} pts/review` : `${a.points} pts flat`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </FormField>

        {/* No. of Reviews — G2 and Gartner only */}
        {selectedActivity?.showCount && (
          <FormField label={`${selectedActivity.countLabel} *`} error={fieldError('reviews')}>
            <input
              type="number" min={1} max={100}
              value={form.reviews}
              onChange={e => set('reviews', e.target.value)}
              placeholder="e.g. 3"
              style={inputStyle(touched.reviews && (!form.reviews || parseInt(form.reviews) < 1))}
            />
          </FormField>
        )}

        {/* Customer Name + Email — shown together for relevant activities */}
        {selectedActivity?.showCustomer && (
          <>
            <FormField label="Customer Name *" error={fieldError('customerName')}>
              <input
                type="text"
                value={form.customerName}
                onChange={e => set('customerName', e.target.value)}
                placeholder="e.g. John Smith"
                style={inputStyle(touched.customerName && !form.customerName?.trim())}
              />
            </FormField>
            <FormField label="Customer Email *" error={fieldError('customerEmail')}>
              <input
                type="email"
                value={form.customerEmail}
                onChange={e => set('customerEmail', e.target.value)}
                placeholder="e.g. john@acme.com"
                style={inputStyle(touched.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail))}
              />
            </FormField>
          </>
        )}

        {/* Context field — URL, webinar name, etc. */}
        {selectedActivity?.showContext && (
          <FormField label={`${selectedActivity.contextLabel} *`} error={fieldError('context')}>
            <input
              type="text"
              value={form.context}
              onChange={e => set('context', e.target.value)}
              placeholder={selectedActivity.contextPlaceholder}
              style={inputStyle(touched.context && !form.context?.trim())}
            />
          </FormField>
        )}

        {/* Notes — always optional */}
        <FormField label="Notes (optional)" error={null}>
          <input
            type="text"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any extra context…"
            style={inputStyle(false)}
          />
          <div style={{ fontSize: 11, color: colors.muted, marginTop: 4, textAlign: 'right' }}>
            {form.notes.length}/500
          </div>
        </FormField>

        {/* Points preview */}
        {previewPoints !== null && (
          <div style={{
            background: '#f0eeff', padding: '12px 16px', borderRadius: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 20, border: '1px solid #ddd9ff',
          }}>
            <span style={{ fontSize: 13, color: colors.mid, fontWeight: 500 }}>Points for this submission</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: colors.accent }}>{previewPoints} pts</span>
          </div>
        )}

        {/* Missing fields hint */}
        {!isFormReady && missing.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {missing.map(m => (
              <span key={m} style={{ fontSize: 12, color: colors.muted, background: '#f7f6f2', border: `1px solid ${colors.border}`, padding: '3px 9px', borderRadius: 20 }}>
                • {m}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={isSubmitDisabled}
            style={{
              flex: 1, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
              padding: '12px 20px',
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              background: isSubmitDisabled ? '#d1d5db' : colors.dark,
              color: isSubmitDisabled ? '#9ca3af' : '#fff',
              transition: 'background 0.2s, color 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {saving
              ? <><Spinner /> Saving…</>
              : isEditing ? '✅ Save changes'
              : isFormReady ? '➕ Submit'
              : 'Complete required fields to submit'}
          </button>
          {isEditing && (
            <button onClick={handleCancel} disabled={saving} style={{
              border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14,
              fontWeight: 600, padding: '12px 20px',
              cursor: saving ? 'not-allowed' : 'pointer',
              background: '#fff', color: colors.dark,
            }}>
              Cancel
            </button>
          )}
        </div>
      </Card>

      {/* How to use — only on fresh submit form */}
      {!isEditing && (
        <div style={{
          marginTop: 20, padding: '18px 20px', background: '#fff',
          border: `1px solid ${colors.border}`, borderRadius: 14,
          fontSize: 13, color: colors.mid, lineHeight: 1.8,
        }}>
          <div style={{ fontWeight: 700, color: colors.dark, marginBottom: 10, fontSize: 14 }}>
            📖 How to use
          </div>
          <div style={{ display: 'grid', gap: 5 }}>
            <div><strong style={{ color: colors.dark }}>1. Select your name</strong> from the CSM Name dropdown.</div>
            <div><strong style={{ color: colors.dark }}>2. Choose the activity</strong> — grouped into Primary and Recognition. Each shows its point value.</div>
            <div><strong style={{ color: colors.dark }}>3. Fill in the required fields</strong> — these change based on the activity selected.</div>
            <div><strong style={{ color: colors.dark }}>4. For reviews</strong> — enter how many reviews you collected. Points multiply automatically.</div>
            <div><strong style={{ color: colors.dark }}>5. Hit Submit</strong> — the button activates once all required fields are filled.</div>
          </div>

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
            <div style={{ fontWeight: 600, color: colors.dark, marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Primary Activities
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8, marginBottom: 12 }}>
              {ACTIVITIES.filter(a => a.category === 'Primary').map(a => (
                <div key={a.id} style={{ background: '#f7f6f2', padding: '8px 12px', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, color: colors.dark, marginBottom: 2, fontSize: 12 }}>{a.label}</div>
                  <div style={{ color: colors.muted, fontSize: 12 }}>
                    {a.perReview ? `${a.points} pts × reviews` : `${a.points} pts flat`}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontWeight: 600, color: colors.dark, marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Recognition Activities
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
              {ACTIVITIES.filter(a => a.category === 'Recognition').map(a => (
                <div key={a.id} style={{ background: '#f0eeff', padding: '8px 12px', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, color: colors.dark, marginBottom: 2, fontSize: 12 }}>{a.label}</div>
                  <div style={{ color: colors.muted, fontSize: 12 }}>{a.points} pts flat</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
