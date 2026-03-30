import supabase from './supabase';

// Helper function to ensure valid session
async function ensureValidSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Session error:', error);
    throw error;
  }

  if (!session) {
    // No session, try to refresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      throw new Error('No active session');
    }
    return refreshData.session;
  }

  // Session exists, let Supabase handle auto-refresh if needed
  return session;
}

export interface Employee {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  job_title: string;
  cell_phone: string;
  send_text_notification: boolean;
  additional_notes?: string;
  created_at: string;
  updated_at: string;
}

// Employees operations
export const employeesService = {
  async listEmployees(): Promise<Employee[]> {
    await ensureValidSession();
    const { data, error } = await supabase
      .from('employees')
      .select('id, email, role, first_name, last_name, date_of_birth, job_title, cell_phone, send_text_notification, additional_notes, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    await ensureValidSession();
    const { data, error } = await supabase
      .from('employees')
      .select('id, email, role, first_name, last_name, date_of_birth, job_title, cell_phone, send_text_notification, additional_notes, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createEmployee(employeeData: {
    email: string;
    role: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    job_title: string;
    cell_phone: string;
    send_text_notification: boolean;
    additional_notes?: string;
  }): Promise<Employee> {
    await ensureValidSession();
    const { data, error } = await supabase
      .from('employees')
      .insert([{
        email: employeeData.email,
        role: employeeData.role,
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        date_of_birth: employeeData.date_of_birth,
        job_title: employeeData.job_title,
        cell_phone: employeeData.cell_phone,
        send_text_notification: employeeData.send_text_notification,
        additional_notes: employeeData.additional_notes || null,
      }])
      .select('id, email, role, first_name, last_name, date_of_birth, job_title, cell_phone, send_text_notification, additional_notes, created_at, updated_at')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create employee');
    return data;
  },

  async updateEmployee(id: number, updates: Partial<{
    email: string;
    role: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    job_title: string;
    cell_phone: string;
    send_text_notification: boolean;
    additional_notes?: string;
  }>): Promise<Employee> {
    await ensureValidSession();
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select('id, email, role, first_name, last_name, date_of_birth, job_title, cell_phone, send_text_notification, additional_notes, created_at, updated_at')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Employee not found');
    return data;
  },

  async deleteEmployee(id: number): Promise<void> {
    await ensureValidSession();
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCurrentUserEmployee(): Promise<Employee | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return null;

    const { data, error } = await supabase
      .from('employees')
      .select('id, email, role, first_name, last_name, date_of_birth, job_title, cell_phone, send_text_notification, additional_notes, created_at, updated_at')
      .eq('email', session.user.email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Function to get employee by email without authentication (for password reset email)
  async getEmployeeByEmailNoAuth(email: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('id, email, role, first_name, last_name, date_of_birth, job_title, cell_phone, send_text_notification, additional_notes, created_at, updated_at')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
