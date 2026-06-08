import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { token } = useAuth();
  const [settings, setSettings] = useState({});         // grouped: { project_splits: [...], ... }
  const [settingsFlat, setSettingsFlat] = useState({});  // flat: { key: value, ... }
  const [incompleteGroups, setIncompleteGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!token) {
      setSettings({});
      setSettingsFlat({});
      setIncompleteGroups([]);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/settings');
      setSettings(data.settings || {});
      setIncompleteGroups(data.incompleteGroups || []);

      // Build flat map
      const flat = {};
      Object.values(data.settings || {}).forEach((group) => {
        group.forEach((s) => {
          flat[s.setting_key] = s.setting_value;
        });
      });
      setSettingsFlat(flat);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Refresh after a save — called by settings page
  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  const value = {
    settings,
    settingsFlat,
    incompleteGroups,
    loading,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

