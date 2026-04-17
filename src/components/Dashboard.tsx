import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiUpload, FiSearch, FiGrid, FiAward, FiCheckCircle, FiClock, FiXCircle, FiChevronRight } from "react-icons/fi";
import Activities from "./Activities";
import { credentialsService } from "../lib/credentialsService";
import { useUserRole } from "../hooks/useUserRole";

export default function Dashboard() {
  const navigate = useNavigate();
  const { canEditCredentials } = useUserRole();
  const [stats, setStats] = useState({ total: 0, active: 0, expiringSoon: 0, expired: 0 });

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const credentials = await credentialsService.getCredentials();
        const total = credentials.length;
        let active = 0, expiringSoon = 0, expired = 0;

        credentials.forEach((cred: { status: string; expiry_date?: string }) => {
          let computedStatus = cred.status;
          if (cred.expiry_date) {
            const daysUntilExpiry = Math.ceil(
              (new Date(cred.expiry_date).getTime() - Date.now()) / (1000 * 3600 * 24)
            );
            if (daysUntilExpiry < 0)       computedStatus = "Expired";
            else if (daysUntilExpiry <= 30) computedStatus = `Expires in ${daysUntilExpiry} days`;
            else                            computedStatus = "Active";
          }
          if (computedStatus === 'Active')               active++;
          else if (computedStatus === 'Expired')         expired++;
          else if (computedStatus.startsWith('Expires')) expiringSoon++;
        });

        setStats({ total, active, expiringSoon, expired });
      } catch {
        setStats({ total: 0, active: 0, expiringSoon: 0, expired: 0 });
      }
    };
    loadCredentials();
  }, []);

  const healthPct = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  const statCards = [
    {
      label: 'Total',        sub: 'All certificates',  value: stats.total,
      icon: FiAward,         iconBg: 'bg-white/10',    iconColor: 'text-white',
      valueColor: 'text-white',    accentBar: 'bg-white/30',
    },
    {
      label: 'Active',       sub: 'Valid & in use',    value: stats.active,
      icon: FiCheckCircle,   iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400',
      valueColor: 'text-emerald-400', accentBar: 'bg-emerald-400',
    },
    {
      label: 'Expiring Soon', sub: 'Within 30 days',  value: stats.expiringSoon,
      icon: FiClock,         iconBg: 'bg-amber-500/20', iconColor: 'text-amber-400',
      valueColor: 'text-amber-400', accentBar: 'bg-amber-400',
    },
    {
      label: 'Expired',      sub: 'Needs renewal',    value: stats.expired,
      icon: FiXCircle,       iconBg: 'bg-red-500/20',   iconColor: 'text-red-400',
      valueColor: 'text-red-400',  accentBar: 'bg-red-400',
    },
  ];

  const quickActions = [
    ...(canEditCredentials ? [
      {
        label: 'Add Certificate',  desc: 'New record with expiry dates',
        icon: FiPlus,   iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
        hoverBg: 'hover:bg-emerald-50', onClick: () => navigate('/dashboard/credentials/new'),
      },
      {
        label: 'Upload PDF',       desc: 'Attach licence documents',
        icon: FiUpload, iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',
        hoverBg: 'hover:bg-amber-50',   onClick: () => navigate('/dashboard/credentials'),
      },
    ] : []),
    {
      label: 'Find Certificate', desc: 'Search by name or type',
      icon: FiSearch, iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',
      hoverBg: 'hover:bg-blue-50',   onClick: () => navigate('/dashboard/credentials'),
    },
    {
      label: 'View All',         desc: 'Active, expiring & expired',
      icon: FiGrid,   iconBg: 'bg-purple-100',  iconColor: 'text-purple-600',
      hoverBg: 'hover:bg-purple-50', onClick: () => navigate('activities'),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── OVERVIEW CARD ── */}
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 60%, #111 100%)' }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-white font-bold text-base leading-tight">Dashboard Overview</h2>
            <p className="text-gray-400 text-xs mt-1">Track your certificate status at a glance</p>
          </div>

          {/* Health score — visible on all sizes */}
          {stats.total > 0 && (
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Health</p>
              <div className="flex items-center gap-2">
                <div className="w-16 sm:w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                    style={{ width: `${healthPct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-emerald-400">{healthPct}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-white/[0.06]">
          {statCards.map(({ label, sub, value, icon: Icon, iconBg, iconColor, valueColor, accentBar }, i) => (
            <div
              key={label}
              className={`relative px-4 py-4 sm:px-5 sm:py-5 hover:bg-white/[0.04] transition-colors
                ${i % 2 === 0 ? '' : 'border-l border-white/[0.06]'}
                ${i >= 2 ? 'border-t border-white/[0.06]' : ''}
                lg:border-l lg:border-t-0 lg:first:border-l-0
              `}
            >
              {/* Accent bar top */}
              <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-b-full ${accentBar} opacity-40`} />

              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                <div className={`w-7 h-7 rounded-lg grid place-items-center ${iconBg}`}>
                  <Icon size={13} className={iconColor} />
                </div>
              </div>
              <p className={`text-3xl font-black leading-none tracking-tighter ${valueColor}`}>{value}</p>
              <p className="text-[11px] text-gray-500 mt-1.5 font-medium">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Quick Actions</h3>
          <span className="text-xs text-gray-400 font-medium">{quickActions.length} actions</span>
        </div>

        {/* Mobile: list rows / Desktop: 2×2 grid */}
        <div className="sm:hidden divide-y divide-gray-50">
          {quickActions.map(({ label, desc, icon: Icon, iconBg, iconColor, hoverBg, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={`w-full flex items-center gap-4 px-5 py-3.5 ${hoverBg} transition-colors text-left`}
            >
              <div className={`w-10 h-10 rounded-xl ${iconBg} grid place-items-center shrink-0`}>
                <Icon size={17} className={iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <FiChevronRight size={15} className="text-gray-300 shrink-0" />
            </button>
          ))}
        </div>

        {/* Desktop 2×2 grid */}
        <div className="hidden sm:grid grid-cols-2 gap-3 p-4">
          {quickActions.map(({ label, desc, icon: Icon, iconBg, iconColor, hoverBg, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={`group flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-100 ${hoverBg} hover:border-transparent transition-all text-left`}
            >
              <div className={`w-9 h-9 rounded-lg ${iconBg} grid place-items-center`}>
                <Icon size={16} className={iconColor} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 leading-snug">{label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RECENT ACTIVITIES ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden pb-1">
        <Activities />
      </div>

    </div>
  );
}
