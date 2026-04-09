import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import CredentialTypeSelector from "./CredentialTypeSelector";
import { useNavigate, useLocation } from "react-router-dom";
import Deletemodal from "./Deletemodal";
import { credentialsService, type Credential } from "../lib/credentialsService";
import { FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2, FiMoreVertical } from "react-icons/fi";
import Select from "./Select";
import { useUserRole } from "../hooks/useUserRole";

export default function Credentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | number>("");
  const [selectedCredentialName, setSelectedCredentialName] = useState<string>("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { canEditCredentials } = useUserRole();

  // Function to load credentials
  const loadCredentials = useCallback(async () => {
    try {
      setLoading(true);
      const creds = await credentialsService.getCredentials();
      setCredentials(creds);
      setOpenDropdown(null);
      setDropdownPos(null);
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
        setDropdownPos(null);
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


  // Compute summary counts
  const counts = useMemo(() => {
    let active = 0, expiring = 0, expired = 0;
    credentials.forEach(c => {
      if (!c.expiry_date) { active++; return; }
      const days = Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / 86400000);
      if (days < 0) expired++;
      else if (days <= 30) expiring++;
      else active++;
    });
    return { active, expiring, expired };
  }, [credentials]);

  const statusBadge = (status: string) => {
    if (status === 'Active')
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Active</span>;
    if (status === 'Expired')
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Expired</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />{status}</span>;
  };

  const entityInitials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

  return (
    <div className="w-full relative space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Credentials</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage and track all your certificates and licenses</p>
        </div>

        {/* Stat pills */}
        {!loading && credentials.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{counts.active} Active
            </span>
            {counts.expiring > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{counts.expiring} Expiring
              </span>
            )}
            {counts.expired > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />{counts.expired} Expired
              </span>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or entity…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'All Status',          label: 'All Status'          },
              { value: 'Active',              label: 'Active'              },
              { value: 'Expired',             label: 'Expired'             },
              { value: 'Expiring in 30 Days', label: 'Expiring in 30 Days' },
            ]}
          />
        </div>

        {/* Add button — Admin & Employee only */}
        {canEditCredentials && (
          <div className="relative shrink-0">
            <button
              onClick={() => setShowTypeSelector(!showTypeSelector)}
              className="flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap w-full sm:w-auto justify-center"
            >
              <FiPlus size={15} />
              Add New
            </button>
            <CredentialTypeSelector
              isOpen={showTypeSelector}
              onClose={() => setShowTypeSelector(false)}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center gap-1.5 py-16">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 grid place-items-center text-gray-300 text-2xl">○</div>
            <p className="text-sm text-gray-400">
              {credentials.length === 0 ? 'No credentials yet — click Add New to get started.' : 'No credentials match your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full" style={{ overflowY: 'visible' }}>
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Credential</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">Entity</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Expiry</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCredentials.map((credential, index) => {
                  const uniqueId = String(credential.id || credential._id || index);
                  const initials = entityInitials(credential.entity);
                  const isCompany = credential.type === 'company';
                  const expiryLabel = credential.expiry_date ? (() => {
                    const days = Math.ceil((new Date(credential.expiry_date).getTime() - Date.now()) / 86400000);
                    if (days < 0) return <span className="text-red-400 text-xs">Expired</span>;
                    if (days <= 30) return <span className="text-amber-500 text-xs">{days}d left</span>;
                    return <span className="text-gray-500 text-xs">{new Date(credential.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>;
                  })() : <span className="text-gray-300 text-xs">—</span>;

                  return (
                    <tr key={uniqueId} className="hover:bg-gray-50/60 transition-colors group">

                      {/* Credential name */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">{credential.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 sm:hidden">{credential.entity}</p>
                      </td>

                      {/* Entity */}
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full grid place-items-center text-[10px] font-semibold shrink-0 ${isCompany ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm text-gray-800">{credential.entity}</p>
                            <p className="text-[11px] text-gray-400">{isCompany ? 'Company' : 'Individual'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="px-5 py-4 hidden md:table-cell">{expiryLabel}</td>

                      {/* Status */}
                      <td className="px-5 py-4">{statusBadge(credential.computedStatus)}</td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          ref={(el) => { buttonRefs.current[uniqueId] = el; }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openDropdown === uniqueId) {
                              setOpenDropdown(null);
                              setDropdownPos(null);
                            } else {
                              const rect = buttonRefs.current[uniqueId]?.getBoundingClientRect();
                              if (rect) {
                                setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              }
                              setOpenDropdown(uniqueId);
                            }
                          }}
                          className="dropdown-button w-8 h-8 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        >
                          <FiMoreVertical size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && filteredCredentials.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing <span className="font-medium text-gray-600">{filteredCredentials.length}</span> of <span className="font-medium text-gray-600">{credentials.length}</span> credentials
          </p>
          <p className="text-xs text-gray-400">Last updated today</p>
        </div>
      )}

      {/* Fixed-position action dropdown — escapes all overflow clipping */}
      {openDropdown && dropdownPos && (() => {
        const credential = filteredCredentials.find((c, i) => String(c.id || c._id || i) === openDropdown);
        if (!credential) return null;
        const isCompany = credential.type === 'company';
        return (
          <div
            className="dropdown-menu fixed bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] w-44 py-1"
            style={{ top: dropdownPos.top, right: dropdownPos.right }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/dashboard/credentials/view', { state: credential }); setOpenDropdown(null); setDropdownPos(null); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <FiEye size={14} className="text-blue-500" /> View Details
            </button>
            {canEditCredentials && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(isCompany ? '/dashboard/credentials/company' : '/dashboard/credentials/new', { state: credential }); setOpenDropdown(null); setDropdownPos(null); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <FiEdit2 size={14} className="text-amber-500" /> Edit
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCredentialId((credential.id || credential._id || '') as string | number); setSelectedCredentialName(credential.name); setShowDeleteModal(true); setOpenDropdown(null); setDropdownPos(null); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <FiTrash2 size={14} /> Delete
                </button>
              </>
            )}
          </div>
        );
      })()}

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