import { useState, useEffect } from 'react';
import { subscribe, dismiss, type ToastItem } from '../lib/toast';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const config = {
  success: {
    bar:   'bg-emerald-500',
    icon:  <FiCheckCircle size={16} className="text-emerald-500 shrink-0" />,
    title: 'Success',
  },
  error: {
    bar:   'bg-red-500',
    icon:  <FiXCircle size={16} className="text-red-500 shrink-0" />,
    title: 'Error',
  },
  warning: {
    bar:   'bg-amber-400',
    icon:  <FiAlertTriangle size={16} className="text-amber-500 shrink-0" />,
    title: 'Warning',
  },
  info: {
    bar:   'bg-blue-500',
    icon:  <FiInfo size={16} className="text-blue-500 shrink-0" />,
    title: 'Info',
  },
};

function ToastCard({ item }: { item: ToastItem }) {
  const [visible, setVisible] = useState(false);
  const cfg = config[item.type];

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => dismiss(item.id), 300);
  };

  return (
    <div
      className={`relative flex items-start gap-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3.5 overflow-hidden
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}
    >
      {/* Left colour bar */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${cfg.bar}`} />

      {/* Icon */}
      <div className="mt-0.5">{cfg.icon}</div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-700 leading-none mb-1">{cfg.title}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{item.message}</p>
      </div>

      {/* Close */}
      <button
        onClick={handleDismiss}
        className="shrink-0 mt-0.5 text-gray-300 hover:text-gray-500 transition-colors"
      >
        <FiX size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribe(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard item={t} />
        </div>
      ))}
    </div>
  );
}
