import person from "../assets/person.png";
import { useState, useMemo, useEffect, useCallback } from "react";
import CredentialTypeSelector from "./CredentialTypeSelector";
import { useNavigate, useLocation } from "react-router-dom";
import Deletemodal from "./Deletemodal";
import { credentialsService, type Credential } from "../lib/credentialsService";

export default function Credentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | number>("");
  const [selectedCredentialName, setSelectedCredentialName] = useState<string>("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to load credentials
  const loadCredentials = useCallback(async () => {
    try {
      setLoading(true);
      const creds = await credentialsService.getCredentials();
      setCredentials(creds);
      setOpenDropdown(null); // Reset dropdown when loading credentials
    } catch (error) {
      console.error('Error loading credentials:', error);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load credentials on component mount and when returning from credential creation/edit
  useEffect(() => {
    loadCredentials();
    setOpenDropdown(null); // Ensure dropdown is closed on navigation/creation
  }, [loadCredentials, location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-button') && !(event.target as Element).closest('.dropdown-menu')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Filter credentials based on search and status
  const filteredCredentials = useMemo(() => {
    let filtered = credentials.map((cred) => {
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
      return { ...cred, computedStatus };
    });

    if (searchTerm) {
      filtered = filtered.filter(
        (cred) =>
          cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cred.entity.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "All Status") {
      filtered = filtered.filter((cred) => {
        if (statusFilter === "Expiring in 30 Days") {
          return cred.computedStatus.startsWith("Expires in");
        }
        return cred.computedStatus === statusFilter;
      });
    }

    return filtered;
  }, [credentials, searchTerm, statusFilter]);

  const handleDeleteCredential = async () => {
    try {
      await credentialsService.deleteCredential(selectedCredentialId);
      setCredentials(credentials.filter((c) => c.id !== selectedCredentialId && c._id !== selectedCredentialId));
      setShowDeleteModal(false);
      setSelectedCredentialId("");
      setSelectedCredentialName("");
    } catch (error) {
      console.error('Error deleting credential:', error);
      alert('Failed to delete credential. Please try again.');
    }
  };


  return (
    <div className="w-full relative">
      <div className="bg-white min-h-screen p-4 md:p-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Credentials List
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Manage and track all your certificates and licenses
          </p>
        </div>



        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-6">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
              <div className="flex-1 sm:flex-none sm:min-w-48">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div className="flex-1 sm:flex-none sm:min-w-48">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 cursor-pointer">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer"
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Expired</option>
                  <option>Expiring in 30 Days</option>
                </select>
              </div>
            </div>

            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setShowTypeSelector(!showTypeSelector)}
                className=" coursor-pointer border border-gray-300 w-full sm:w-auto bg-white text-black font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-black hover:text-white transition duration-200 text-xs sm:text-sm md:text-base whitespace-nowrap cursor-pointer"
              >
                + Add New
              </button>
              <CredentialTypeSelector
                isOpen={showTypeSelector}
                onClose={() => setShowTypeSelector(false)}
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading credentials...</div>
            ) : filteredCredentials.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {credentials.length === 0
                  ? "No credentials yet. Click '+ Add New' to create one."
                  : "No credentials match your search."}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">
                      Credentials
                    </th>
                    <th className="text-left px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 hidden sm:table-cell">
                      Entity(Type)
                    </th>
                    <th className="text-left px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 hidden md:table-cell">
                      Expires In 30 Days
                    </th>
                    <th className="text-left px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-right px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredCredentials.map((credential, index) => {
                    const uniqueId = String(credential.id || credential._id || index);
                    return (
                    <tr key={uniqueId} className="hover:bg-gray-50 transition">
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                          {credential.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 sm:hidden flex items-center gap-1">
                          <img src={person} className="w-3 h-3" alt="entity" />
                          {credential.entity}
                        </p>
                      </td>

                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <img src={person} className="w-4 sm:w-5 h-4 sm:h-5" alt="entity" />
                          <span className="text-xs sm:text-sm text-gray-700">
                            {credential.entity} ({credential.type === 'company' ? 'Company' : 'Individual'})
                          </span>
                        </div>
                      </td>

                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 hidden md:table-cell">
                        <span className="text-xs sm:text-sm text-gray-700">
                          {credential.expiry_date ? (() => {
                            const expiryDate = new Date(credential.expiry_date);
                            const today = new Date();
                            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                            return daysUntilExpiry > 0 && daysUntilExpiry <= 30 ? `${daysUntilExpiry} days` : '-';
                          })() : '-'}
                        </span>
                      </td>

                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <span
                          className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                            credential.computedStatus === "Active"
                              ? "bg-green-100 text-green-800"
                              : credential.computedStatus === "Expired"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {credential.computedStatus}
                        </span>
                      </td>

                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === uniqueId ? null : uniqueId);
                          }}
                          className="dropdown-button text-gray-400 hover:text-gray-600 transition p-1 sm:p-2 cursor-pointer pointer-events-auto"
                        >
                          <svg
                            className="w-4 sm:w-5 h-4 sm:h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <circle cx="10" cy="4" r="2" />
                            <circle cx="10" cy="10" r="2" />
                            <circle cx="10" cy="16" r="2" />
                          </svg>
                        </button>
                        {openDropdown === uniqueId ? (
                          <div
                            className="dropdown-menu absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-40 sm:w-48"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/dashboard/credentials/view', { state: credential });
                                setOpenDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (credential.type === 'company') {
                                  navigate('/dashboard/credentials/company', { state: credential });
                                } else {
                                  navigate('/dashboard/credentials/new', { state: credential });
                                }
                                setOpenDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <svg
                                className="w-4 h-4 text-amber-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCredentialId((credential.id || credential._id || "") as string | number);
                                setSelectedCredentialName(credential.name);
                                setShowDeleteModal(true);
                                setOpenDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                            >
                              <svg
                                className="w-4 h-4 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>



        {/* Footer Info */}
        {!loading && filteredCredentials.length > 0 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredCredentials.length} results</span>
            </p>
            <p className="text-xs text-gray-500">Last updated today</p>
          </div>
        )}
      </div>

      {/* Delete Modal Overlay */}
      {showDeleteModal && (
        <Deletemodal
          onClose={() => setShowDeleteModal(false)}
          itemName={selectedCredentialName}
          onDelete={handleDeleteCredential}
        />
      )}
    </div>
  );
}