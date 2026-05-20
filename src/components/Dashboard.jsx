import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { buildSlackMessage, buildConsolidatedSlackMessage } from '../lib/slack';
import { sendToSlack, sendImageToSlack } from '../lib/api';

export default function Dashboard({ submissions = [] }) {
  const [loading, setLoading] = useState(false);
  const [imageSending, setImageSending] = useState(false);
  const { showToast } = useToast();

  // Calculate stats
  const stats = {
    totalReviews: submissions.filter(s => s.type === 'Review').length,
    totalReferences: submissions.filter(s => s.type === 'Reference').length,
    totalStories: submissions.filter(s => s.type === 'Story').length,
  };

  const progress = {
    reviews: { current: stats.totalReviews, target: 50 },
    references: { current: stats.totalReferences, target: 13 },
    stories: { current: stats.totalStories, target: 13 },
  };

  // Send team progress as text to Slack
  const sendTeamProgressText = async () => {
    setLoading(true);
    try {
      const message = buildSlackMessage(submissions);
      await sendToSlack(message);
      showToast('✅ Team Progress sent to Slack!', 'success');
    } catch (error) {
      console.error('Error:', error);
      showToast('❌ Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Send CSM snapshot as text to Slack
  const sendCSMSnapshotText = async () => {
    setLoading(true);
    try {
      const message = buildConsolidatedSlackMessage(submissions);
      await sendToSlack(message);
      showToast('✅ CSM Snapshot sent to Slack!', 'success');
    } catch (error) {
      console.error('Error:', error);
      showToast('❌ Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Send team progress as image to Slack
  const sendTeamProgressImage = async () => {
    setImageSending(true);
    try {
      const dashboardElement = document.getElementById('dashboard-content');
      
      if (!dashboardElement) {
        throw new Error('Dashboard element not found');
      }

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(dashboardElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        try {
          const formData = new FormData();
          formData.append('image', blob, 'team-progress.png');
          formData.append('title', '📊 Team Progress - Snapshot');

          await sendImageToSlack(formData);
          showToast('✅ Team Progress image sent to Slack!', 'success');
        } catch (error) {
          console.error('Error:', error);
          showToast('❌ Failed to send image', 'error');
        } finally {
          setImageSending(false);
        }
      });

    } catch (error) {
      console.error('Error:', error);
      showToast('❌ Failed to capture image', 'error');
      setImageSending(false);
    }
  };

  // Send CSM snapshot as image to Slack
  const sendCSMSnapshotImage = async () => {
    setImageSending(true);
    try {
      const csmElement = document.getElementById('csm-snapshot-content');
      
      if (!csmElement) {
        throw new Error('CSM Snapshot element not found');
      }

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(csmElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        try {
          const formData = new FormData();
          formData.append('image', blob, 'csm-snapshot.png');
          formData.append('title', '📋 CSM Snapshot - Snapshot');

          await sendImageToSlack(formData);
          showToast('✅ CSM Snapshot image sent to Slack!', 'success');
        } catch (error) {
          console.error('Error:', error);
          showToast('❌ Failed to send image', 'error');
        } finally {
          setImageSending(false);
        }
      });

    } catch (error) {
      console.error('Error:', error);
      showToast('❌ Failed to capture image', 'error');
      setImageSending(false);
    }
  };

  return (
    <div className="container">
      {/* TEAM PROGRESS SECTION */}
      <section style={{ marginBottom: '40px', background: 'white', padding: '20px', borderRadius: '8px' }}>
        <div className="section-header">
          <h2>📊 Team Progress</h2>
          <div className="button-group">
            <button 
              onClick={sendTeamProgressText}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '💬 Sending...' : '💬 Send to Slack | Team Progress'}
            </button>
            <button 
              onClick={sendTeamProgressImage}
              disabled={imageSending}
              className="btn btn-secondary"
            >
              {imageSending ? '📸 Sending...' : '📸 Send as Image'}
            </button>
          </div>
        </div>

        <div id="dashboard-content">
          <div style={{ marginTop: '20px' }}>
            {Object.entries(progress).map(([key, { current, target }]) => (
              <div key={key} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>
                    {key === 'reviews' ? '📝 Reviews' : key === 'references' ? '📋 References' : '📖 Stories'}
                  </span>
                  <span>{current} / {target}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(current / target) * 100}%` }}
                  />
                </div>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  {Math.round((current / target) * 100)}% Complete
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CSM SNAPSHOT SECTION */}
      <section style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <div className="section-header">
          <h2>🏆 CSM Snapshot</h2>
          <div className="button-group">
            <button 
              onClick={sendCSMSnapshotText}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '📋 Sending...' : '📋 Send to Slack | CSM Snapshot'}
            </button>
            <button 
              onClick={sendCSMSnapshotImage}
              disabled={imageSending}
              className="btn btn-secondary"
            >
              {imageSending ? '📸 Sending...' : '📸 Send as Image'}
            </button>
          </div>
        </div>

        <div id="csm-snapshot-content">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Reviews</th>
                <th>References</th>
                <th>Stories</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length > 0 ? (
                submissions.map((submission, idx) => (
                  <tr key={idx}>
                    <td>{submission.csm || 'Unknown'}</td>
                    <td>{submission.type === 'Review' ? '✓' : ''}</td>
                    <td>{submission.type === 'Reference' ? '✓' : ''}</td>
                    <td>{submission.type === 'Story' ? '✓' : ''}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af' }}>
                    No submissions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
