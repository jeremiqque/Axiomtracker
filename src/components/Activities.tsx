import { useState, useEffect } from "react";
import { credentialsService, type Credential } from "../lib/credentialsService";

interface Activity {
  id: string;
  type: 'new' | 'expiring' | 'expired' | 'renewed';
  title: string;
  description: string;
  date: string;
  dateIso: string;
}

const typeConfig = {
  new:      { label: 'Created',       dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',  bar: 'bg-emerald-500' },
  expiring: { label: 'Expiring Soon', dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200',        bar: 'bg-amber-400'   },
  expired:  { label: 'Expired',       dot: 'bg-red-500',     badge: 'bg-red-50 text-red-600 ring-red-200',               bar: 'bg-red-500'     },
  renewed:  { label: 'Renewed',       dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 ring-blue-200',            bar: 'bg-blue-500'    },
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const credentials = await credentialsService.getCredentials();
        setActivities(generateActivities(credentials));
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const newCountdown: { [key: string]: string } = {};
      activities.forEach((activity) => {
        if (activity.type === 'expiring') {
          const match = activity.description.match(/expires in (\d+) days/);
          if (match) {
            const daysLeft = parseInt(match[1]);
            if (daysLeft > 0) {
              const hoursLeft = Math.floor((daysLeft * 24) - ((now.getTime() % (1000 * 3600 * 24)) / (1000 * 3600)));
              const minutesLeft = Math.floor((now.getTime() % (1000 * 3600)) / (1000 * 60));
              newCountdown[activity.id] = `${daysLeft}d ${hoursLeft}h ${minutesLeft}m`;
            } else {
              newCountdown[activity.id] = 'Expired';
            }
          }
        }
      });
      setCountdown(newCountdown);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [activities]);

  const generateActivities = (credentials: Credential[]): Activity[] => {
    const list: Activity[] = [];
    const now = new Date();

    credentials.forEach((cred, index) => {
      const createdDate = cred.createdAt
        ? new Date(cred.createdAt)
        : (cred.created_at ? new Date(cred.created_at) : now);

      list.push({
        id: `${cred._id || cred.id || index}-created`,
        type: 'new',
        title: 'Certificate Created',
        description: `${cred.name} · ${cred.entity}`,
        date: formatDate(createdDate),
        dateIso: createdDate.toISOString(),
      });

      if (cred.expiry_date) {
        const expiryDate = new Date(cred.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (daysUntilExpiry < 0) {
          list.push({
            id: `${cred._id || index}-expired`,
            type: 'expired',
            title: 'Certificate Expired',
            description: `${cred.name} · ${cred.entity}`,
            date: formatDate(expiryDate),
            dateIso: expiryDate.toISOString(),
          });
        } else if (daysUntilExpiry <= 30) {
          list.push({
            id: `${cred._id || index}-expiring`,
            type: 'expiring',
            title: 'Expiring Soon',
            description: `${cred.name} · ${cred.entity} — expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
            date: formatDate(now),
            dateIso: expiryDate.toISOString(),
          });
        }
      }
    });

    return list
      .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime())
      .slice(0, 10);
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full bg-gray-200 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-100 grid place-items-center text-gray-300 text-lg">○</div>
        <p className="text-sm text-gray-400">No recent activities</p>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Recent Activities</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Latest certificate events</p>
        </div>
        <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
          {activities.length} events
        </span>
      </div>

      {/* Activity list */}
      <div className="divide-y divide-gray-50">
        {activities.map((activity) => {
          const cfg = typeConfig[activity.type] || typeConfig.new;
          const desc = activity.type === 'expiring' && countdown[activity.id]
            ? activity.description.replace(/expires in \d+ day[s]?/, `expires in ${countdown[activity.id]}`)
            : activity.description;

          return (
            <div key={activity.id} className="flex items-start gap-3.5 px-5 py-4 hover:bg-gray-50/70 transition-colors">

              {/* Colour dot */}
              <div className="shrink-0 mt-1">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ring-[3px] ring-white shadow-sm`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">

                {/* Row 1 — title + date */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{activity.title}</p>
                  <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap font-medium mt-0.5">
                    {activity.date}
                  </span>
                </div>

                {/* Row 2 — badge */}
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${cfg.badge}`}>
                  {cfg.label}
                </span>

                {/* Row 3 — description */}
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{desc}</p>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
