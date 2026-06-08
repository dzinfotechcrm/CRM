import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import api from '../../utils/api';

export default function FoundersSection({ settings, onSaved }) {
  const [values, setValues] = useState({
    founder1_name: '',
    founder2_name: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (settings && settings.length > 0) {
      const map = {};
      settings.forEach((s) => {
        map[s.setting_key] = s.setting_value || '';
      });
      setValues((prev) => ({ ...prev, ...map }));
    }
  }, [settings]);

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/founders', { settings: values });
      setSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save founders:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Set founder names. These are used to label profit splits across the application.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="founder1_name" className="label-text">Founder 1 Name</label>
          <input
            id="founder1_name"
            type="text"
            value={values.founder1_name}
            onChange={(e) => handleChange('founder1_name', e.target.value)}
            className="input-dark"
            placeholder="e.g. Rahul"
          />
        </div>
        <div>
          <label htmlFor="founder2_name" className="label-text">Founder 2 Name</label>
          <input
            id="founder2_name"
            type="text"
            value={values.founder2_name}
            onChange={(e) => handleChange('founder2_name', e.target.value)}
            className="input-dark"
            placeholder="e.g. Amit"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Names'}
        </button>
        {success && (
          <span className="text-emerald-400 text-sm flex items-center gap-1 animate-fade-in">
            <Check size={16} /> Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
