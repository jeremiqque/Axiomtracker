import React, { useState, useEffect } from "react";
import { employeesService, companySettingsService } from "../lib/supabaseService";
import Select from "./Select";
import supabase from "../lib/supabase";
import { fetchCountries, fetchCities } from "../lib/geoService";
import type { Country, City } from "../lib/geoService";
import { FiBell, FiUsers, FiMail, FiAlertCircle, FiUser, FiLock, FiUpload, FiBriefcase, FiShield, FiCheck, FiX, FiCamera } from "react-icons/fi";
import { useUserRole } from "../hooks/useUserRole";

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

  const { canEdit } = useUserRole();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const initials = [personalInfo.firstName, personalInfo.lastName]
    .filter(Boolean).map(n => n[0].toUpperCase()).join('') || 'U';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 3 * 1024 * 1024) { alert('Image must be under 3MB.'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-4">

      {/* Personal Information */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 rounded-t-xl">
          <div className="w-7 h-7 rounded-lg bg-gray-100 grid place-items-center">
            <FiUser size={14} className="text-gray-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-400">Update your profile details</p>
          </div>
        </div>

        <div className="p-6">
          {/* Avatar row */}
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
            {/* Clickable avatar */}
            <div className="relative shrink-0 group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              {/* Avatar circle */}
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-black text-white grid place-items-center text-xl font-semibold ring-2 ring-gray-200">
                  {initials}
                </div>
              )}
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                <FiCamera size={16} className="text-white" />
              </div>
              {/* Small camera badge */}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white border border-gray-200 rounded-full grid place-items-center shadow-sm">
                <FiCamera size={10} className="text-gray-500" />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                {[personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ') || 'Your Name'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{personalInfo.email || 'your@email.com'}</p>
              <button
                onClick={() => document.getElementById('avatar-upload')?.click()}
                className="mt-2 text-xs font-medium text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
              >
                {avatarPreview ? 'Change photo' : 'Upload photo'}
              </button>
              {avatarFile && (
                <button
                  onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}
                  className="ml-3 mt-2 text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'First Name', name: 'firstName' },
              { label: 'Last Name',  name: 'lastName'  },
              { label: 'Email',      name: 'email'     },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                <input
                  name={f.name}
                  value={(personalInfo as any)[f.name]}
                  onChange={handlePersonalInfoChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            ))}

            {/* Department — read-only for non-admins */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Department</label>
              {!canEdit ? (
                <div className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between">
                  <span className="text-gray-500">{personalInfo.department || '—'}</span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <FiShield size={12} />
                    Managed by admin
                  </div>
                </div>
              ) : (
                <input
                  name="department"
                  value={personalInfo.department}
                  onChange={handlePersonalInfoChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Role</label>
              <div className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between">
                <span className="text-gray-600 font-medium">{personalInfo.role || '—'}</span>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <FiShield size={12} />
                  Managed from backend
                </div>
              </div>
            </div>
          </div>

          {personalInfoError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm mb-4">
              <FiAlertCircle size={14} className="shrink-0" />
              {personalInfoError}
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 rounded-t-xl">
          <div className="w-7 h-7 rounded-lg bg-gray-100 grid place-items-center">
            <FiLock size={14} className="text-gray-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-400">Leave blank if you don't want to change it</p>
          </div>
        </div>

        <div className="p-6">
          {passwordError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm mb-4">
              <FiAlertCircle size={14} className="shrink-0" />
              {passwordError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Current Password',  name: 'oldPassword'     },
              { label: 'New Password',       name: 'newPassword'     },
              { label: 'Confirm Password',   name: 'confirmPassword' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                <input
                  type="password"
                  name={f.name}
                  value={(password as any)[f.name]}
                  onChange={handlePasswordChange}
                  disabled={isChangingPassword}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors disabled:opacity-50"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          onClick={handleCancel}
          className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isChangingPassword || isSaving}
          className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isChangingPassword || isSaving ? 'Saving…' : 'Save Changes'}
        </button>
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

  // Load company details from Supabase so all users see the same data
  useEffect(() => {
    const load = async () => {
      try {
        const data = await companySettingsService.get();
        if (data) {
          setCompanyDetails(prev => ({
            ...prev,
            name: data.name || '',
            industry: data.industry || 'Construction',
            website: data.website || '',
            size: data.size || '1-10',
            country: data.country || 'Select Country',
            city: data.city || 'Select City',
            description: data.description || '',
            logo: null,
          }));
          if (data.logo_url) setLogoPreview(data.logo_url);
        }
      } catch (err) {
        console.error('Failed to load company details:', err);
        // fallback to localStorage if Supabase unavailable
        try {
          const saved = localStorage.getItem('companyDetails');
          if (saved) {
            const parsed = JSON.parse(saved);
            setCompanyDetails(prev => ({ ...prev, ...parsed, logo: null }));
          }
        } catch {}
      }
    };
    load();
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

      // Save to Supabase so all users see the updated values
      await companySettingsService.upsert({
        name: companyDetails.name,
        industry: companyDetails.industry,
        website: companyDetails.website,
        size: companyDetails.size,
        country: companyDetails.country,
        city: companyDetails.city,
        description: companyDetails.description,
        logo_url: logoPreview && !companyDetails.logo ? logoPreview : null,
      });

      alert('Company details saved successfully!');
    } catch (error) {
      console.error('Error saving company details:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save company details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      const data = await companySettingsService.get();
      if (data) {
        setCompanyDetails(prev => ({
          ...prev,
          name: data.name || '',
          industry: data.industry || 'Construction',
          website: data.website || '',
          size: data.size || '1-10',
          country: data.country || 'Select Country',
          city: data.city || 'Select City',
          description: data.description || '',
          logo: null,
        }));
        setLogoPreview(data.logo_url || null);
      }
    } catch {
      // ignore
    }
  };

  const { canEdit } = useUserRole();

  const readonlyField = (label: string, value: string) => (
    <div key={label}>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <div className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
        {value || <span className="text-gray-400">—</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Logo + Company fields */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gray-100 grid place-items-center">
              <FiBriefcase size={14} className="text-gray-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Company Details</h2>
              <p className="text-xs text-gray-400">
                {canEdit ? 'Manage your organisation profile' : 'View-only — contact an admin to make changes'}
              </p>
            </div>
          </div>
          {!canEdit && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg">
              <FiShield size={11} />
              View only
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide self-start">Company Logo</label>
              {canEdit ? (
                <>
                  <div
                    className={`w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      isDragOver ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => { if (!logoPreview) document.getElementById('logo-upload')?.click(); }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input id="logo-upload" type="file" accept="image/png,image/jpeg" onChange={handleFileChange} className="hidden" />
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-20 h-20 object-contain" onClick={() => document.getElementById('logo-upload')?.click()} />
                    ) : (
                      <>
                        <FiUpload size={20} className="text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400">Drag & drop or click</p>
                        <p className="text-[11px] text-gray-300 mt-0.5">PNG or JPG</p>
                      </>
                    )}
                  </div>
                  {logoPreview && (
                    <button type="button" onClick={() => document.getElementById('logo-upload')?.click()} className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors">
                      Change logo
                    </button>
                  )}
                </>
              ) : (
                <div className="w-full h-36 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" className="w-20 h-20 object-contain" />
                    : <p className="text-xs text-gray-400">No logo uploaded</p>
                  }
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {canEdit ? (
                <>
                  {[
                    { label: 'Company Name',    name: 'name',    placeholder: 'Acme Inc.' },
                    { label: 'Company Website', name: 'website', placeholder: 'https://acme.com' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                      <input name={f.name} value={(companyDetails as any)[f.name]} onChange={handleChange} placeholder={f.placeholder}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Industry</label>
                    <Select
                      value={companyDetails.industry}
                      onChange={val => setCompanyDetails(prev => ({ ...prev, industry: val }))}
                      options={[
                        { value: 'Construction', label: 'Construction' },
                        { value: 'Technology',   label: 'Technology'   },
                        { value: 'Healthcare',   label: 'Healthcare'   },
                        { value: 'Education',    label: 'Education'    },
                        { value: 'Finance',      label: 'Finance'      },
                        { value: 'Other',        label: 'Other'        },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Company Size</label>
                    <Select
                      value={companyDetails.size}
                      onChange={val => setCompanyDetails(prev => ({ ...prev, size: val }))}
                      options={[
                        { value: '1-10',     label: '1 – 10'      },
                        { value: '11-50',    label: '11 – 50'     },
                        { value: '51-200',   label: '51 – 200'    },
                        { value: '201-500',  label: '201 – 500'   },
                        { value: '500+',     label: '500+'        },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Country</label>
                    <Select
                      value={companyDetails.country === 'Select Country' ? '' : companyDetails.country}
                      onChange={val => setCompanyDetails(prev => ({ ...prev, country: val, city: '' }))}
                      options={countries.map(c => ({ value: c.name, label: c.name }))}
                      placeholder="Select Country"
                      loading={loadingCountries}
                      searchable
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">City</label>
                    <Select
                      value={(companyDetails as any).city === 'Select City' ? '' : ((companyDetails as any).city || '')}
                      onChange={val => setCompanyDetails(prev => ({ ...prev, city: val }))}
                      options={cities.map(ct => ({ value: ct.name, label: ct.name }))}
                      placeholder="Select City"
                      loading={loadingCities}
                      disabled={!companyDetails.country || companyDetails.country === 'Select Country'}
                      searchable
                    />
                  </div>
                </>
              ) : (
                <>
                  {readonlyField('Company Name', companyDetails.name)}
                  {readonlyField('Company Website', companyDetails.website)}
                  {readonlyField('Industry', companyDetails.industry)}
                  {readonlyField('Company Size', companyDetails.size)}
                  {readonlyField('Country', companyDetails.country !== 'Select Country' ? companyDetails.country : '')}
                  {readonlyField('City', (companyDetails as any).city !== 'Select City' ? (companyDetails as any).city : '')}
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Company Description</label>
            {canEdit ? (
              <textarea name="description" value={companyDetails.description} onChange={handleChange} rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors resize-none" />
            ) : (
              <div className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600 min-h-[96px]">
                {companyDetails.description || <span className="text-gray-400">No description provided</span>}
              </div>
            )}
          </div>

          {saveError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              <FiAlertCircle size={14} className="shrink-0" />{saveError}
            </div>
          )}
        </div>
      </div>

      {/* Actions — only visible to admin */}
      {canEdit && (
        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={handleCancel} className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
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

  const notifItems = [
    { key: 'emailNotifications' as keyof typeof toggles, icon: FiMail,        title: 'Email Notifications',       desc: 'Alerts about credential updates, expiries, and system events.' },
    { key: 'employeeUpdates'    as keyof typeof toggles, icon: FiUsers,        title: 'Employee Updates',          desc: 'Changes to employee accounts, roles, or activities.' },
    { key: 'expirySummary'      as keyof typeof toggles, icon: FiBell,         title: 'Expiry Summary Emails',     desc: 'Weekly digest of credentials expiring soon.' },
    { key: 'criticalAlerts'     as keyof typeof toggles, icon: FiAlertCircle,  title: 'Critical Alerts Only',      desc: 'Only urgent events — expired credentials or failed uploads.' },
  ];

  return (
    <div className="space-y-4">

      {/* Frequency */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 rounded-t-xl rounded-t-xl">
          <div className="w-7 h-7 rounded-lg bg-gray-100 grid place-items-center">
            <FiBell size={14} className="text-gray-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Notification Preferences</h2>
            <p className="text-xs text-gray-400">Control when and how you are notified</p>
          </div>
        </div>

        <div className="p-6">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Alert me before expiry</label>
          <div className="w-full md:w-56">
            <Select
              value={frequency}
              onChange={val => handleFrequencyChange({ target: { value: val } } as any)}
              options={[
                { value: '7 days before',            label: '7 days before'            },
                { value: '15 days before',           label: '15 days before'           },
                { value: '30 days before (default)', label: '30 days before (default)' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Toggle rows */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {notifItems.map((item) => {
          const Icon = item.icon;
          const active = toggles[item.key];
          return (
            <div key={item.key} className="flex items-center gap-4 px-6 py-4">
              <div className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 transition-colors ${active ? 'bg-black' : 'bg-gray-100'}`}>
                <Icon size={14} className={active ? 'text-white' : 'text-gray-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              {/* Toggle */}
              <button
                role="switch"
                aria-checked={active}
                onClick={() => handleToggle(item.key)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 focus:outline-none ${active ? 'bg-black' : 'bg-gray-200'}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end pt-1">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// ===================== USER MANAGEMENT PAGE (Admin only) =====================
export const UserManagementPage = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ role: string; department: string }>({ role: '', department: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await employeesService.listEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Failed to load employees:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const startEdit = (emp: any) => {
    setEditingId(emp.id);
    setEditValues({ role: emp.role || '', department: emp.department || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ role: '', department: '' });
  };

  const saveEdit = async (emp: any) => {
    setSaving(true);
    try {
      await employeesService.updateEmployee(emp.id, {
        role: editValues.role,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
      });
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, role: editValues.role, department: editValues.department } : e));
      setSaved(emp.id);
      setTimeout(() => setSaved(null), 2000);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update employee:', err);
    } finally {
      setSaving(false);
    }
  };

  const roleBadgeColor: Record<string, string> = {
    Admin:    'bg-gray-900 text-white',
    Employee: 'bg-blue-50 text-blue-700',
    Viewer:   'bg-purple-50 text-purple-700',
    User:     'bg-gray-100 text-gray-600',
  };

  const avatarColor = (name: string) => {
    const colors = ['bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-purple-100 text-purple-700','bg-rose-100 text-rose-700'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 gap-1.5">
        {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 rounded-t-xl">
          <div className="w-7 h-7 rounded-lg bg-gray-100 grid place-items-center">
            <FiUsers size={14} className="text-gray-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Team Members</h2>
            <p className="text-xs text-gray-400">Assign roles and departments to your team</p>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 grid place-items-center text-gray-300">○</div>
            <p className="text-sm text-gray-400">No team members found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {employees.map(emp => {
              const fullName = `${emp.first_name} ${emp.last_name}`;
              const isEditing = editingId === emp.id;
              const wasSaved = saved === emp.id;
              return (
                <div key={emp.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full grid place-items-center text-xs font-semibold shrink-0 ${avatarColor(fullName)}`}>
                    {emp.first_name?.[0]?.toUpperCase()}{emp.last_name?.[0]?.toUpperCase()}
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                  </div>

                  {/* Role */}
                  <div className="w-36 shrink-0">
                    {isEditing ? (
                      <Select
                        value={editValues.role}
                        onChange={val => setEditValues(v => ({ ...v, role: val }))}
                        options={[
                          { value: 'Admin',    label: 'Admin'    },
                          { value: 'Employee', label: 'Employee' },
                          { value: 'Viewer',   label: 'Viewer'   },
                        ]}
                      />
                    ) : (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadgeColor[emp.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {emp.role || 'No role'}
                      </span>
                    )}
                  </div>

                  {/* Department */}
                  <div className="w-36 shrink-0 hidden md:block">
                    {isEditing ? (
                      <input
                        value={editValues.department}
                        onChange={e => setEditValues(v => ({ ...v, department: e.target.value }))}
                        placeholder="e.g. Engineering"
                        className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">{emp.department || '—'}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(emp)}
                          disabled={saving}
                          className="w-8 h-8 rounded-lg bg-black text-white grid place-items-center hover:bg-gray-800 transition-colors disabled:opacity-40"
                        >
                          <FiCheck size={13} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="w-8 h-8 rounded-lg border border-gray-200 grid place-items-center text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          <FiX size={13} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(emp)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          wasSaved
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {wasSaved ? 'Saved ✓' : 'Edit'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ===================== MAIN SETTINGS COMPONENT =====================
export default function Settings() {
  const [activeTab, setActiveTab] = useState('account');
  const { canEdit } = useUserRole();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'account':      return <AccountInformationPage />;
      case 'company':      return <CompanyDetailsPage />;
      case 'notification': return <NotificationPreferencePage />;
      case 'team':         return <UserManagementPage />;
      default:             return <AccountInformationPage />;
    }
  };

  const tabs = [
    { id: 'account',      label: 'Account',       icon: FiUser,      adminOnly: false },
    { id: 'company',      label: 'Company',        icon: FiBriefcase, adminOnly: false },
    { id: 'notification', label: 'Notifications',  icon: FiBell,      adminOnly: false },
    { id: 'team',         label: 'Team',           icon: FiUsers,     adminOnly: true  },
  ].filter(t => !t.adminOnly || canEdit);

  return (
    <div className="space-y-6">

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {renderActivePage()}
    </div>
  );
}