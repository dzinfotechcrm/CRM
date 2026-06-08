import { useState, useEffect } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';

const PLAN_TYPES = [
  { key: 'monthly', label: 'Monthly Plan' },
  { key: 'annual', label: 'Annual Plan' },
];

// Only the editable fields — expense_total is auto-calculated
const EXPENSE_FIELDS = [
  { suffix: 'expense_technical', label: 'Technical Expense (₹)' },
  { suffix: 'expense_physical', label: 'Physical Expense (₹)' },
  { suffix: 'expense_misc', label: 'Misc Expense (₹)' },
];

export default function SubscriptionPlansSection({ settings, onSaved }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
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
    if (val !== '' && (isNaN(val) || Number(val) < 0)) return;
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: null }));
    setSuccess(false);
  };

  // Auto-calculate total expense = technical + physical + misc
  const getExpenseTotal = (type) => {
    const tech = parseFloat(values[`plan_${type}_expense_technical`]) || 0;
    const phys = parseFloat(values[`plan_${type}_expense_physical`]) || 0;
    const misc = parseFloat(values[`plan_${type}_expense_misc`]) || 0;
    return tech + phys + misc;
  };

  // Profit = price - total expense
  const getProfit = (type) => {
    const price = parseFloat(values[`plan_${type}_price`]) || 0;
    return price - getExpenseTotal(type);
  };

  const validate = () => {
    const errs = {};
    const warns = {};

    for (const plan of PLAN_TYPES) {
      const priceKey = `plan_${plan.key}_price`;
      const price = values[priceKey];
      const hasAnyExpense = EXPENSE_FIELDS.some((f) => {
        const v = values[`plan_${plan.key}_${f.suffix}`];
        return v !== '' && v !== null && v !== undefined;
      });
      const hasAny = (price !== '' && price !== null && price !== undefined) || hasAnyExpense;

      if (hasAny) {
        // Price must be filled
        if (price === '' || price === null || price === undefined) {
          errs[priceKey] = 'Plan Price is required';
        } else if (isNaN(price) || Number(price) < 0) {
          errs[priceKey] = 'Must be non-negative';
        }

        // Sub-expenses must be non-negative
        for (const f of EXPENSE_FIELDS) {
          const key = `plan_${plan.key}_${f.suffix}`;
          const val = values[key];
          if (val !== '' && val !== null && val !== undefined) {
            if (isNaN(val) || Number(val) < 0) {
              errs[key] = 'Must be non-negative';
            }
          }
        }

        // Negative profit warning
        const profit = getProfit(plan.key);
        if (profit < 0) {
          warns[plan.key] = `⚠️ ${plan.label} profit is negative (₹${profit.toFixed(0)})`;
        }
      }
    }

    setWarnings(warns);
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Auto-fill expense_total before saving
    const toSave = { ...values };
    for (const plan of PLAN_TYPES) {
      toSave[`plan_${plan.key}_expense_total`] = String(getExpenseTotal(plan.key));
    }

    setSaving(true);
    try {
      await api.put('/settings/saas_plans', { settings: toSave });
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
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Configure pricing and expense breakdown for each subscription plan.
        Total expense is automatically calculated from the three expense categories.
      </p>

      {PLAN_TYPES.map((plan) => {
        const expenseTotal = getExpenseTotal(plan.key);
        const profit = getProfit(plan.key);
        const perFounder = profit / 2;
        const priceKey = `plan_${plan.key}_price`;

        return (
          <div key={plan.key} className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-4">
            <h4 className="text-base font-semibold text-slate-200">{plan.label}</h4>

            {/* Price Input */}
            <div className="max-w-xs">
              <label htmlFor={priceKey} className="label-text">Plan Price (₹)</label>
              <input
                id={priceKey}
                type="number"
                min="0"
                step="1"
                value={values[priceKey] || ''}
                onChange={(e) => handleChange(priceKey, e.target.value)}
                className={`input-dark ${errors[priceKey] ? 'input-error' : ''}`}
                placeholder="0"
              />
              {errors[priceKey] && (
                <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> {errors[priceKey]}
                </p>
              )}
            </div>

            {/* Expense Breakdown */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Expense Breakdown</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {EXPENSE_FIELDS.map((field) => {
                  const key = `plan_${plan.key}_${field.suffix}`;
                  return (
                    <div key={key}>
                      <label htmlFor={key} className="label-text">{field.label}</label>
                      <input
                        id={key}
                        type="number"
                        min="0"
                        step="1"
                        value={values[key] || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={`input-dark ${errors[key] ? 'input-error' : ''}`}
                        placeholder="0"
                      />
                      {errors[key] && (
                        <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                          <AlertTriangle size={12} /> {errors[key]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Computed Summary */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
              <span className="text-slate-400">
                Total Expense: <span className="font-semibold text-slate-200">₹{expenseTotal.toFixed(0)}</span>
              </span>

              <span className="text-slate-700">|</span>

              <span className={`font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Profit: ₹{profit.toFixed(0)}
                {profit < 0 ? ' (NEGATIVE)' : ''}
              </span>

              <span className="text-slate-700">|</span>

              <span className="text-slate-500">
                Per Founder: <span className={`font-medium ${perFounder >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>₹{perFounder.toFixed(0)}</span>
              </span>
            </div>

            {/* Negative profit warning */}
            {warnings[plan.key] && (
              <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-fade-in">
                {warnings[plan.key]}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Plans'}
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
