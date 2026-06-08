import { useState } from 'react';
import { ChevronDown, ChevronRight, Settings, CreditCard, Target, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import ProjectSplitSection from '../components/settings/ProjectSplitSection';
import SubscriptionPlansSection from '../components/settings/SubscriptionPlansSection';
import GoalsSection from '../components/settings/GoalsSection';
import FoundersSection from '../components/settings/FoundersSection';

const SECTIONS = [
  {
    id: 'project_splits',
    title: 'Project Split Rules',
    subtitle: 'Revenue allocation percentages',
    icon: Settings,
    color: 'from-blue-500 to-cyan-400',
    Component: ProjectSplitSection,
  },
  {
    id: 'saas_plans',
    title: 'Subscription Plans',
    subtitle: 'Plan pricing & expense breakdown',
    icon: CreditCard,
    color: 'from-violet-500 to-purple-400',
    Component: SubscriptionPlansSection,
  },
  {
    id: 'goals',
    title: 'Goals',
    subtitle: 'Revenue & profit targets',
    icon: Target,
    color: 'from-emerald-500 to-teal-400',
    Component: GoalsSection,
  },
  {
    id: 'founders',
    title: 'Founders',
    subtitle: 'Founder names for profit labels',
    icon: Users,
    color: 'from-amber-500 to-orange-400',
    Component: FoundersSection,
  },
];

export default function SettingsPage() {
  const { settings, incompleteGroups, refreshSettings } = useSettings();
  const [openSections, setOpenSections] = useState({ project_splits: true });

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isGroupComplete = (groupId) => {
    return !incompleteGroups.some((g) => g.group === groupId);
  };

  const getGroupStatus = (groupId) => {
    const group = incompleteGroups.find((g) => g.group === groupId);
    if (!group) return null; // complete
    return `${group.filled}/${group.total} configured`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure all business rules. Every number in the CRM reads from here — nothing is hardcoded.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = openSections[section.id] || false;
          const complete = isGroupComplete(section.id);
          const status = getGroupStatus(section.id);

          return (
            <div key={section.id} className="glass-card overflow-hidden">
              {/* Section header — toggles collapse */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-800/30 transition-colors"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Icon size={20} className="text-white" />
                </div>

                {/* Title + subtitle */}
                <div className="flex-1 min-w-0">
                  <h3 className="section-title">{section.title}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">{section.subtitle}</p>
                </div>

                {/* Status badge */}
                {complete ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={12} /> Complete
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    <AlertCircle size={12} /> {status}
                  </span>
                )}

                {/* Chevron */}
                <div className="text-slate-500 flex-shrink-0">
                  {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>

              {/* Section content — collapsible */}
              {isOpen && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-700/30 animate-slide-down">
                  <section.Component
                    settings={settings[section.id] || []}
                    onSaved={refreshSettings}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
