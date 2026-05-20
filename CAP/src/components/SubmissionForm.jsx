import { useState } from 'react';
import { CSM_TARGETS, ACTIVITY_TYPES } from '../types/index.js';
import { Card, Button, colors } from './ui.jsx';

export default function SubmissionForm({ onSubmit, disabled }) {
  const [formData, setFormData] = useState({
    csmName: '',
    activityType: '',
    customer: '',
  });

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    
    const activity = ACTIVITY_TYPES.find(a => a.id === formData.activityType);
    const result = await onSubmit({
      ...formData,
      points: activity?.points || 0,
    });

    if (result.ok) {
      setFormData({ csmName: '', activityType: '', customer: '' });
    }
    setSubmitting(false);
  }

  return (
    <Card>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Log Activity</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.dark, marginBottom: 6 }}>
            CSM Name
          </label>
          <select
            value={formData.csmName}
            onChange={e => setFormData({ ...formData, csmName: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              background: colors.surface,
            }}
          >
            <option value="">Select CSM</option>
            {Object.keys(CSM_TARGETS).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.dark, marginBottom: 6 }}>
            Activity Type
          </label>
          <select
            value={formData.activityType}
            onChange={e => setFormData({ ...formData, activityType: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              background: colors.surface,
            }}
          >
            <option value="">Select Activity</option>
            {ACTIVITY_TYPES.map(type => (
              <option key={type.id} value={type.id}>
                {type.label} ({type.points} pts)
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.dark, marginBottom: 6 }}>
            Customer Name
          </label>
          <input
            type="text"
            value={formData.customer}
            onChange={e => setFormData({ ...formData, customer: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              background: colors.surface,
            }}
          />
        </div>

        <Button type="submit" disabled={disabled || submitting}>
          {submitting ? 'Submitting…' : 'Log Activity'}
        </Button>
      </form>
    </Card>
  );
}
