import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Clock, 
  Shield, 
  Bell, 
  Database, 
  Check, 
  RotateCcw,
  Sliders,
  Building2,
  Globe
} from 'lucide-react';

const DEFAULT_SETTINGS = {
  companyName: 'Twite AI Technologies',
  companyDomain: 'twiteai.com',
  timezone: 'Asia/Kolkata (IST +5:30)',
  workHoursPerDay: '8.0',
  lateThresholdTime: '09:30',
  halfDayThresholdHours: '4.0',
  autoFlagLate: true,
  allowOvertime: true,
  compactTables: false,
  autoRefreshInterval: '30',
  notificationsEnabled: true
};

export default function SettingsView({ onNotify }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('twite_system_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('twite_system_settings', JSON.stringify(settings));
      setHasChanges(false);
      onNotify?.('System preferences and attendance policies saved successfully.', 'success');
    } catch (err) {
      onNotify?.('Failed to save system settings.', 'error');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all configurations to default values?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem('twite_system_settings');
      setHasChanges(false);
      onNotify?.('Settings reset to defaults.', 'success');
    }
  };

  return (
    <div className="settings-view">
      {/* Page Header */}
      <div className="toolbar" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            System Settings & Policies
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Configure enterprise attendance thresholds, shift rules, and workspace preferences.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleReset}
          >
            <RotateCcw size={16} />
            <span>Reset Defaults</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={!hasChanges}
            style={{ opacity: hasChanges ? 1 : 0.7 }}
          >
            <Save size={16} />
            <span>{hasChanges ? 'Save Changes' : 'Saved'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          
          {/* Section 1: Attendance Rules & Hours */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div className="stat-icon-wrapper indigo" style={{ width: '36px', height: '36px' }}>
                <Clock size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Shift & Time Parameters</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Define shift durations and tardiness cutoffs</span>
              </div>
            </div>

            <div className="form-group">
              <label>Standard Work Hours Per Day</label>
              <input 
                type="number" 
                step="0.5" 
                min="1" 
                max="24"
                className="form-control" 
                value={settings.workHoursPerDay}
                onChange={(e) => handleChange('workHoursPerDay', e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Base duration for full 100% daily attendance</span>
            </div>

            <div className="form-group">
              <label>Late Arrival Cutoff Time</label>
              <input 
                type="time" 
                className="form-control" 
                value={settings.lateThresholdTime}
                onChange={(e) => handleChange('lateThresholdTime', e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Check-in after this threshold is flagged 'Late'</span>
            </div>

            <div className="form-group">
              <label>Minimum Hours For Half-Day</label>
              <input 
                type="number" 
                step="0.5" 
                min="1" 
                max="12"
                className="form-control" 
                value={settings.halfDayThresholdHours}
                onChange={(e) => handleChange('halfDayThresholdHours', e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hours below this threshold convert to Absence</span>
            </div>
          </div>

          {/* Section 2: Policy Flags */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div className="stat-icon-wrapper emerald" style={{ width: '36px', height: '36px' }}>
                <Shield size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Policy Automation</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>System-enforced attendance rules</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settings.autoFlagLate}
                  onChange={(e) => handleChange('autoFlagLate', e.target.checked)}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Automatic Late Detection</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatically mark employee as 'Late' if arrival exceeds cutoff</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settings.allowOvertime}
                  onChange={(e) => handleChange('allowOvertime', e.target.checked)}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Track Excess / Overtime Hours</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculate and display hours accumulated past standard shift</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settings.notificationsEnabled}
                  onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>In-App Activity Toasts</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Show real-time alert notifications on attendance mutations</div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Organization Details */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div className="stat-icon-wrapper amber" style={{ width: '36px', height: '36px' }}>
                <Building2 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Enterprise Profile</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Organization identity metadata</span>
              </div>
            </div>

            <div className="form-group">
              <label>Organization Legal Entity</label>
              <input 
                type="text" 
                className="form-control" 
                value={settings.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Domain Identifier</label>
              <input 
                type="text" 
                className="form-control" 
                value={settings.companyDomain}
                onChange={(e) => handleChange('companyDomain', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Operational Timezone</label>
              <select 
                className="form-control" 
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
              >
                <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC (GMT +0:00)">UTC (GMT +0:00)</option>
                <option value="America/New_York (EST -5:00)">America/New_York (EST -5:00)</option>
                <option value="Europe/London (BST +1:00)">Europe/London (BST +1:00)</option>
                <option value="Asia/Singapore (SGT +8:00)">Asia/Singapore (SGT +8:00)</option>
              </select>
            </div>
          </div>

          {/* Section 4: Display & UI Preferences */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div className="stat-icon-wrapper rose" style={{ width: '36px', height: '36px' }}>
                <Sliders size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Display & Performance</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Interface personalization</span>
              </div>
            </div>

            <div className="form-group">
              <label>Dashboard Auto-Refresh Interval (Seconds)</label>
              <select 
                className="form-control" 
                value={settings.autoRefreshInterval}
                onChange={(e) => handleChange('autoRefreshInterval', e.target.value)}
              >
                <option value="0">Disabled (Manual Only)</option>
                <option value="15">Every 15 Seconds</option>
                <option value="30">Every 30 Seconds</option>
                <option value="60">Every 60 Seconds</option>
                <option value="300">Every 5 Minutes</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginTop: '1rem' }}>
              <input 
                type="checkbox" 
                checked={settings.compactTables}
                onChange={(e) => handleChange('compactTables', e.target.checked)}
                style={{ marginTop: '0.2rem', accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
              />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Compact Table Density</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Condense row padding to view more records per screen</div>
              </div>
            </label>
          </div>

        </div>

        {hasChanges && (
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
