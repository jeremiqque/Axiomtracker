import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiUpload, FiSearch, FiGrid, FiAward, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
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
        let active = 0;
        let expiringSoon = 0;
        let expired = 0;

        credentials.forEach((cred: { status: string; expiry_date?: string }) => {
          let computedStatus = cred.status;
          if (cred.expiry_date) {
            const expiryDate = new Date(cred.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

            if (daysUntilExpiry < 0) {
              computedStatus = "Expired";
            } else if (daysUntilExpiry <= 30) {
              computedStatus = `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`;
            } else {
              computedStatus = "Active";
            }
          }

          if (computedStatus === 'Active') {
            active++;
          } else if (computedStatus === 'Expired') {
            expired++;
          } else if (computedStatus.startsWith('Expires in')) {
            expiringSoon++;
          }
        });

        setStats({ total, active, expiringSoon, expired });
      } catch (error) {
        console.error('Error loading credentials for dashboard:', error);
        setStats({ total: 0, active: 0, expiringSoon: 0, expired: 0 });
      }
    };

    loadCredentials();
  }, []);
  return (
    <div className="space-y-10 bg-white">

      {/* DASHBOARD OVERVIEW */}
      <div className="w-full rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #111 100%)' }}>
        {/* Banner header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-white font-semibold text-base">Dashboard Overview</h2>
            <p className="text-gray-400 text-xs mt-0.5">Track your certificate status at a glance</p>
          </div>
          {stats.total > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-gray-400 mb-1">Health score</p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                    style={{ width: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-emerald-400">
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border-t border-white/5">
          {[
            {
              label: 'Total',
              sub: 'All certificates',
              value: stats.total,
              icon: FiAward,
              iconBg: 'bg-white/10',
              iconColor: 'text-white',
              valueColor: 'text-white',
            },
            {
              label: 'Active',
              sub: 'Valid & in use',
              value: stats.active,
              icon: FiCheckCircle,
              iconBg: 'bg-emerald-500/15',
              iconColor: 'text-emerald-400',
              valueColor: 'text-emerald-400',
            },
            {
              label: 'Expiring Soon',
              sub: 'Within 30 days',
              value: stats.expiringSoon,
              icon: FiClock,
              iconBg: 'bg-amber-500/15',
              iconColor: 'text-amber-400',
              valueColor: 'text-amber-400',
            },
            {
              label: 'Expired',
              sub: 'Needs renewal',
              value: stats.expired,
              icon: FiXCircle,
              iconBg: 'bg-red-500/15',
              iconColor: 'text-red-400',
              valueColor: 'text-red-400',
            },
          ].map(({ label, sub, value, icon: Icon, iconBg, iconColor, valueColor }) => (
            <div key={label} className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors px-5 py-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-300 font-medium">{label}</p>
                <div className={`w-7 h-7 rounded-lg grid place-items-center ${iconBg}`}>
                  <Icon size={13} className={iconColor} />
                </div>
              </div>
              <div>
                <p className={`text-3xl font-bold leading-none tracking-tight ${valueColor}`}>{value}</p>
                <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT ACTIVITIES + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* RECENT ACTIVITIES */}
          <div className="bg-white rounded-xl p-4 sm:p-6 col-span-1 lg:col-span-2 border border-gray-200 flex flex-col">
            <Activities />
          </div>

        {/* QUICK ACTIONS */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <h3 className="font-semibold text-sm sm:text-base mb-4 text-gray-900">Quick Actions</h3>

          <div className="grid grid-cols-2 gap-3">

            {canEditCredentials && (
              <button
                onClick={() => navigate('/dashboard/credentials/new')}
                className="group flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-200 text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 grid place-items-center group-hover:bg-emerald-200 transition-colors">
                  <FiPlus size={17} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 leading-snug">Add Certificate</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">New record with expiry dates</p>
                </div>
              </button>
            )}

            {canEditCredentials && (
              <button
                onClick={() => navigate('/dashboard/credentials')}
                className="group flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50 transition-all duration-200 text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-100 grid place-items-center group-hover:bg-amber-200 transition-colors">
                  <FiUpload size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 leading-snug">Upload PDF</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">Attach license documents</p>
                </div>
              </button>
            )}

            <button
              onClick={() => navigate('/dashboard/credentials')}
              className="group flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 grid place-items-center group-hover:bg-blue-200 transition-colors">
                <FiSearch size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-snug">Find Certificate</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">Search by name or type</p>
              </div>
            </button>

            <button
              onClick={() => navigate('activities')}
              className="group flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all duration-200 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-100 grid place-items-center group-hover:bg-purple-200 transition-colors">
                <FiGrid size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-snug">View All</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">Active, expiring & expired</p>
              </div>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}