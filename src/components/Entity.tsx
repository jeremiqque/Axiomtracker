import { Plus, Search, Pencil, Trash2, MoreVertical } from "lucide-react";
import { toast } from "../lib/toast";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import AddEmployee from "./AddEmployee";
import { employeesService, type Employee } from "../lib/supabaseService";
import { useUserRole } from "../hooks/useUserRole";
import supabase from "../lib/supabase";

export default function Entity() {
  const navigate = useNavigate();
  const { canEdit, isEmployee, loading: roleLoading } = useUserRole();
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeesService.listEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        if (err instanceof Error && (err.message.includes('Session expired') || err.message.includes('JWT expired'))) {
          navigate('/login');
        }
      }
    };
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserEmail(user?.email ?? '');
    };
    fetchEmployees();
    fetchCurrentUser();
  }, []);

  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);

  const closeMenu = () => { setOpenMenu(null); setMenuPos(null); };

  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, empId: number) => {
    e.stopPropagation();
    if (openMenu === empId) { closeMenu(); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpenMenu(empId);
  };

  // Close on outside click or scroll
  useEffect(() => {
    if (openMenu === null) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) closeMenu();
    };
    const onScroll = () => closeMenu();
    document.addEventListener('mousedown', handler);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [openMenu]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name} ${emp.email} ${emp.role}`
      .toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      Admin:    'bg-gray-900 text-white',
      Employee: 'bg-blue-50 text-blue-700',
      User:     'bg-gray-100 text-gray-600',
      Viewer:   'bg-purple-50 text-purple-700',
    };
    const cls = map[role] ?? 'bg-gray-100 text-gray-600';
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{role}</span>;
  };

  const avatarColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700',
      'bg-rose-100 text-rose-700',  'bg-cyan-100 text-cyan-700',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const initials = (first: string, last: string) =>
    `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();

  const deleteEmployee = async (emp: Employee) => {
    try {
      await employeesService.deleteEmployee(emp.id);
      setEmployees(await employeesService.listEmployees());
      setOpenMenu(null);
    } catch (err) {
      console.error('Failed to delete employee:', err);
      if (err instanceof Error && (err.message.includes('Session expired') || err.message.includes('JWT expired'))) {
        navigate('/login');
      }
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-48 gap-1.5">
        {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
      </div>
    );
  }

  const activeEmp = filteredEmployees.find(e => e.id === openMenu) ?? null;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Employee Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage your team members and their roles</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/invite"
              className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Invite Employee
            </Link>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={15} />
              Add Employee
            </button>
          </div>
        )}
      </div>

      {(showForm || editingEmployee) ? (
        <AddEmployee
          employee={editingEmployee ? {
            id: editingEmployee.id,
            name: `${editingEmployee.first_name} ${editingEmployee.last_name}`,
            role: editingEmployee.role,
            email: editingEmployee.email,
            lastLogin: new Date(editingEmployee.updated_at).toISOString().slice(0, 19).replace('T', ' '),
          } : undefined}
          onCancel={() => { setShowForm(false); setEditingEmployee(null); }}
          onSave={async (employeeData) => {
            try {
              const created = await employeesService.createEmployee({
                email: employeeData.email,
                role: employeeData.role,
                first_name: employeeData.name.split(' ')[0],
                last_name: employeeData.name.split(' ').slice(1).join(' '),
                date_of_birth: '', job_title: '', cell_phone: '',
                send_text_notification: false, additional_notes: '',
              });
              setEmployees(prev => [created, ...prev]);
              setShowForm(false);
            } catch (err) {
              console.error('Failed to create employee:', err);
              if (err instanceof Error && (err.message.includes('Session expired') || err.message.includes('JWT expired'))) {
                navigate('/login');
              } else {
                toast(`Failed to create employee: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
              }
            }
          }}
          onUpdate={async (updatedEmployee) => {
            try {
              await employeesService.updateEmployee(updatedEmployee.id, {
                email: updatedEmployee.email,
                role: updatedEmployee.role,
                first_name: updatedEmployee.name.split(' ')[0],
                last_name: updatedEmployee.name.split(' ').slice(1).join(' '),
              });
              setEmployees(await employeesService.listEmployees());
              setEditingEmployee(null);
            } catch (err) {
              console.error('Failed to update employee:', err);
            }
          }}
        />
      ) : (
        <>
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search employees…"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Table card */}
          <div className="bg-white rounded-xl border border-gray-200">

            {filteredEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 grid place-items-center text-gray-300 text-2xl">○</div>
                <p className="text-sm text-gray-400">
                  {employees.length === 0
                    ? 'No employees yet — click Add Employee to get started.'
                    : 'No employees match your search.'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredEmployees.map(emp => (
                    <div key={emp.id} className="flex items-start gap-3 p-4">
                      <div className={`w-9 h-9 rounded-full grid place-items-center text-xs font-semibold shrink-0 ${avatarColor(`${emp.first_name} ${emp.last_name}`)}`}>
                        {initials(emp.first_name, emp.last_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                        <div className="mt-1.5">{roleBadge(emp.role)}</div>
                      </div>
                      {(canEdit || (isEmployee && emp.email === currentUserEmail)) && (
                        <div className="shrink-0">
                          <button
                            onClick={e => toggleMenu(e, emp.id)}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Employee</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Role</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Email</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Last Login</th>
                        {(canEdit || isEmployee) && <th className="px-5 py-3 w-12" />}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredEmployees.map(emp => (
                        <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors group">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-semibold shrink-0 ${avatarColor(`${emp.first_name} ${emp.last_name}`)}`}>
                                {initials(emp.first_name, emp.last_name)}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">{roleBadge(emp.role)}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-500">{emp.email}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-400">
                            {new Date(emp.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          {(canEdit || (isEmployee && emp.email === currentUserEmail)) && (
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={e => toggleMenu(e, emp.id)}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                              >
                                <MoreVertical size={15} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Showing <span className="font-medium text-gray-600">{filteredEmployees.length}</span> of <span className="font-medium text-gray-600">{employees.length}</span> employees
                  </p>
                  <p className="text-xs text-gray-400">1–{filteredEmployees.length} of {employees.length} entries</p>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Floating dropdown (escapes all overflow containers) ── */}
      {openMenu !== null && menuPos && activeEmp && (
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl w-36 py-1"
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onClick={() => { setEditingEmployee(activeEmp); closeMenu(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <Pencil size={13} className="text-amber-500" /> Edit
          </button>
          {canEdit && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { deleteEmployee(activeEmp); closeMenu(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}