import { useState, useEffect } from 'react';
import { CSMS, TIERS, ACTIVITIES, validateSubmission, calcPoints } from '../types/index.js';
import { Card, FormField, Spinner, colors } from './ui.jsx';

const EMPTY_FORM = { csm: '', tier: 'SMB', activity: '', reviews: '', notes: '' };

const inputBase = (hasError) => ({
  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
  border: `1.5px solid ${hasError ? colors.red : colors.border}`,
  background: '#fff', boxSizing: 'border-box', outline: 'none',
  fontFamily: 'inherit',
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
        csm:      editTarget.csm      || '',
        tier:     editTarget.tier     || 'SMB',
        activity: editTarget.activity || '',
        reviews:  String(editTarget.reviews || ''),
        notes:    editTarget.notes    || '',
      });
      setErrors({});
      setTouched({});
    } else {
      setForm(EMPTY_FORM);
      setErrors({});
      setTouched({});
    }
  }, [editTarget]);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }

  const selectedActivity = ACTIVITIES.find(a => a.label === form.activity);
  const showReviewsField = selectedActivity?.showCount || false;
  const reviewsLabel     = selectedActivity?.countLabel || 'No. of Reviews';
  const previewPoints    = form.activity ? calcPoints(form.activity, form.reviews) : null;

  // Form is only ready when ALL required fields are filled — applies to both submit and edit
  const isFormReady = (() => {
    if (!form.csm)      return false;
    if (!form.tier)     return false;
    if (!form.activity) return false;
    if (showReviewsField) {
      const n = parseInt(form.reviews, 10);
      if (!form.reviews || !Number.isFinite(n) || n < 1) return false;
    }
    return true;
  })();

  const isSubmitDisabled = saving || disabled || !isFormReady;

  async function handleSave() {
    // Touch all fields to reveal any hidden errors
    setTouched({ csm: true, tier: true, activity: true, reviews: true, notes: true });

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

  // Only show field error after user has interacted with that field
  function fieldError(name) {
    return touched[name] ? errors[name] : null;
  }

  return (
    <div>
      <Card>
        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>
            {isEditing ? '✏️ Edit submission' : '✏️ Log an activity'}
          </div>
          <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            Fields marked <span style={{ color: colors.red }}>*</span> are required. Submit unlocks only when all required fields are filled.
          </div>
        </div>

        {/* Global error */}
        {errors._global && (
          <div style={{ background: '#fee2e2', color: '#7f1d1d', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
            ⚠️ {errors._global}
          </div>
        )}

        {/* CSM Name */}
        <FormField label="CSM Name *" error={fieldError('csm')}>
          <select
            value={form.csm}
            onChange={e => set('csm', e.target.value)}
            style={inputBase(touched.csm && !form.csm)}
          >
            <option value="">— select CSM —</option>
            {CSMS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>

        {/* Tier */}
        <FormField label="Tier *" error={fieldError('tier')}>
          <select
            value={form.tier}
            onChange={e => set('tier', e.target.value)}
            style={inputBase(false)}
          >
            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>

        {/* Activity */}
        <FormField label="Activity *" error={fieldError('activity')}>
          <select
            value={form.activity}
            onChange={e => { set('activity', e.target.value); set('reviews', ''); }}
            style={inputBase(touched.activity && !form.activity)}
          >
            <option value="">— select activity —</option>
            {ACTIVITIES.map(a => (
              <option key={a.id} value={a.label}>
                {a.label} — {a.perReview ? `${a.points} pts/review` : `${a.points} pts flat`}
              </option>
            ))}
          </select>
        </FormField>

        {/* No. of Reviews — only for G2 activities */}
        {showReviewsField && (
          <FormField label={`${reviewsLabel} *`} error={fieldError('reviews')}>
            <input
              type="number"
              min={1}
              max={100}
              value={form.reviews}
              onChange={e => set('reviews', e.target.value)}
              placeholder="e.g. 3"
              style={inputBase(touched.reviews && (!form.reviews || parseInt(form.reviews) < 1))}
            />
          </FormField>
        )}

        {/* Notes — optional */}
        <FormField label="Notes (optional)" error={null}>
          <input
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Customer name, review link, context…"
            style={inputBase(false)}
          />
          <div style={{ fontSize: 11, color: colors.muted, marginTop: 4, textAlign: 'right' }}>
            {form.notes.length}/500
          </div>
        </FormField>

        {/* Points preview — shows once activity is picked */}
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

        {/* Missing fields hint — only while form is incomplete */}
        {!isFormReady && (
          <div style={{ fontSize: 12, color: colors.muted, marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!form.csm && (
              <span style={{ background: '#f7f6f2', border: `1px solid ${colors.border}`, padding: '3px 9px', borderRadius: 20 }}>
                • CSM name
              </span>
            )}
            {!form.activity && (
              <span style={{ background: '#f7f6f2', border: `1px solid ${colors.border}`, padding: '3px 9px', borderRadius: 20 }}>
                • Activity
              </span>
            )}
            {showReviewsField && !form.reviews && (
              <span style={{ background: '#f7f6f2', border: `1px solid ${colors.border}`, padding: '3px 9px', borderRadius: 20 }}>
                • No. of reviews
              </span>
            )}
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
              : isEditing
                ? '✅ Save changes'
                : isFormReady
                  ? '➕ Submit'
                  : 'Complete required fields to submit'}
          </button>

          {isEditing && (
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{
                border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14,
                fontWeight: 600, padding: '12px 20px',
                cursor: saving ? 'not-allowed' : 'pointer',
                background: '#fff', color: colors.dark,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </Card>

      {/* How to use — only on the submit (non-editing) view */}
      {!isEditing && (
        <div style={{
          marginTop: 20, padding: '18px 20px',
          background: '#fff', border: `1px solid ${colors.border}`,
          borderRadius: 14, fontSize: 13, color: colors.mid, lineHeight: 1.8,
        }}>
          <div style={{ fontWeight: 700, color: colors.dark, marginBottom: 10, fontSize: 14 }}>
            📖 How to use
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <div>
              <strong style={{ color: colors.dark }}>1. Select your name</strong> from the CSM Name dropdown.
            </div>
            <div>
              <strong style={{ color: colors.dark }}>2. Pick the tier</strong> — SMB or Enterprise.
            </div>
            <div>
              <strong style={{ color: colors.dark }}>3. Choose the activity</strong> — each shows its point value.
            </div>
            <div>
              <strong style={{ color: colors.dark }}>4. For G2 Reviews</strong> — enter how many reviews you collected. Points multiply automatically.
            </div>
            <div>
              <strong style={{ color: colors.dark }}>5. Add optional notes</strong> — customer name, link, or any context.
            </div>
            <div>
              <strong style={{ color: colors.dark }}>6. Hit Submit</strong> — the button activates once all required fields are filled.
            </div>
          </div>

          <div style={{
            marginTop: 14, paddingTop: 14,
            borderTop: `1px solid ${colors.border}`,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8,
          }}>
            <div style={{ background: '#f7f6f2', padding: '8px 12px', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, color: colors.dark, marginBottom: 2 }}>G2 Review — SMB</div>
              <div style={{ color: colors.muted }}>10 pts × no. of reviews</div>
            </div>
            <div style={{ background: '#f7f6f2', padding: '8px 12px', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, color: colors.dark, marginBottom: 2 }}>G2 Review — Enterprise</div>
              <div style={{ color: colors.muted }}>20 pts × no. of reviews</div>
            </div>
            <div style={{ background: '#f7f6f2', padding: '8px 12px', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, color: colors.dark, marginBottom: 2 }}>Case Study</div>
              <div style={{ color: colors.muted }}>20 pts flat</div>
            </div>
            <div style={{ background: '#f7f6f2', padding: '8px 12px', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, color: colors.dark, marginBottom: 2 }}>GPI</div>
              <div style={{ color: colors.muted }}>15 pts flat</div>
            </div>
          </div>

          <div style={{ marginTop: 12, padding: '8px 12px', background: '#f0eeff', borderRadius: 8, fontSize: 12 }}>
            🏅 Reach <strong>50 pts</strong> to unlock your payout bonus · Reach <strong>200 pts</strong> for certification bonus
          </div>
        </div>
      )}
    </div>
  );
}
