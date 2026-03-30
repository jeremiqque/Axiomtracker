import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import addNew from "../assets/add new.png";
import upload from "../assets/upload.png";
import search from "../assets/search.png";
import view from "../assets/view.png";
import background from "../assets/background.png";
import Activities from "./Activities";
import { credentialsService } from "../lib/credentialsService";

export default function Dashboard() {
  const navigate = useNavigate();
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
      <div className="w-full bg-cover bg-top rounded-xl text-white p-4 sm:p-6 md:p-8" style={{ backgroundImage: `url(${background})` }}>
        <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4">Dashboard Overview</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

          <div className="bg-white text-black p-3 sm:p-4 md:p-5 rounded-lg">
            <p className="text-xs text-gray-500">Total Certificates</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">{stats.total}</h1>
          </div>

          <div className="bg-white text-black p-3 sm:p-4 md:p-5 rounded-lg">
            <p className="text-xs text-gray-500">Active</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">{stats.active}</h1>
          </div>

          <div className="bg-white text-black p-3 sm:p-4 md:p-5 rounded-lg">
            <p className="text-xs text-gray-500">Expiring Soon (30 Days)</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">{stats.expiringSoon}</h1>
          </div>

          <div className="bg-white text-black p-3 sm:p-4 md:p-5 rounded-lg relative">
            <p className="text-xs text-gray-500">Expired</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">{stats.expired}</h1>

            {/* <div className="absolute bottom-3 right-3 bg-red-600 text-white text-[10px] px-2 py-1 rounded">
              EPS 10
            </div> */}
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITIES + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* RECENT ACTIVITIES */}
          <div className="bg-white rounded-xl p-4 sm:p-6 col-span-1 lg:col-span-2 border border-gray-400 flex flex-col">
            <Activities />
          </div>

        {/* QUICK ACTIONS */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border space-y-3 sm:space-y-4 border-gray-400">

          <h3 className="font-semibold text-sm sm:text-base mb-3">Quick Actions</h3>

          <div className="p-2 sm:p-3 md:p-4 rounded-lg cursor-pointer flex items-start gap-2 sm:gap-3" onClick={() => navigate('/dashboard/credentials/new')}>
            <img src={addNew} alt="Add New" className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 mt-1 flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="font-semibold text-xs sm:text-sm md:text-base">Add New Certificate/License</h4>
              <p className="text-xs text-gray-600 line-clamp-2">
                Create a new certification record with issue & expiry dates.
              </p>
            </div>
          </div>

          <div className="p-2 sm:p-3 md:p-4 rounded-lg cursor-pointer flex items-start gap-2 sm:gap-3" onClick={() => navigate('/dashboard/credentials')}>
            <img src={upload} alt="Upload" className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 mt-1 flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="font-semibold text-xs sm:text-sm md:text-base">Upload License PDF</h4>
              <p className="text-xs text-gray-600 line-clamp-2">
                Attach supporting documents to certificate records.
              </p>
            </div>
          </div>

          <div className="p-2 sm:p-3 md:p-4 rounded-lg cursor-pointer flex items-start gap-2 sm:gap-3" onClick={() => navigate('/dashboard/credentials')}>
            <img src={search} alt="View Certificates" className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 mt-1 flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="font-semibold text-xs sm:text-sm md:text-base">View Certificates</h4>
              <p className="text-xs text-gray-600 line-clamp-2">
                Find any certificate instantly by name, number or type.
              </p>
            </div>
          </div>

          <div className="p-2 sm:p-3 md:p-4 rounded-lg cursor-pointer flex items-start gap-2 sm:gap-3" onClick={() => navigate('activities')}>
            <img src={view} alt="View All" className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 mt-1 flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="font-semibold text-xs sm:text-sm md:text-base">View All</h4>
              <p className="text-xs text-gray-600 line-clamp-2">
                See all of your active, expiring, and expired certificates.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}