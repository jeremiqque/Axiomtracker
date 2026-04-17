import { useState, useEffect } from "react";
import { employeesService } from "../lib/supabaseService";
import supabase from "../lib/supabase";

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const employee = await employeesService.getCurrentUserEmployee();
        if (employee?.role) {
          setRole(employee.role);
          return;
        }
        // Fallback: read role from auth user metadata (set during signup)
        const { data: { user } } = await supabase.auth.getUser();
        const metaRole = (user?.user_metadata as Record<string, string> | undefined)?.role ?? null;
        setRole(metaRole);
      } catch (err) {
        console.error("Error fetching role:", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);

  const normalized = role?.toLowerCase() ?? '';
  const isAdmin    = normalized === "admin";
  const isEmployee = normalized === "employee";
  const isViewer   = normalized === "viewer";

  // canEdit: admin-only actions (manage other employees, invite, delete)
  const canEdit = isAdmin;

  // canEditCredentials: employees and admins can add/edit/delete credentials
  const canEditCredentials = isAdmin || isEmployee;

  return { role, loading, isAdmin, isEmployee, isViewer, canEdit, canEditCredentials };
}
