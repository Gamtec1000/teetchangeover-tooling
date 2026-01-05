// client/src/components/Settings.tsx
import React, { useState } from 'react';
import { deleteAllChangeoverLogs } from '../lib/supabase-service';

const Settings: React.FC = () => {
    const [loading, setLoading] = useState(false);

    const handleResetLogs = async () => {
        if (window.confirm("WARNING: This will permanently delete ALL changeover logs. This action cannot be undone. Are you sure?")) {
            setLoading(true);
            try {
                await deleteAllChangeoverLogs();
                alert("All changeover logs have been successfully deleted.");
            } catch (error) {
                console.error("Error deleting logs:", error);
                alert("Failed to delete logs. Check console for details.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="settings-page" style={{ color: 'var(--text-color)' }}>
            <h2 style={{ color: 'var(--text-color)' }}>Settings</h2>
            
            <div className="card-section" style={{ padding: '2rem', marginTop: '2rem', border: '1px solid #ef4444', backgroundColor: 'var(--white)', borderRadius: '8px' }}>
                <h3 style={{ color: '#ef4444', marginTop: 0 }}>Danger Zone</h3>
                <p style={{ color: 'var(--text-color)' }}>These actions are destructive and cannot be reversed.</p>
                
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <div>
                        <strong style={{ color: 'var(--text-color)' }}>Reset Recent Changeover Logs</strong>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>Permanently delete the entire history of changeover logs.</p>
                    </div>
                    <button 
                        onClick={handleResetLogs} 
                        disabled={loading}
                        style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        {loading ? 'Deleting...' : 'Reset Logs'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
