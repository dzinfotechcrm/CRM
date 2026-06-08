import { useState, useEffect } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';

export default function ProjectSplitSection({ settings, onSaved }) {
  const [values, setValues] = useState({
    project_split_reserve_pct: '',
    project_split_profit_pct: '',
    project_split_dues_pct: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load current values from settings
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
    // Reject non-numeric and negative
    if (val !== '' && (isNaN(val) || Number(val) < 0)) return;
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: null, sum: null }));
    setSuccess(false);
  };

  const sum = ['project_split_reserve_pct', 'project_split_profit_pct', 'project_split_dues_pct']
    .reduce((acc, k) => acc + (parseFloat(values[k]) || 0), 0);

  const validate = () => {
    const errs = {};
    const keys = ['project_split_reserve_pct', 'project_split_profit_pct', 'project_split_dues_pct'];
    const labels = ['Reserve %', 'Profit %', 'Dues %'];

    keys.forEach((k, i) => {
      if (values[k] === '' || values[k] === null) {
        errs[k] = `${labels[i]} is required`;
      } else if (isNaN(values[k]) || Number(values[k]) < 0) {
        errs[k] = `${labels[i]} must be non-negative`;
      }
    });

    if (Object.keys(errs).length === 0 && Math.abs(sum - 100) > 0.01) {
      errs.sum = `Percentages must sum to 100% (currently ${sum.toFixed(1)}%)`;
    }

    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await api.put('/settings/project_splits', { settings: values });
      setSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const errs = {};
        serverErrors.forEach((e) => { errs[e.field] = e.message; });
        setErrors(errs);
      } else {
        setErrors({ sum: 'Failed to save. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const sumColor = Math.abs(sum - 100) < 0.01
    ? 'text-emerald-400'
    : sum > 100
      ? 'text-rose-400'
      : 'text-amber-400';

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Define how project revenue is split across reserve, profit, and dues.
        The three values must total exactly 100%.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { key: 'project_split_reserve_pct', label: 'Reserve %' },
          { key: 'project_split_profit_pct', label: 'Profit %' },
          { key: 'project_split_dues_pct', label: 'Dues %' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label htmlFor={key} className="label-text">{label}</label>
            <div className="relative">
              <input
                id={key}
                type="number"
                min="0"
                step="0.1"
                value={values[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className={`input-dark pr-8 ${errors[key] ? 'input-error' : ''}`}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
            </div>
            {errors[key] && (
              <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> {errors[key]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Live sum display */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <span className="text-sm text-slate-400">Total</span>
        <span className={`text-lg font-bold ${sumColor} transition-colors`}>
          {sum.toFixed(1)}%
          {Math.abs(sum - 100) < 0.01 && <Check size={16} className="inline ml-1.5 text-emerald-400" />}
        </span>
      </div>

      {errors.sum && (
        <p className="text-rose-400 text-sm flex items-center gap-1.5">
          <AlertTriangle size={14} /> {errors.sum}
        </p>
      )}

      {/* Save button + success */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Splits'}
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
