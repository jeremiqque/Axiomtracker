import React, { useState, useEffect } from "react";
import { employeesService } from "../lib/supabaseService";
import supabase from "../lib/supabase";
import { fetchCountries, fetchCities } from "../lib/geoService";
import type { Country, City } from "../lib/geoService";

// ===================== ACCOUNT INFORMATION PAGE =====================
export const AccountInformationPage = () => {
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: ''
  });

  useEffect(() => {
      const fetchUserInfo = async () => {
        try {
          const employee = await employeesService.getCurrentUserEmployee();
          if (employee) {
            setPersonalInfo({
              role: employee.role,
              firstName: employee.first_name,
              lastName: employee.last_name,
              email: employee.email,
              department: ''
            });
          } else {
            // if no employee record, use auth metadata or localStorage
            const { data: { user } } = await supabase.auth.getUser();
            const meta = (user?.user_metadata as any) || {};
            setPersonalInfo(prev => ({
              ...prev,
              role: 'User',
              firstName: meta.first_name || prev.firstName,
              lastName: meta.last_name || prev.lastName,
              email: user?.email || prev.email,
            }));
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }
      };
      fetchUserInfo();
  }, []);

  const [password, setPassword] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [personalInfoError, setPersonalInfoError] = useState<string | null>(null);

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword({ ...password, [e.target.name]: e.target.value });
    setPasswordError(null); // Clear error when user types
  };

  const handleSave = async () => {
    let passwordChanged = false;
    let personalInfoChanged = false;

    // Check if password change is requested
    if (password.newPassword || password.confirmPassword || password.oldPassword) {
      // Validate password change
      if (!password.oldPassword) {
        setPasswordError('Old password is required');
        return;
      }
      if (!password.newPassword) {
        setPasswordError('New password is required');
        return;
      }
      if (password.newPassword !== password.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      if (password.newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters long');
        return;
      }

      setIsChangingPassword(true);
      setPasswordError(null);

      try {
        // First, verify the old password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: personalInfo.email,
          password: password.oldPassword,
        });

        if (signInError) {
          setPasswordError('Old password is incorrect');
          setIsChangingPassword(false);
          return;
        }

        // Update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password.newPassword
        });

        if (updateError) {
          setPasswordError('Failed to update password. Please try again.');
          setIsChangingPassword(false);
          return;
        }

        // Clear password fields on success
        setPassword({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        passwordChanged = true;
      } catch (error) {
        console.error('Password change error:', error);
        setPasswordError('An unexpected error occurred. Please try again.');
        setIsChangingPassword(false);
        return;
      } finally {
        setIsChangingPassword(false);
      }
    }

    // Handle personal info updates
    setIsSaving(true);
    setPersonalInfoError(null);

    try {
      // Update Supabase auth user_metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
        }
      });

      if (authError) {
        console.error('Failed to update user metadata:', authError);
        setPersonalInfoError('Failed to update personal information. Please try again.');
        return;
      }

      // Update employees table (create if missing)
      const currentEmployee = await employeesService.getCurrentUserEmployee();
      if (currentEmployee) {
        await employeesService.updateEmployee(currentEmployee.id, {
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
          email: personalInfo.email,
          role: personalInfo.role,
        });
      } else if (personalInfo.email) {
        try {
          await employeesService.createEmployee({
            email: personalInfo.email,
            role: personalInfo.role || 'User',
            first_name: personalInfo.firstName,
            last_name: personalInfo.lastName,
            date_of_birth: '',
            job_title: '',
            cell_phone: '',
            send_text_notification: false,
            additional_notes: '',
          });
        } catch (err) {
          console.error('Failed to create employee record:', err);
        }
      }

      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.firstName = personalInfo.firstName;
      userData.lastName = personalInfo.lastName;
      userData.email = personalInfo.email;
      localStorage.setItem('user', JSON.stringify(userData));

      personalInfoChanged = true;
    } catch (error) {
      console.error('Personal info update error:', error);
      setPersonalInfoError('Failed to update personal information. Please try again.');
    } finally {
      setIsSaving(false);
    }

    // Show success messages
    if (passwordChanged && personalInfoChanged) {
      alert('Password and personal information updated successfully!');
    } else if (passwordChanged) {
      alert('Password changed successfully!');
    } else if (personalInfoChanged) {
      alert('Personal information updated successfully!');
    }
  };

  const handleCancel = () => {
    // Reset to original values by fetching current user data
    const fetchUserRole = async () => {
      try {
        const employee = await employeesService.getCurrentUserEmployee();
        if (employee) {
          setPersonalInfo({
            role: employee.role,
            firstName: employee.first_name,
            lastName: employee.last_name,
            email: employee.email,
            department: ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      }
    };
    fetchUserRole();

    setPassword({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError(null);
    setPersonalInfoError(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#f5f5f5] p-4 md:p-8 flex flex-col">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-300 pb-3">Personal Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              name="firstName"
              value={personalInfo.firstName}
              onChange={handlePersonalInfoChange}
              className="p-3 rounded bg-[#f7f7f7] w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              name="lastName"
              value={personalInfo.lastName}
              onChange={handlePersonalInfoChange}
              className="p-3 rounded bg-[#f7f7f7] w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              value={personalInfo.email}
              onChange={handlePersonalInfoChange}
              className="p-3 rounded bg-[#f7f7f7] w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              value={personalInfo.role}
              onChange={handlePersonalInfoChange}
              className="p-3 rounded bg-[#f7f7f7] w-full"
            >
              <option value="">Select role</option>
              <option value="Admin">Admin</option>
              <option value="Employee">Employee</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              name="department"
              value={personalInfo.department}
              onChange={handlePersonalInfoChange}
              className="p-3 rounded bg-[#f7f7f7] w-full"
            />
          </div>
        </div>

        {personalInfoError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {personalInfoError}
          </div>
        )}

        <h2 className="font-semibold mb-4 border-b border-gray-300 pb-2">Change Password</h2>
        {passwordError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {passwordError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Old Password</label>
            <input
              type="password"
              name="oldPassword"
              value={password.oldPassword}
              onChange={handlePasswordChange}
              className="p-3 rounded bg-[#f7f7f7] w-full"
              disabled={isChangingPassword}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={password.newPassword}
              onChange={handlePasswordChange}
              className="p-3 rounded bg-[#f7f7f7] w-full"
              disabled={isChangingPassword}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={password.confirmPassword}
              onChange={handlePasswordChange}
              className="p-3 rounded bg-[#f7f7f7] w-full"
              disabled={isChangingPassword}
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            disabled={isChangingPassword || isSaving}
            className="bg-white border px-6 py-3 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingPassword || isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={handleCancel} className="bg-white border px-6 py-3 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ===================== COMPANY DETAILS PAGE =====================
export const CompanyDetailsPage = () => {
  const [companyDetails, setCompanyDetails] = useState({
    name: '',
    industry: 'Construction',
    website: '',
    size: '1-10',
    country: 'Select Country',
    city: 'Select City',
    description: '',
    logo: null as File | null
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Load persisted company details from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('companyDetails');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCompanyDetails({ ...companyDetails, ...parsed, logo: null });
      }
    } catch (err) {
      console.error('Failed to load saved company details:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load countries on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingCountries(true);
      try {
        const list = await fetchCountries();
        if (mounted) setCountries(list);
      } catch (err) {
        console.error('Failed to load countries:', err);
      } finally {
        if (mounted) setLoadingCountries(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // When country changes, fetch cities
  useEffect(() => {
    let mounted = true;
    const countryName = companyDetails.country;
    if (!countryName || countryName === 'Select Country') {
      setCities([]);
      return;
    }

    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const list = await fetchCities(countryName);
        if (mounted) setCities(list);
      } catch (err) {
        console.error('Failed to load cities for', countryName, err);
        if (mounted) setCities([]);
      } finally {
        if (mounted) setLoadingCities(false);
      }
    };

    loadCities();
    return () => { mounted = false; };
  }, [companyDetails.country]);

  // Create a preview URL for uploaded logo
  useEffect(() => {
    let url: string | null = null;
    if (companyDetails.logo) {
      url = URL.createObjectURL(companyDetails.logo);
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [companyDetails.logo]);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setCompanyDetails({ ...companyDetails, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCompanyDetails({ ...companyDetails, logo: e.target.files[0] });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        setCompanyDetails({ ...companyDetails, logo: file });
      } else {
        alert('Please upload a PNG or JPG file.');
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Validate required fields
      if (!companyDetails.name.trim()) {
        throw new Error('Company name is required');
      }

      // Dummy save logic - replace with actual API call
      console.log('Saving company details:', companyDetails);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Persist to localStorage so values remain when user navigates away
      try {
        const toSave = { ...companyDetails };
        // Remove logo File when saving to localStorage
        if (toSave.logo) delete (toSave as any).logo;
        localStorage.setItem('companyDetails', JSON.stringify(toSave));
      } catch (err) {
        console.error('Failed to persist company details:', err);
      }

      alert('Company details saved successfully!');
    } catch (error) {
      console.error('Error saving company details:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save company details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCompanyDetails({
      name: '',
      industry: 'Construction',
      website: '',
      size: '1-10',
      country: 'Select Country',
      city: 'Select City',
      description: '',
      logo: null
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#f5f5f5] p-4 md:p-8 flex flex-col">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-300 pb-3">Company Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="flex justify-center mt-10">
            <div>
              <label className="block text-sm font-medium mb-2 text-center">Company Logo</label>
              <div
                className={`border-2 border-dashed rounded-xl h-40 w-full max-w-xs p-4 text-sm transition-colors cursor-pointer ${
                  isDragOver ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => { if (!logoPreview) document.getElementById('logo-upload')?.click(); }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <input id="logo-upload" type="file" accept="image/png,image/jpeg" onChange={handleFileChange} className="hidden" />

                  {/* If a logo is selected, show it inside the box and hide the instructions */}
                  {logoPreview ? (
                    <img src={logoPreview} alt="Company Logo Preview" className="mx-auto w-32 h-32 object-contain" onClick={() => document.getElementById('logo-upload')?.click()} />
                  ) : (
                    <div className="text-center">
                      <p>Drag & drop or click to upload</p>
                      <p className="text-xs mt-1">PNG or JPG files only</p>
                      <div className="mt-2">
                        <button type="button" onClick={() => document.getElementById('logo-upload')?.click()} className="border px-4 py-2 rounded hover:bg-gray-100">Upload</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* When a logo exists show the Upload/Change button below the box */}
              {logoPreview && (
                <div className="mt-3 flex justify-center">
                  <button type="button" onClick={() => document.getElementById('logo-upload')?.click()} className="border px-4 py-2 rounded hover:bg-gray-100">Change Logo</button>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                name="name"
                value={companyDetails.name}
                onChange={handleChange}
                className="p-3 rounded bg-[#f7f7f7] w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Type</label>
              <select
                name="industry"
                value={companyDetails.industry}
                onChange={handleChange}
                className="p-3 rounded bg-[#f7f7f7] w-full"
              >
                <option>Construction</option>
                <option>Technology</option>
                <option>Healthcare</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company Website</label>
              <input
                name="website"
                value={companyDetails.website}
                onChange={handleChange}
                className="p-3 rounded bg-[#f7f7f7] w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Size</label>
              <select
                name="size"
                value={companyDetails.size}
                onChange={handleChange}
                className="p-3 rounded bg-[#f7f7f7] w-full"
              >
                <option>1-10</option>
                <option>11-50</option>
                <option>51-200</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <select
                name="country"
                value={companyDetails.country}
                onChange={(e) => {
                  // Reset city when country changes
                  setCompanyDetails({ ...companyDetails, country: e.target.value, city: 'Select City' });
                }}
                className="p-3 rounded bg-[#f7f7f7] w-full"
              >
                <option>Select Country</option>
                {loadingCountries ? (
                  <option>Loading countries...</option>
                ) : (
                  countries.map((c) => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <select
                name="city"
                value={(companyDetails as any).city || 'Select City'}
                onChange={handleChange}
                className="p-3 rounded bg-[#f7f7f7] w-full"
              >
                <option>Select City</option>
                {loadingCities ? (
                  <option>Loading cities...</option>
                ) : (
                  cities.map((ct) => (
                    <option key={ct.code} value={ct.name}>{ct.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Company Description</label>
          <textarea
            name="description"
            value={companyDetails.description}
            onChange={handleChange}
            className="border border-gray-200 w-full h-40 p-3 rounded bg-white"
          />
        </div>

        {saveError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {saveError}
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-white border px-6 py-3 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={handleCancel} className="bg-white border px-6 py-3 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ===================== NOTIFICATION PREFERENCE PAGE =====================
export const NotificationPreferencePage = () => {
  const [frequency, setFrequency] = useState('7 days before');
  const [toggles, setToggles] = useState({
    emailNotifications: false,
    employeeUpdates: false,
    expirySummary: false,
    criticalAlerts: false
  });
  const [userEmail, setUserEmail] = useState('');

  // Load persisted notification preferences on mount
  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      try {
        // Try to get current user session first
        const { data: { session } } = await supabase.auth.getSession();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

        if (session?.user?.id) {
          try {
            const res = await fetch(`${apiUrl}/api/preferences?userId=${session.user.id}`);
            if (res.ok) {
              const body = await res.json();
              if (body && body.success && body.data && mounted) {
                const d = body.data;
                setFrequency(d.frequency || '7 days before');
                setToggles({
                  emailNotifications: !!d.emailNotifications,
                  employeeUpdates: !!d.employeeUpdates,
                  expirySummary: !!d.expirySummary,
                  criticalAlerts: !!d.criticalAlerts,
                });
                // continue to set up realtime subscription below
                // (do not return here)
              }
            } else {
              console.warn('Failed to fetch preferences from backend, status:', res.status);
            }
          } catch (err) {
            console.error('Error fetching preferences from backend:', err);
          }
        }

        // Fallback to localStorage if backend fetch failed or no session
        try {
          const saved = localStorage.getItem('notificationPreferences');
          if (saved && mounted) {
            const parsed = JSON.parse(saved);
            setFrequency(parsed.frequency || '7 days before');
            setToggles({
              emailNotifications: !!parsed.emailNotifications,
              employeeUpdates: !!parsed.employeeUpdates,
              expirySummary: !!parsed.expirySummary,
              criticalAlerts: !!parsed.criticalAlerts,
            });
          }
        } catch (err) {
          console.error('Failed to load saved notification preferences from localStorage:', err);
        }
      } catch (err) {
        console.error('Error loading notification preferences:', err);
      }
    };

    let prefChannel: any = null;

    const setupRealtime = (userId?: string) => {
      try {
        if (!userId) return;
        prefChannel = supabase
          .channel(`user_preferences:${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'user_preferences', filter: `user_id=eq.${userId}` }, ({ new: row }: any) => {
            if (!row) return;
            // Map DB row to frontend state
            setFrequency(row.frequency || '7 days before');
            setToggles({
              emailNotifications: !!row.email_notifications,
              employeeUpdates: !!row.employee_updates,
              expirySummary: !!row.expiry_summary,
              criticalAlerts: !!row.critical_alerts,
            });
          })
          .subscribe();
        console.log('Subscribed to user_preferences realtime for', userId);
      } catch (e) {
        console.error('Failed to create realtime subscription for preferences:', e);
      }
    };

    const loadUserEmail = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email && mounted) {
          setUserEmail(session.user.email);
          return;
        }
        // Fallback to employees table
        const { employeesService } = await import('../lib/supabaseService');
        const employee = await employeesService.getCurrentUserEmployee();
        if (employee?.email && mounted) {
          setUserEmail(employee.email);
        }
      } catch (err) {
        console.error('Failed to load user email:', err);
      }
    };

    (async () => {
      await loadPreferences();
      await loadUserEmail();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) setupRealtime(session.user.id);
      } catch (e) {
        console.error('Error setting up realtime subscription:', e);
      }
    })();

    return () => {
      mounted = false;
      try {
        if (prefChannel) supabase.removeChannel(prefChannel);
      } catch (e) {
        // fallback: try unsubscribe
        try { prefChannel?.unsubscribe?.(); } catch (err) { /* ignore */ }
      }
    };
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFrequency(e.target.value);
  };

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles({ ...toggles, [key]: !toggles[key] });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        alert('Please log in to save preferences');
        setIsSaving(false);
        return;
      }

      const preferencesData = {
        frequency,
        ...toggles
      };

      // Save to backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          preferences: preferencesData
        })
      });

      if (!response.ok) {
        // Try to read server error payload to surface a helpful message
        let errMsg = `Status ${response.status}`;
        try {
          const txt = await response.text();
          try {
            const json = JSON.parse(txt);
            errMsg = json.error || json.message || JSON.stringify(json);
          } catch {
            if (txt) errMsg = txt;
          }
        } catch (e) {
          // ignore
        }
        throw new Error(errMsg || 'Failed to save preferences');
      }

      // Send confirmation email
      const notifyResponse = await fetch(`${apiUrl}/api/notify-preferences-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          email: userEmail,
          preferences: preferencesData
        })
      });

      if (!notifyResponse.ok) {
        console.warn('Failed to send confirmation email:', await notifyResponse.text());
      }

      // Also persist preferences locally so they are immediately visible when navigating
      localStorage.setItem('notificationPreferences', JSON.stringify(preferencesData));
      
      alert('Notification preferences saved successfully! Confirmation email sent.');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save notification preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f5f5f5] p-4 md:p-8 flex flex-col">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-300 pb-3">Notification Preferences</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Notification Frequency</label>
          <select
            value={frequency}
            onChange={handleFrequencyChange}
            className="p-3 rounded bg-[#f7f7f7] w-full md:w-64"
          >
            <option>7 days before</option>
            <option>15 days before</option>
            <option>30 days before (default)</option>
          </select>
        </div>

        {/* Toggles */}
        <div className="space-y-6">
          {[
            { key: 'emailNotifications' as keyof typeof toggles, title: "Email Notifications", desc: "Receive email alerts about credential updates, expiries, and important system events." },
            { key: 'employeeUpdates' as keyof typeof toggles, title: "Employee updates", desc: "Stay informed about changes made to employee accounts, roles, or activities." },
            { key: 'expirySummary' as keyof typeof toggles, title: "Receive Expiry Summary Emails", desc: "Get a summary email showing all credentials that are expiring soon for easier monitoring." },
            { key: 'criticalAlerts' as keyof typeof toggles, title: "Critical Alerts Only", desc: "Limit notifications to urgent events such as expired credentials or failed uploads." }
          ].map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
              <div
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${toggles[item.key] ? 'bg-black' : 'bg-gray-300'}`}
                onClick={() => handleToggle(item.key)}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${toggles[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-white border px-6 py-3 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================== MAIN SETTINGS COMPONENT =====================
export default function Settings() {
  const [activeTab, setActiveTab] = useState('account');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'account':
        return <AccountInformationPage />;
      case 'company':
        return <CompanyDetailsPage />;
      case 'notification':
        return <NotificationPreferencePage />;
      default:
        return <AccountInformationPage />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f5f5f5] pt-4 pb-8 pl-4 pr-4 md:pt-8 md:pb-12 md:pl-8 md:pr-8 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 overflow-x-auto md:overflow-x-visible bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <button
            className={`pb-3 px-2 whitespace-nowrap font-medium transition-colors ${
              activeTab === 'account'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('account')}
          >
            Account Information
          </button>
          <button
            className={`pb-3 px-2 whitespace-nowrap font-medium transition-colors ${
              activeTab === 'company'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('company')}
          >
            Company Details
          </button>
          <button
            className={`pb-3 px-2 whitespace-nowrap font-medium transition-colors ${
              activeTab === 'notification'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('notification')}
          >
            Notification Preferences
          </button>
        </div>
      </div>

      {renderActivePage()}
    </div>
  );
}