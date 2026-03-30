import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AddEmployee from "./AddEmployee";
import { employeesService, type Employee } from "../lib/supabaseService";

export default function Entity() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeesService.listEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        // If session expired, redirect to login
        if (err instanceof Error && (err.message.includes('Session expired') || err.message.includes('JWT expired'))) {
          navigate('/login');
        }
      }
    };
    fetchEmployees();
  }, []);

  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-lg font-semibold">Employee Management</h1>

        <div className="flex gap-2">
          <Link
            to="/invite"
            className="bg-white border border-gray-200 px-4 py-2 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white"
          >
            Invite Employee
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white border border-gray-200 px-4 py-2 flex items-center gap-2 rounded-md text-sm cursor-pointer w-fit hover:bg-black hover:text-white"
          >
            <Plus size={16} />
            Add New Employee
          </button>
        </div>
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
          onCancel={() => {
            setShowForm(false);
            setEditingEmployee(null);
          }}
          onSave={async (employeeData: { id: number; name: string; role: string; email: string; lastLogin: string; }) => {
            try {
              console.log('Creating employee with data:', employeeData);
              const employeeDataForService = {
                email: employeeData.email,
                role: employeeData.role,
                first_name: employeeData.name.split(' ')[0],
                last_name: employeeData.name.split(' ').slice(1).join(' '),
                date_of_birth: '',
                job_title: '',
                cell_phone: '',
                send_text_notification: false,
                additional_notes: '',
              };
              const createdEmployee = await employeesService.createEmployee(employeeDataForService);
              console.log('Employee created:', createdEmployee);
              setEmployees(prev => [createdEmployee, ...prev]);
              setShowForm(false);
            } catch (err) {
              console.error('Failed to create employee:', err);
              if (err instanceof Error && (err.message.includes('Session expired') || err.message.includes('JWT expired'))) {
                navigate('/login');
              } else {
                alert(`Failed to create employee: ${err instanceof Error ? err.message : 'Unknown error'}`);
              }
            }
          }}
          onUpdate={async (updatedEmployee: { id: number; name: string; role: string; email: string; lastLogin: string; }) => {
            try {
              const employeeData = {
                email: updatedEmployee.email,
                role: updatedEmployee.role,
                first_name: updatedEmployee.name.split(' ')[0],
                last_name: updatedEmployee.name.split(' ').slice(1).join(' '),
              };
              await employeesService.updateEmployee(updatedEmployee.id, employeeData);
              const data = await employeesService.listEmployees();
              setEmployees(data);
              setEditingEmployee(null);
            } catch (err) {
              console.error('Failed to update employee:', err);
            }
          }}
        />
      ) : (
        <>
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md w-full md:w-72 mb-4">
            <Search size={16} className="text-gray-500" />
            <input
              placeholder="Search for employee"
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          {/* Mobile View */}
          <div className="md:hidden">
            {employees.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No employees added yet. Click "Add New Employee" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {employees.map((emp) => (
                  <div key={emp.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{`${emp.first_name} ${emp.last_name}`}</h3>
                        <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Role:</span> {emp.role}</p>
                        <p className="text-sm text-gray-600"><span className="font-medium">Email:</span> {emp.email}</p>
                        <p className="text-sm text-gray-600"><span className="font-medium">Last Login:</span> {new Date(emp.updated_at).toLocaleDateString()}</p>
                      </div>
                      <div className="relative ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === emp.id ? null : emp.id);
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
                        {openMenu === emp.id && (
                          <div className="absolute right-0 top-8 bg-white border rounded-md shadow-md w-32 z-20">
                            <button
                              onClick={() => {
                                setEditingEmployee(emp);
                                setOpenMenu(null);
                              }}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full cursor-pointer text-left"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await employeesService.deleteEmployee(emp.id);
                                  const data = await employeesService.listEmployees();
                                  setEmployees(data);
                                  setOpenMenu(null);
                                } catch (err) {
                                  console.error('Failed to delete employee:', err);
                                  if (err instanceof Error && (err.message.includes('Session expired') || err.message.includes('JWT expired'))) {
                                    navigate('/login');
                                  }
                                }
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 w-full cursor-pointer text-left"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center p-4 text-xs text-gray-500 border-t">
                  <span>{employees.length} results</span>
                  <span>1–{employees.length} of {employees.length} entries</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block w-full border border-gray-300 rounded-lg px-3 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left"><input type="checkbox" /></th>
                  <th className="p-3 text-left">All</th>
                  <th className="p-3 text-left">Employees</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Last Login</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No employees added yet. Click "Add New Employee" to get started.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp, index) => (
                    <tr key={emp.id} className="">
                      <td className="p-3">
                        <input type="checkbox" />
                      </td>
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{`${emp.first_name} ${emp.last_name}`}</td>
                      <td className="p-3">{emp.role}</td>
                      <td className="p-3">{emp.email}</td>
                      <td className="p-3">{new Date(emp.updated_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === emp.id ? null : emp.id);
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
                        {openMenu === emp.id && (
                          <div className="dropdown-menu absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-40 sm:w-48">
                            <button
                              onClick={() => {
                                setEditingEmployee(emp);
                                setOpenMenu(null);
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
                              onClick={async () => {
                                try {
                                  await employeesService.deleteEmployee(emp.id);
                                  const data = await employeesService.listEmployees();
                                  setEmployees(data);
                                  setOpenMenu(null);
                                } catch (err) {
                                  console.error('Failed to delete employee:', err);
                                  if (err instanceof Error && (err.message.includes('Session expired') || err.message.includes('JWT expired'))) {
                                    navigate('/login');
                                  }
                                }
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
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="flex justify-between items-center p-4 text-xs text-gray-500">
              <span>{employees.length} results</span>
              <span>1–{employees.length} of {employees.length} entries</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
