import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { FiBell, FiMenu } from "react-icons/fi";
import subtract from "../assets/subtract.png";
import dashboardIcon from "../assets/dashboard-circle.png";
import contact from "../assets/contact.png";
import entityIcon from "../assets/people.png";
import settingsIcon from "../assets/settings.png";
import elements from "../assets/elements.png";
import logoutIcon from "../assets/logout.png";
import supabase from "../lib/supabase";
import { employeesService } from "../lib/supabaseService";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('Loading...');
  const location = useLocation();
  const navigate = useNavigate();

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <section className="w-full flex">

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 min-h-screen border border-gray-300 bg-white/20 backdrop-blur-md px-6 py-8 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:bg-white md:backdrop-blur-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col items-center gap-3 mb-10">
           <img src={subtract} alt="Axiom Tracker Logo" className="w-8 h-8" />
          <h2 className="font-semibold">Axiom Tracker</h2>
        </div>

        <nav className="space-y-3">
          <Link
            to="/dashboard"
            className={`block px-4 py-3 flex items-center rounded-md text-sm cursor-pointer ${location.pathname === '/dashboard' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
            onClick={toggleSidebar}
          >
            <img src={dashboardIcon} alt="Dashboard" className={`w-5 h-5 mr-2 ${location.pathname === '/dashboard' ? 'invert' : 'hover:invert'}`} />
            Dashboard
          </Link>

          <Link
            to="/dashboard/credentials"
            className={`block px-4 py-3 flex items-center rounded-md text-sm cursor-pointer ${location.pathname.includes('/credentials') ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
            onClick={toggleSidebar}
          >
            <img src={contact} alt="Credentials" className={`w-5 h-5 mr-2 ${location.pathname.includes('/credentials') ? 'invert' : 'hover:invert'}`} />
            Credentials
          </Link>

          <Link
            to="/dashboard/entity"
            className={`block px-4 py-3 flex items-center rounded-md text-sm cursor-pointer ${location.pathname.includes('/entity') ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
            onClick={toggleSidebar}
          >
            <img src={entityIcon} alt="Entity" className={`w-5 h-5 mr-2 ${location.pathname.includes('/entity') ? 'invert' : 'hover:invert'}`} />
            Entity
          </Link>

          <Link
            to="/dashboard/settings"
            className={`block px-4 py-3 flex items-center rounded-md text-sm cursor-pointer ${location.pathname.includes('/settings') ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
            onClick={toggleSidebar}
          >
            <img src={settingsIcon} alt="Settings" className={`w-5 h-5 mr-2 ${location.pathname.includes('/settings') ? 'invert' : 'hover:invert'}`} />
            Settings
          </Link>
        </nav>
      </aside>



      {/* RIGHT SECTION */}
      <main className="flex-1 bg-white min-h-screen">

        {/* TOPBAR */}
        <div className={`flex justify-between items-center px-4 sm:px-8 py-5 border border-gray-300 ${location.pathname.includes('/credentials') ? 'bg-white text-black' : 'bg-white text-black'}`}>
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="md:hidden">
              <FiMenu size={24} />
            </button>
            <h1 className="font-semibold text-lg ">
              {location.pathname.includes('/credentials') ? 'Certificate/License Management' :
               location.pathname.includes('/entity') ? 'Employee Management' :
               location.pathname.includes('/activities') ? 'Notification' :
               location.pathname.includes('/settings') ? 'Settings' :
               'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">

            <Link to="/dashboard/activities">
              <FiBell size={20} color={location.pathname.includes('/activities') ? 'black' : undefined} />
            </Link>

            <div className="relative">
              <div
                className="flex items-center gap-2 sm:gap-3 bg-gray-100 px-3 sm:px-6 py-2 w-full max-w-xs sm:max-w-md rounded-2xl cursor-pointer"
                onClick={toggleDropdown}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full grid place-items-center font-semibold text-sm">
                  {(() => {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    return user.email ? user.email[0].toUpperCase() : 'U';
                  })()}
                </div>

                <div className="text-sm hidden sm:block">
                  <p className="font-semibold">
                    {(() => {
                      const user = JSON.parse(localStorage.getItem('user') || '{}');
                      return user.email || 'user@example.com';
                    })()}
                  </p>
                  <p className="text-gray-500">{userRole}</p>
                </div>
                <img src={elements} alt="Element" className="w-2 h-2" />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-300 rounded-md shadow-lg w-80 z-50">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-300 rounded-full grid place-items-center font-semibold">
                        {(() => {
                          const user = JSON.parse(localStorage.getItem('user') || '{}');
                          return user.firstName && user.lastName ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'U';
                        })()}
                      </div>
                      <p className="text-sm text-gray-700">
                        {(() => {
                          const user = JSON.parse(localStorage.getItem('user') || '{}');
                          return user.email || 'user@example.com';
                        })()}
                      </p>
                    </div>
                    <button
                      className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        localStorage.removeItem('user');
                        navigate('/login');
                      }}
                    >
                      <img src={logoutIcon} alt="Logout" className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </section>
  );
}