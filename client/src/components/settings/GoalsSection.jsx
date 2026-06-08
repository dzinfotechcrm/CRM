import { useState, useEffect } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';

const GOAL_FIELDS = [
  { key: 'goal_monthly_revenue_target', label: 'Monthly Revenue Target (₹)', type: 'currency' },
  { key: 'goal_monthly_revenue_deadline', label: 'Monthly Revenue Deadline', type: 'date' },
  { key: 'goal_reserve_target', label: 'Reserve Fund Target (₹)', type: 'currency' },
  { key: 'goal_dues_target', label: 'Dues Clearance Target (₹)', type: 'currency' },
  { key: 'goal_founder_profit_monthly', label: 'Monthly Founder Profit Target (₹)', type: 'currency' },
];

export default function GoalsSection({ settings, onSaved }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
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

  const handleChange = (key, val, type) => {
    if (type === 'currency' && val !== '' && (isNaN(val) || Number(val) < 0)) return;
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: null }));
    setSuccess(false);
  };

  const validate = () => {
    const errs = {};
    GOAL_FIELDS.forEach((f) => {
      const val = values[f.key];
      if (f.type === 'currency' && val !== '' && val !== undefined) {
        if (isNaN(val) || Number(val) < 0) {
          errs[f.key] = 'Must be a non-negative number';
        }
      }
      if (f.type === 'date' && val && isNaN(Date.parse(val))) {
        errs[f.key] = 'Must be a valid date';
      }
    });
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await api.put('/settings/goals', { settings: values });
      setSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const errs = {};
        serverErrors.forEach((e) => { errs[e.field] = e.message; });
        setErrors(errs);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Set your business targets. These drive the progress bars on the Dashboard and Goals screens.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GOAL_FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={field.key} className="label-text">{field.label}</label>
            <input
              id={field.key}
              type={field.type === 'date' ? 'date' : 'number'}
              min={field.type === 'currency' ? '0' : undefined}
              step={field.type === 'currency' ? '1' : undefined}
              value={values[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value, field.type)}
              className={`input-dark ${errors[field.key] ? 'input-error' : ''}`}
              placeholder={field.type === 'currency' ? '0' : ''}
            />
            {errors[field.key] && (
              <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> {errors[field.key]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Goals'}
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
