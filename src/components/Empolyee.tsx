import { useState } from "react";
import { useNavigate } from "react-router-dom";
import privateImg from "../assets/private.png";
import subtract from "../assets/subtract.png";
import { useUserRole } from "../hooks/useUserRole";
import { FiMail, FiPlus, FiX, FiArrowLeft, FiSend, FiShield, FiBell, FiUsers, FiCheckCircle, FiAlertCircle, FiLogOut } from "react-icons/fi";
import supabase from "../lib/supabase";

export default function InviteEmployees() {
  const navigate = useNavigate();
  const { canEdit, loading: roleLoading } = useUserRole();
  const [emails, setEmails] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex items-center gap-3 text-gray-400">
          <span className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
        <div className="w-14 h-14 rounded-2xl bg-red-50 grid place-items-center mb-1">
          <FiShield size={24} className="text-red-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Access Denied</h2>
        <p className="text-sm text-gray-400">You don't have permission to invite employees.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleSignOutAndLeave = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleStaySignedIn = () => {
    setShowBackConfirm(false);
    navigate('/');
  };

  const addEmailField = () => setEmails(prev => [...prev, ""]);

  const removeEmailField = (index: number) => {
    if (emails.length > 1) setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const next = [...emails];
    next[index] = value;
    setEmails(next);
  };

  const sendInvitations = async () => {
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const filteredEmails = emails.filter(e => e.trim());
      if (filteredEmails.length === 0) {
        setMessage("Please enter at least one email address.");
        return;
      }

      const response = await fetch('http://localhost:3001/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: filteredEmails }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setMessage(data.message || `Invitation${filteredEmails.length > 1 ? 's' : ''} sent successfully!`);
        setEmails([""]);
      } else {
        setIsSuccess(false);
        setMessage(data.error || "Failed to send invitations.");
      }
    } catch {
      setIsSuccess(false);
      setMessage("Failed to send invitations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full -m-6 md:-m-8">

      {/* ── Back Confirm Modal ─────────────────────────────────── */}
      {showBackConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isSigningOut && setShowBackConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 grid place-items-center mb-4">
              <FiLogOut size={20} className="text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Leave this page?</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Would you like to sign out of your account before going back to the website?
            </p>
            <div className="flex flex-col gap-2.5 w-full">
              <button
                disabled={isSigningOut}
                onClick={handleSignOutAndLeave}
                className="w-full py-2.5 text-sm font-semibold bg-gray-950 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isSigningOut ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing out…
                  </>
                ) : (
                  <>
                    <FiLogOut size={13} />
                    Sign out & go to website
                  </>
                )}
              </button>
              <button
                disabled={isSigningOut}
                onClick={handleStaySignedIn}
                className="w-full py-2.5 text-sm font-medium border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Stay signed in & leave
              </button>
              <button
                disabled={isSigningOut}
                onClick={() => setShowBackConfirm(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1 disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Left Panel ─────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[45%] flex-col overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${privateImg})` }} />
        <div className="absolute inset-0 bg-black/65" />

        {/* Content */}
        <div className="relative flex flex-col justify-between h-full px-12 py-10 text-white">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/10 border border-white/15 rounded-lg grid place-items-center">
                <img src={subtract} alt="logo" className="w-4 h-4 invert" />
              </div>
              <span className="text-sm font-semibold text-white/90">Axiom Tracker</span>
            </div>
            <button
              onClick={() => setShowBackConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
            >
              <FiArrowLeft size={12} />
              Back to Website
            </button>
          </div>

          {/* Feature list */}
          <div>
            {[
              { icon: FiBell,   title: 'Smart Reminders',   desc: 'Alerts at 30, 14 & 7 days before expiry.' },
              { icon: FiUsers,  title: 'Team Management',   desc: 'Manage your whole team from one place.'    },
              { icon: FiShield, title: 'Role-based Access', desc: 'Admin, Employee, or Viewer — your choice.' },
            ].map(({ icon: Icon, title, desc }, i, arr) => (
              <div key={title}>
                <div className="flex items-center gap-4 py-5">
                  <div className="w-10 h-10 rounded-2xl bg-white/6 border border-white/10 grid place-items-center shrink-0">
                    <Icon size={16} className="text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{title}</p>
                    <p className="text-xs text-white/35 mt-0.5">{desc}</p>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="h-px bg-white/6" />}
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div>
            <div className="flex items-center gap-2 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span className="text-xs font-medium text-white/40 tracking-wide">Trusted by 500+ teams</span>
            </div>
            <h1 className="text-[2.6rem] font-bold leading-[1.1] tracking-tight">
              Never miss a<br />
              <span className="text-white/30">credential</span><br />
              deadline again.
            </h1>
          </div>

        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col overflow-y-auto scrollbar-none">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-lg grid place-items-center">
              <img src={subtract} alt="logo" className="w-3.5 h-3.5 invert" />
            </div>
            <span className="text-sm font-bold text-gray-900">Axiom Tracker</span>
          </div>
          <button
            onClick={() => setShowBackConfirm(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <FiArrowLeft size={12} /> Back
          </button>
        </div>

        {/* Form area — centered */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gray-950 rounded-2xl grid place-items-center mx-auto mb-4">
                <FiUsers size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Invite Employees</h2>
              <p className="text-sm text-gray-400 mt-1">
                Send invitations to your team members
              </p>
            </div>

            {/* Email fields */}
            <div className="space-y-3 mb-4">
              {emails.map((email, index) => (
                <div key={index} className="group">
                  {emails.length > 1 && (
                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                      Employee {index + 1}
                    </label>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900/10 transition-all">
                      <FiMail size={14} className="text-gray-400 shrink-0" />
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={e => updateEmail(index, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); addEmailField(); }
                        }}
                        className="flex-1 text-sm text-gray-800 placeholder-gray-300 outline-none bg-transparent"
                      />
                    </div>
                    {emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmailField(index)}
                        className="w-9 h-9 rounded-xl border border-gray-200 grid place-items-center text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add another */}
            <button
              type="button"
              onClick={addEmailField}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all mb-6"
            >
              <FiPlus size={14} />
              Add another employee
            </button>

            {/* Status message */}
            {message && (
              <div className={`flex items-start gap-3 p-3.5 rounded-xl mb-5 text-sm border ${
                isSuccess
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                {isSuccess
                  ? <FiCheckCircle size={15} className="shrink-0 mt-0.5" />
                  : <FiAlertCircle size={15} className="shrink-0 mt-0.5" />
                }
                <span>{message}</span>
              </div>
            )}

            {/* Send button */}
            <button
              type="button"
              onClick={sendInvitations}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 bg-gray-950 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <FiSend size={14} />
                  Send Invitation{emails.filter(e => e.trim()).length > 1 ? 's' : ''}
                </>
              )}
            </button>

            {/* Helper text */}
            <p className="text-center text-xs text-gray-300 mt-4">
              Invited members will receive an email with a link to join your workspace.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
