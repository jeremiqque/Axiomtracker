import certificateExpire from "../assets/certificateexpire.png";
import newCertificate from "../assets/new certificate.png";
import cancelCircle from "../assets/cancel-circle.png";
import { useState, useEffect } from "react";
import { credentialsService, type Credential } from "../lib/credentialsService";

interface Activity {
  id: string;
  type: 'new' | 'expiring' | 'expired' | 'renewed';
  title: string;
  description: string;
  date: string;
  dateIso: string; // ISO string used for sorting
  icon: string;
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const credentials = await credentialsService.getCredentials();
        const recentActivities = generateActivities(credentials);
        setActivities(recentActivities);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  // Live countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const newCountdown: { [key: string]: string } = {};

      activities.forEach((activity) => {
        if (activity.type === 'expiring') {
          // Extract expiry date from activity description or find the credential
          const description = activity.description;
          const expiryMatch = description.match(/expires in (\d+) days/);
          if (expiryMatch) {
            const daysLeft = parseInt(expiryMatch[1]);
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
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [activities]);

  const generateActivities = (credentials: Credential[]): Activity[] => {
    const activities: Activity[] = [];
    const now = new Date();

    credentials.forEach((cred, index) => {
      // prefer multiple possible created timestamp fields
      const createdDate = cred.createdAt
        ? new Date(cred.createdAt)
        : (cred.created_at ? new Date(cred.created_at) : now);

      // Add a creation activity for every credential (shows how many days ago it was created)
      activities.push({
        id: `${cred._id || cred.id || index}-created`,
        type: 'new',
        title: 'Certificate Created',
        description: `${cred.name} - ${cred.entity}`,
        date: formatDate(createdDate),
        dateIso: createdDate.toISOString(),
        icon: newCertificate
      });

      // Check expiry status
      if (cred.expiry_date) {
        const expiryDate = new Date(cred.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (daysUntilExpiry < 0) {
          // Expired
          activities.push({
            id: `${cred._id || index}-expired`,
            type: 'expired',
            title: 'Certificate Expired',
            description: `${cred.name} - ${cred.entity}`,
            date: formatDate(expiryDate),
            dateIso: expiryDate.toISOString(),
            icon: cancelCircle
          });
        } else if (daysUntilExpiry <= 30) {
          // Expiring soon
          activities.push({
            id: `${cred._id || index}-expiring`,
            type: 'expiring',
            title: 'Certificate Expiring Soon',
            description: `${cred.name} - ${cred.entity} (expires in ${daysUntilExpiry} days)`,
            date: formatDate(now),
            dateIso: expiryDate.toISOString(),
            icon: certificateExpire
          });
        }
      }
    });

    // Sort by ISO date (most recent first) and limit to 10 activities
    return activities
      .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime())
      .slice(0, 10);
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading activities...</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Activities</h3>
        <p className="text-gray-500">No recent activities to show</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activities</h3>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <img
              src={activity.icon}
              alt={activity.type}
              className="w-8 h-8 flex-shrink-0 mt-0.5"
            />

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
              <p className="text-xs text-gray-600 mt-1">
                {activity.type === 'expiring' && countdown[activity.id]
                  ? activity.description.replace(/expires in \d+ days/, `expires in ${countdown[activity.id]}`)
                  : activity.description}
              </p>
              <p className="text-xs text-gray-400 mt-1">{activity.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
