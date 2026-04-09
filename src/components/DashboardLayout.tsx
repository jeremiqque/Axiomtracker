import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { FiBell, FiMenu, FiChevronDown, FiLogOut, FiGrid, FiAward, FiUsers, FiUserPlus, FiSettings, FiAlertCircle } from "react-icons/fi";
import subtract from "../assets/subtract.png";
import supabase from "../lib/supabase";
import { employeesService } from "../lib/supabaseService";
import { useUserRole } from "../hooks/useUserRole";

interface AppNotification {
  id: string | number;
  message: string;
  is_read: boolean;
  created_at: string;
  days_until_expiry?: number;
  credential_name?: string;
  source: 'db' | 'credential'; // db = notifications table, credential = live from credentials
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<string>('Loading...');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [markingRead, setMarkingRead] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { canEdit } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch current user + role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const employee = await employeesService.getCurrentUserEmployee();
        setUserRole(employee?.role || 'User');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('User');
      }
    };
    fetchUserRole();
  }, []);

  // Fetch notifications — live from credentials + optional notifications table
  const fetchNotifications = async () => {
    const merged: AppNotification[] = [];

    // 1. Live credential alerts (always reliable)
    try {
      const { data: creds } = await supabase
        .from('credentials')
        .select('id, name, entity, expiry_date, status')
        .order('expiry_date', { ascending: true });

      if (creds) {
        for (const c of creds) {
          if (!c.expiry_date) continue;
          const days = daysUntil(c.expiry_date);
          if (days > 30) continue; // only ≤30 days or expired

          const label = c.name || 'Certificate';
          const entity = c.entity ? ` (${c.entity})` : '';
          const message =
            days <= 0
              ? `${label}${entity} has expired`
              : `${label}${entity} expires in ${days} day${days === 1 ? '' : 's'}`;

          merged.push({
            id: `cred-${c.id}`,
            message,
            is_read: false,
            created_at: new Date().toISOString(),
            days_until_expiry: days,
            credential_name: label,
            source: 'credential',
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch credential alerts:', err);
    }

    // 2. Notifications table (email log / manual triggers)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (data) {
          for (const n of data as AppNotification[]) {
            // Skip if we already have a live credential alert for this credential
            const alreadyCovered = merged.some(
              m => m.credential_name && n.credential_name &&
                   m.credential_name === n.credential_name && m.source === 'credential'
            );
            if (!alreadyCovered) {
              merged.push({ ...n, source: 'db' });
            }
          }
        }
      }
    } catch {
      // notifications table may not exist yet — that's fine
    }

    // Sort: most urgent (fewest days) first
    merged.sort((a, b) => {
      const da = a.days_until_expiry ?? 9999;
      const db = b.days_until_expiry ?? 9999;
      return da - db;
    });

    setNotifications(merged);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark all unread as read
  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (!unread.length) return;
    setMarkingRead(true);
    try {
      // Mark DB-sourced notifications read in Supabase
      const dbUnread = unread.filter(n => n.source === 'db');
      if (dbUnread.length) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
        }
      }
      // Mark credential-sourced alerts read in local state only
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    } finally {
      setMarkingRead(false);
    }
  };

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <section className="w-full flex h-screen overflow-hidden">

      {/* LOGOUT CONFIRM MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-red-50 grid place-items-center mb-4">
              <FiLogOut size={20} className="text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Sign out?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                disabled={isLoggingOut}
                onClick={async () => {
                  setIsLoggingOut(true);
                  await supabase.auth.signOut();
                  localStorage.removeItem('user');
                  navigate('/login');
                }}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing out…
                  </>
                ) : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col h-screen border-r border-gray-100 bg-white px-3 py-6 transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <div className="w-8 h-8 bg-black rounded-lg grid place-items-center shrink-0">
            <img src={subtract} alt="logo" className="w-4 h-4 invert" />
          </div>
          <span className="font-bold text-sm text-gray-900 tracking-tight">Axiom Tracker</span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 space-y-0.5">
          {[
            { to: '/dashboard',             label: 'Dashboard',       icon: FiGrid,     exact: true  },
            { to: '/dashboard/credentials', label: 'Credentials',     icon: FiAward,    exact: false },
            { to: '/dashboard/entity',      label: 'Entity',          icon: FiUsers,    exact: false },
            ...(canEdit ? [{ to: '/dashboard/invite', label: 'Invite Employee', icon: FiUserPlus, exact: false }] : []),
          ].map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={toggleSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative
                  ${active
                    ? 'bg-gray-950 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <Icon size={16} className={active ? 'text-white' : 'text-gray-400 group-hover:text-gray-700'} />
                {label}
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full opacity-40" />}
              </Link>
            );
          })}
        </nav>

        {/* Settings pinned at bottom */}
        <div className="pt-4 border-t border-gray-100 mt-4">
          <Link
            to="/dashboard/settings"
            onClick={toggleSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
              ${location.pathname.includes('/settings')
                ? 'bg-gray-950 text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <FiSettings size={16} className={location.pathname.includes('/settings') ? 'text-white' : 'text-gray-400 group-hover:text-gray-700'} />
            Settings
          </Link>
        </div>
      </aside>

      {/* RIGHT SECTION */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">

        {/* TOPBAR */}
        {(() => {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const userInitial = user.email ? user.email[0].toUpperCase() : 'U';
          const userEmail = user.email || 'user@example.com';

          const pageMap: Record<string, { title: string; subtitle: string }> = {
            credentials: { title: 'Credentials',        subtitle: 'Manage certificates & licenses'   },
            entity:      { title: 'Employee Management', subtitle: 'Manage your team members'          },
            activities:  { title: 'Notifications',       subtitle: 'Recent alerts and updates'         },
            invite:      { title: 'Invite Employee',     subtitle: 'Add new members to your workspace' },
            settings:    { title: 'Settings',            subtitle: 'Manage your account preferences'   },
          };
          const matched = Object.entries(pageMap).find(([key]) => location.pathname.includes(`/${key}`));
          const page = matched ? matched[1] : { title: 'Dashboard', subtitle: 'Welcome back' };

          return (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-white">

              {/* Left — mobile menu + page identity */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSidebar}
                  className="md:hidden w-8 h-8 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-500 transition-colors"
                >
                  <FiMenu size={18} />
                </button>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900 leading-tight">{page.title}</h1>
                  <p className="text-xs text-gray-400 hidden sm:block">{page.subtitle}</p>
                </div>
              </div>

              {/* Right — actions + user */}
              <div className="flex items-center gap-1.5">

                {/* Bell + Notification Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setIsNotifOpen(p => !p); if (!isNotifOpen) fetchNotifications(); }}
                    className={`relative w-9 h-9 rounded-lg grid place-items-center transition-colors ${
                      isNotifOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <FiBell size={17} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Panel */}
                  {isNotifOpen && (
                    <div className="absolute top-full mt-2 right-0 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">{unreadCount}</span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            disabled={markingRead}
                            className="text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
                          >
                            {markingRead ? 'Marking…' : 'Mark all read'}
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 grid place-items-center mb-3">
                              <FiBell size={16} className="text-gray-300" />
                            </div>
                            <p className="text-xs font-medium text-gray-400">No notifications yet</p>
                            <p className="text-[11px] text-gray-300 mt-0.5">You'll be notified before certificates expire</p>
                          </div>
                        ) : (
                          notifications.map(n => {
                            const days = n.days_until_expiry;
                            const isUrgent = days !== undefined && days <= 7;
                            const isWarning = days !== undefined && days > 7 && days <= 14;
                            const iconColor = isUrgent ? 'text-red-500 bg-red-50' : isWarning ? 'text-amber-500 bg-amber-50' : 'text-blue-500 bg-blue-50';
                            return (
                              <div key={n.id} className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                                <div className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 mt-0.5 ${iconColor}`}>
                                  <FiAlertCircle size={13} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-800 leading-snug">
                                    {n.message || (n.credential_name ? `${n.credential_name} is expiring soon` : 'Certificate expiring soon')}
                                  </p>
                                  {days !== undefined && (
                                    <p className={`text-[11px] font-semibold mt-0.5 ${isUrgent ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-blue-500'}`}>
                                      {days <= 0 ? 'Expired' : `${days} days remaining`}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                                </div>
                                {!n.is_read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-gray-100">
                          <button
                            onClick={() => { setIsNotifOpen(false); navigate('/dashboard/activities'); }}
                            className="w-full text-center text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            View all activity →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* User button */}
                <div className="relative">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center gap-2.5 pl-1 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 bg-gray-900 text-white rounded-full grid place-items-center font-semibold text-xs shrink-0">
                      {userInitial}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-gray-800 leading-tight max-w-[120px] truncate">{userEmail}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        <span className="text-[10px] text-gray-400">{userRole}</span>
                      </div>
                    </div>
                    <FiChevronDown
                      size={13}
                      className={`text-gray-400 transition-transform duration-200 hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl w-64 z-50 overflow-hidden">
                      {/* User header */}
                      <div className="px-4 py-4 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-900 text-white rounded-full grid place-items-center font-semibold shrink-0">
                            {userInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{userEmail}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-xs text-gray-400">{userRole}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-2">
                        <button
                          onClick={() => { setIsDropdownOpen(false); navigate('/dashboard/settings'); }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          <FiSettings size={14} className="text-gray-400" />
                          Account Settings
                        </button>
                        <div className="border-t border-gray-100 my-1.5" />
                        <button
                          className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          onClick={() => { setIsDropdownOpen(false); setShowLogoutConfirm(true); }}
                        >
                          <FiLogOut size={14} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="flex-1 overflow-y-auto scrollbar-none">
          <div className="p-6 md:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </section>
  );
}