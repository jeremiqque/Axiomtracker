
import { useNavigate, useLocation } from "react-router-dom";
import { type Credential } from "../lib/credentialsService";
import { FiArrowLeft, FiUser, FiCalendar, FiMapPin, FiAward, FiHash, FiClock, FiFileText } from "react-icons/fi";

export default function ViewDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const cred: Credential | null = (location && location.state as Credential) || null;

  const imgUrl = cred?.image_url || cred?.file_url || (cred as any)?.fileUrl || (cred as any)?.imageUrl || null;

  const calculateRemainingDays = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const remainingDays = (cred as any)?.remainingDays ?? calculateRemainingDays(cred?.expiry_date);

  const statusConfig: Record<string, { bg: string; text: string; dot: string; ring: string }> = {
    Active:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
    Expiring: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   ring: 'ring-amber-200'   },
    Expired:  { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     ring: 'ring-red-200'     },
  };

  const status = cred?.status || 'Active';
  const sc = statusConfig[status] ?? statusConfig['Active'];

  const daysColor =
    remainingDays === null ? 'text-gray-900'
    : remainingDays <= 0  ? 'text-red-600'
    : remainingDays <= 30 ? 'text-red-500'
    : remainingDays <= 60 ? 'text-amber-500'
    : 'text-emerald-600';

  const daysLabel =
    remainingDays === null ? '—'
    : remainingDays <= 0  ? 'Expired'
    : `${remainingDays} days`;

  if (!cred) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 grid place-items-center mx-auto mb-4">
            <FiAward size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">No credential data found</p>
          <p className="text-xs text-gray-400 mb-5">Use the "View Details" button from the credentials list.</p>
          <button
            onClick={() => navigate('/dashboard/credentials')}
            className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Credentials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard/credentials')}
          className="shrink-0 w-8 h-8 rounded-lg border border-gray-200 bg-white grid place-items-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <FiArrowLeft size={14} className="text-gray-600" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base font-semibold text-gray-900 truncate">{cred.name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${sc.bg} ${sc.text} ${sc.ring}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Issued: <span className="text-gray-500 font-medium">{cred.date_of_issue || '—'}</span>
          </p>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Certificate Image */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gray-100 grid place-items-center">
                <FiFileText size={11} className="text-gray-400" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Certificate</p>
            </div>
            <div className="p-4">
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt="Certificate"
                  className="w-full h-64 object-contain rounded-xl bg-gray-50"
                />
              ) : (
                <div className="w-full h-64 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl grid place-items-center mb-3 shadow-sm">
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-gray-400">No Image</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">Upload certificate to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Metric Pills */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-xl p-4 ring-1 ${sc.bg} ${sc.ring}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Status</p>
              <p className={`text-sm font-bold ${sc.text}`}>{status}</p>
            </div>

            <div className="rounded-xl p-4 bg-gray-50 ring-1 ring-gray-200">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Days Left</p>
              <p className={`text-sm font-bold ${daysColor}`}>{daysLabel}</p>
            </div>

            <div className="rounded-xl p-4 bg-gray-50 ring-1 ring-gray-200">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Cert No.</p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {cred.credential_number || (cred as any)._id || cred.id || '—'}
              </p>
            </div>
          </div>

          {/* Detail Rows */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gray-100 grid place-items-center">
                <FiAward size={11} className="text-gray-400" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credential Details</p>
            </div>

            <div className="divide-y divide-gray-100">
              {[
                {
                  icon: FiUser,
                  label: 'Assigned Employee',
                  value: cred.entity,
                },
                {
                  icon: FiHash,
                  label: 'Credential Number',
                  value: cred.credential_number || (cred as any)._id || cred.id,
                },
                {
                  icon: FiCalendar,
                  label: 'Expiry Date',
                  value: cred.expiry_date,
                },
                {
                  icon: FiClock,
                  label: 'Date of Issue',
                  value: cred.date_of_issue,
                },
                {
                  icon: FiAward,
                  label: 'Issuing Institute',
                  value: cred.issuing_institution,
                },
                {
                  icon: FiMapPin,
                  label: 'Location',
                  value: [cred.city, cred.country].filter(Boolean).join(', ') || null,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="px-5 py-3 flex items-center gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 grid place-items-center shrink-0">
                    <Icon size={12} className="text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Additional Notes ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gray-100 grid place-items-center">
            <FiFileText size={11} className="text-gray-400" />
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Additional Notes</p>
        </div>
        <div className="p-5">
          {cred.additional_notes ? (
            <p className="text-sm text-gray-600 leading-relaxed">{cred.additional_notes}</p>
          ) : (
            <p className="text-sm text-gray-300 italic">No additional notes</p>
          )}
        </div>
      </div>

    </div>
  );
}
