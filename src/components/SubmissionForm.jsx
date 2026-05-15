import { useState, useEffect } from 'react';
import { CSMS, TIERS, ACTIVITIES, validateSubmission, calcPoints } from '../types/index.js';
import { Card, FormField, Select, Input, Button, Spinner, colors } from './ui.jsx';

const EMPTY_FORM = { csm: '', tier: 'SMB', activity: '', reviews: '', notes: '' };

export default function SubmissionForm({ onSubmit, editTarget, onCancelEdit, disabled }) {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);

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
    } else {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [editTarget]);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }

  const selectedActivity = ACTIVITIES.find(a => a.label === form.activity);
  const previewPoints    = form.activity ? calcPoints(form.activity, form.reviews) : null;

  async function handleSave() {
    const { valid, errors: valErrors } = validateSubmission(form);
    if (!valid) {
      setErrors(valErrors);
      return;
    }
    setSaving(true);
    const result = await onSubmit(form, editTarget?.rowIndex);
    setSaving(false);
    if (result.ok) {
      setForm(EMPTY_FORM);
      setErrors({});
    } else if (result.errors) {
      setErrors(result.errors);
    }
  }

  function handleCancel() {
    setForm(EMPTY_FORM);
    setErrors({});
    onCancelEdit?.();
  }

  return (
    <Card>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>
          {isEditing ? '✏️ Edit submission' : '✏️ Log an activity'}
        </div>
        <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
          {isEditing
            ? 'Update the entry and click Save. Changes apply to Google Sheet immediately.'
            : 'All fields marked * are required. Points calculate automatically.'}
        </div>
      </div>

      {errors._global && (
        <div style={{ background: '#fee2e2', color: '#7f1d1d', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          ⚠️ {errors._global}
        </div>
      )}

      <FormField label="CSM Name *" error={errors.csm}>
        <Select
          value={form.csm}
          onChange={v => set('csm', v)}
          options={CSMS}
          placeholder="— select CSM —"
        />
      </FormField>

      <FormField label="Tier *" error={errors.tier}>
        <Select
          value={form.tier}
          onChange={v => set('tier', v)}
          options={TIERS}
        />
      </FormField>

      <FormField label="Activity *" error={errors.activity}>
        <Select
          value={form.activity}
          onChange={v => {
            set('activity', v);
            set('reviews', '');
          }}
          options={ACTIVITIES.map(a => ({ value: a.label, label: `${a.label} (${a.perReview ? `${a.points} pts/review` : `${a.points} pts flat`})` }))}
          placeholder="— select activity —"
        />
      </FormField>

      {selectedActivity?.perReview && (
        <FormField label="Number of Reviews *" error={errors.reviews}>
          <Input
            type="number"
            min={1} max={100}
            value={form.reviews}
            onChange={v => set('reviews', v)}
            placeholder="e.g. 3"
          />
        </FormField>
      )}

      <FormField label="Notes (optional)" error={errors.notes}>
        <Input
          value={form.notes}
          onChange={v => set('notes', v)}
          placeholder="Customer name, review link, context…"
        />
        <div style={{ fontSize: 11, color: colors.muted, marginTop: 4, textAlign: 'right' }}>
          {form.notes.length}/500
        </div>
      </FormField>

      {previewPoints !== null && (
        <div style={{
          background: '#f0eeff', padding: '12px 16px', borderRadius: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 13, color: colors.mid, fontWeight: 500 }}>Points for this submission</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: colors.accent }}>{previewPoints} pts</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button
          onClick={handleSave}
          disabled={saving || disabled}
          style={{ flex: 1 }}
        >
          {saving ? <><Spinner /> Saving…</> : isEditing ? '✅ Save changes' : '➕ Submit'}
        </Button>
        {isEditing && (
          <Button variant="secondary" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}
