import React, { useState, useEffect } from "react";
import { employeesService, COMPANY_SETTINGS_ID } from "../lib/supabaseService";
import { toast } from "../lib/toast";
import Select from "./Select";
import supabase from "../lib/supabase";
import { fetchCountries, fetchCitiesByState, fetchStates } from "../lib/geoService";
import type { CountryOption as Country, CityOption as City, StateOption as State } from "../lib/geoService";
import { FiBell, FiUsers, FiMail, FiAlertCircle, FiUser, FiLock, FiUpload, FiBriefcase, FiShield, FiCheck, FiX, FiCamera, FiGlobe, FiMapPin, FiBarChart2 } from "react-icons/fi";
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
      toast('Password and personal information updated successfully!');
    } else if (passwordChanged) {
      toast('Password changed successfully!');
    } else if (personalInfoChanged) {
      toast('Personal information updated successfully!');
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
    if (!file.type.startsWith('image/')) { toast('Please select an image file.', 'warning'); return; }
    if (file.size > 3 * 1024 * 1024) { toast('Image must be under 3MB.', 'warning'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const inputCls = "w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all placeholder:text-gray-300";
  const labelCls = "block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide";

  return (
    <div className="space-y-3">

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-900 grid place-items-center shrink-0">
            <FiUser size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-400 mt-0.5">Update your name, email and photo</p>
          </div>
        </div>

        <div className="p-5">
          {/* Avatar — centred on mobile */}
          <div className="flex flex-col items-center gap-3 mb-6 pb-6 border-b border-gray-100 sm:flex-row sm:items-center sm:gap-5">
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            <div className="relative group cursor-pointer shrink-0" onClick={() => document.getElementById('avatar-upload')?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-900 text-white grid place-items-center text-2xl font-bold ring-4 ring-gray-100">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                <FiCamera size={18} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border-2 border-gray-100 rounded-full grid place-items-center shadow-sm">
                <FiCamera size={11} className="text-gray-600" />
              </div>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-base font-bold text-gray-900">
                {[personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ') || 'Your Name'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{personalInfo.email || 'your@email.com'}</p>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2.5">
                <button
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="text-xs font-semibold text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {avatarPreview ? 'Change photo' : 'Upload photo'}
                </button>
                {avatarFile && (
                  <button
                    onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}
                    className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name row — 2 cols even on mobile */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelCls}>First Name</label>
              <input name="firstName" value={personalInfo.firstName} onChange={handlePersonalInfoChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <input name="lastName" value={personalInfo.lastName} onChange={handlePersonalInfoChange} className={inputCls} />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className={labelCls}>Email</label>
              <input name="email" value={personalInfo.email} onChange={handlePersonalInfoChange} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Department</label>
              {!canEdit ? (
                <div className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between">
                  <span className="text-gray-500">{personalInfo.department || '—'}</span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-400"><FiShield size={11} /> Admin only</span>
                </div>
              ) : (
                <input name="department" value={personalInfo.department} onChange={handlePersonalInfoChange} className={inputCls} />
              )}
            </div>

            <div>
              <label className={labelCls}>Role</label>
              <div className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between">
                <span className="font-semibold text-gray-700">{personalInfo.role || '—'}</span>
                <span className="flex items-center gap-1 text-[11px] text-gray-400"><FiShield size={11} /> System managed</span>
              </div>
            </div>
          </div>

          {personalInfoError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs mt-4">
              <FiAlertCircle size={13} className="shrink-0" />{personalInfoError}
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-900 grid place-items-center shrink-0">
            <FiLock size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-400 mt-0.5">Leave blank to keep current password</p>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {passwordError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">
              <FiAlertCircle size={13} className="shrink-0" />{passwordError}
            </div>
          )}
          {[
            { label: 'Current Password',  name: 'oldPassword'     },
            { label: 'New Password',       name: 'newPassword'     },
            { label: 'Confirm Password',   name: 'confirmPassword' },
          ].map(f => (
            <div key={f.name}>
              <label className={labelCls}>{f.label}</label>
              <input
                type="password"
                name={f.name}
                value={(password as any)[f.name]}
                onChange={handlePasswordChange}
                disabled={isChangingPassword}
                placeholder="••••••••"
                className={inputCls + " disabled:opacity-50"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        <button
          onClick={handleCancel}
          className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isChangingPassword || isSaving}
          className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
    country: '',
    state: '',
    city: '',
    description: '',
    logo: null as File | null
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Load company details from Supabase (shared row — all users read the same record)
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);

        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .eq('id', COMPANY_SETTINGS_ID)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCompanyDetails(prev => ({
            ...prev,
            name:        data.company_name    || '',
            industry:    data.industry        || 'Construction',
            website:     data.company_website || '',
            size:        data.company_size    || '1-10',
            country:     data.country         || '',
            state:       data.state           || '',
            city:        data.city            || '',
            description: data.description     || '',
            logo: null,
          }));
          if (data.logo_url) setLogoPreview(data.logo_url);
        }
      } catch (err) {
        console.error('Failed to load company details:', err);
        try {
          const saved = localStorage.getItem('companyDetails');
          if (saved) {
            const parsed = JSON.parse(saved);
            setCompanyDetails(prev => ({ ...prev, ...parsed, logo: null }));
            if (parsed.logo_url) setLogoPreview(parsed.logo_url);
          }
        } catch {}
      }
    };
    load();
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
  // When country changes → fetch states, clear state + city
  useEffect(() => {
    let mounted = true;
    setStates([]);
    setCities([]);

    const countryName = companyDetails.country;
    if (!countryName) return;

    const load = async () => {
      setLoadingStates(true);
      try {
        const list = await fetchStates(countryName);
        if (mounted) setStates(list);
      } catch (err) {
        console.error('Failed to load states for', countryName, err);
      } finally {
        if (mounted) setLoadingStates(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [companyDetails.country]);

  // When state changes → fetch cities for that state, clear city
  useEffect(() => {
    let mounted = true;
    setCities([]);

    const countryName = companyDetails.country;
    const stateName = companyDetails.state;
    if (!countryName || !stateName) return;

    const load = async () => {
      setLoadingCities(true);
      try {
        const list = await fetchCitiesByState(countryName, stateName);
        if (mounted) setCities(list);
      } catch (err) {
        console.error('Failed to load cities for', stateName, err);
      } finally {
        if (mounted) setLoadingCities(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [companyDetails.state]);

  // Create a local preview URL only when a new file is selected.
  // Don't clear logoPreview when logo is null — the saved DB URL should persist.
  useEffect(() => {
    if (!companyDetails.logo) return;
    const url = URL.createObjectURL(companyDetails.logo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
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
        toast('Please upload a PNG or JPG file.', 'warning');
      }
    }
  };

  const handleSave = async () => {
    if (!companyDetails.name.trim()) {
      setSaveError('Company name is required');
      return;
    }

    if (!userId) {
      setSaveError('You must be signed in to save.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    // If a new file was selected, convert it to a base64 data URL so it can
    // be stored directly in Supabase without needing a storage bucket.
    let finalLogoUrl: string | null = logoPreview ?? null;
    if (companyDetails.logo) {
      try {
        finalLogoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(companyDetails.logo!);
        });
        setLogoPreview(finalLogoUrl); // update preview to the persisted data URL
      } catch {
        setSaveError('Failed to process logo image.');
        setIsSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from('company_settings')
      .upsert({
        id:               COMPANY_SETTINGS_ID,
        company_name:     companyDetails.name,
        company_website:  companyDetails.website,
        industry:         companyDetails.industry,
        company_size:     companyDetails.size,
        country:          companyDetails.country,
        state:            companyDetails.state,
        city:             companyDetails.city,
        description:      companyDetails.description,
        logo_url:         finalLogoUrl,
      }, { onConflict: 'id' });

    setIsSaving(false);

    if (error) {
      setSaveError(error.message);
    } else {
      localStorage.setItem('companyDetails', JSON.stringify({
        company_name: companyDetails.name, company_website: companyDetails.website,
        industry: companyDetails.industry, company_size: companyDetails.size,
        country: companyDetails.country, state: companyDetails.state,
        city: companyDetails.city, description: companyDetails.description,
        logo_url: finalLogoUrl,
      }));
      toast('Company details saved successfully!');
    }
  };

  const handleCancel = async () => {
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .eq('id', COMPANY_SETTINGS_ID)
        .maybeSingle();

      if (data) {
        setCompanyDetails(prev => ({
          ...prev,
          name:        data.company_name    || '',
          industry:    data.industry        || 'Construction',
          website:     data.company_website || '',
          size:        data.company_size    || '1-10',
          country:     data.country         || '',
          state:       data.state           || '',
          city:        data.city            || '',
          description: data.description     || '',
          logo: null,
        }));
        setLogoPreview(data.logo_url || null);
      }
    } catch {
      try {
        const saved = localStorage.getItem('companyDetails');
        if (saved) {
          const parsed = JSON.parse(saved);
          setCompanyDetails(prev => ({ ...prev, ...parsed, logo: null }));
          setLogoPreview(parsed.logo_url || null);
        }
      } catch {}
    }
  };

  const { canEdit } = useUserRole();

  const sizeLabelMap: Record<string, string> = {
    '1-10': '1 – 10 employees', '11-50': '11 – 50 employees',
    '51-200': '51 – 200 employees', '201-500': '201 – 500 employees', '500+': '500+ employees',
  };

  // ── View-only profile card (Viewer / Employee) ──────────────────────────────
  if (!canEdit) {
    const locationParts = [companyDetails.city, companyDetails.state].filter(Boolean);
    return (
      <div className="space-y-3">

        {/* Hero header */}
        <div className="bg-gray-900 rounded-2xl px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
            {logoPreview
              ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              : <FiBriefcase size={22} className="text-white/60" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white leading-tight truncate">
              {companyDetails.name || <span className="text-white/40">No company name</span>}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {[companyDetails.industry, sizeLabelMap[companyDetails.size] ?? companyDetails.size].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className="text-xs font-semibold text-white/50 bg-white/10 px-3 py-1.5 rounded-full shrink-0">
            View Only
          </span>
        </div>

        {/* Info rows */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {companyDetails.website && (
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <FiGlobe size={14} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Website</p>
                <a href={companyDetails.website} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline underline-offset-2">
                  {companyDetails.website}
                </a>
              </div>
            </div>
          )}
          {companyDetails.industry && (
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <FiBarChart2 size={14} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Industry</p>
                <p className="text-sm font-medium text-gray-800">{companyDetails.industry}</p>
              </div>
            </div>
          )}
          {companyDetails.size && (
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <FiUsers size={14} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Company Size</p>
                <p className="text-sm font-medium text-gray-800">{sizeLabelMap[companyDetails.size] ?? companyDetails.size}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <FiMapPin size={14} className="text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
              {(companyDetails.city || companyDetails.state || companyDetails.country) ? (
                <p className="text-sm font-medium text-gray-800">
                  {locationParts.length > 0 && <span>{locationParts.join(', ')}</span>}
                  {companyDetails.country && (
                    <span className="text-blue-600 font-semibold">
                      {locationParts.length > 0 ? ', ' : ''}{companyDetails.country}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-blue-50/70 rounded-2xl border border-blue-100 px-5 py-4">
          <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mb-2">About</p>
          {companyDetails.description
            ? <p className="text-sm text-blue-700 leading-relaxed">{companyDetails.description}</p>
            : <p className="text-sm text-blue-300">No description provided</p>
          }
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/8 transition-all placeholder-gray-300";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* ── Card header ── */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-900 grid place-items-center shrink-0">
            <FiBriefcase size={15} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Company Details</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage your organisation profile</p>
          </div>
        </div>

        <div className="p-6 space-y-7">

          {/* ── Identity: logo + name + website ── */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Identity</p>
            <div className="flex items-start gap-5">

              {/* Logo avatar */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <div
                  className={`w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors relative group ${
                    isDragOver ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input id="logo-upload" type="file" accept="image/png,image/jpeg" onChange={handleFileChange} className="hidden" />
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain rounded-2xl" />
                      <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <FiCamera size={16} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <FiUpload size={18} className="text-gray-300" />
                      <span className="text-[10px] text-gray-400 font-medium">Logo</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">PNG / JPG</span>
              </div>

              {/* Name + website */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Company Name</label>
                  <input name="name" value={companyDetails.name} onChange={handleChange} placeholder="Acme Inc." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Website</label>
                  <input name="website" value={companyDetails.website} onChange={handleChange} placeholder="https://acme.com" className={inputCls} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Organisation ── */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Organisation</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Industry</label>
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
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Company Size</label>
                <Select
                  value={companyDetails.size}
                  onChange={val => setCompanyDetails(prev => ({ ...prev, size: val }))}
                  options={[
                    { value: '1-10',    label: '1 – 10'    },
                    { value: '11-50',   label: '11 – 50'   },
                    { value: '51-200',  label: '51 – 200'  },
                    { value: '201-500', label: '201 – 500' },
                    { value: '500+',    label: '500+'      },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* ── Location ── */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Location</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Country</label>
                <Select
                  value={companyDetails.country}
                  onChange={val => setCompanyDetails(prev => ({ ...prev, country: val, state: '', city: '' }))}
                  options={countries.map(c => ({ value: c.name, label: c.name }))}
                  placeholder="Select country"
                  loading={loadingCountries}
                  searchable
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">State / Province</label>
                <Select
                  value={companyDetails.state}
                  onChange={val => setCompanyDetails(prev => ({ ...prev, state: val, city: '' }))}
                  options={states.map(s => ({ value: s.name, label: s.name }))}
                  placeholder={companyDetails.country ? 'Select state' : 'Pick country first'}
                  loading={loadingStates}
                  disabled={!companyDetails.country}
                  searchable
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">City</label>
                <Select
                  value={companyDetails.city}
                  onChange={val => setCompanyDetails(prev => ({ ...prev, city: val }))}
                  options={cities.map(ct => ({ value: ct.name, label: ct.name }))}
                  placeholder={companyDetails.state ? 'Select city' : 'Pick state first'}
                  loading={loadingCities}
                  disabled={!companyDetails.state}
                  searchable
                />
              </div>
            </div>
          </div>

          {/* ── About ── */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">About</p>
            <textarea
              name="description"
              value={companyDetails.description}
              onChange={handleChange}
              rows={4}
              placeholder="Briefly describe what your company does…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Error */}
          {saveError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              <FiAlertCircle size={14} className="shrink-0" />{saveError}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================== NOTIFICATION PREFERENCE PAGE =====================
export const NotificationPreferencePage = () => {
  const { isAdmin, role } = useUserRole();
  const [frequency, setFrequency] = useState('30 days before');
  const [enforceForAll, setEnforceForAll] = useState(false);
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
                setFrequency(d.frequency || '30 days before');
                setEnforceForAll(!!d.enforceForAll);
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
            setFrequency(parsed.frequency || '30 days before');
            setEnforceForAll(!!parsed.enforceForAll);
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



  const handleToggle = (key: keyof typeof toggles) => {
    setToggles({ ...toggles, [key]: !toggles[key] });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast('Please log in to save preferences.', 'warning');
        setIsSaving(false);
        return;
      }

      const preferencesData = {
        frequency,
        enforceForAll,
        ...toggles,
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
      
      toast('Notification preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast('Failed to save notification preferences. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reusable toggle switch
  const Toggle = ({ active, onToggle, disabled = false }: { active: boolean; onToggle: () => void; disabled?: boolean }) => (
    <button
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 focus:outline-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${active ? 'bg-blue-500' : 'bg-gray-200'}`}
    >
      <span className={`block w-4.5 h-4.5 bg-white rounded-full absolute top-[3px] transition-transform shadow-sm ${active ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
    </button>
  );

  // Card header shared by both views
  const roleLabel   = isAdmin ? 'Admin'    : (role ?? 'Employee');
  const roleBadgeCls = isAdmin
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-gray-100 text-gray-500 border border-gray-200';

  const CardHeader = () => (
    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-900 grid place-items-center shrink-0">
          <FiBell size={15} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">Notification Preferences</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isAdmin ? 'Control when and how your team is notified' : 'Control how you receive notifications'}
          </p>
        </div>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${roleBadgeCls}`}>
        {roleLabel}
      </span>
    </div>
  );

  // ── ADMIN VIEW ────────────────────────────────────────────────────────────────
  if (isAdmin) {
    const adminItems = [
      { key: 'emailNotifications' as keyof typeof toggles, icon: FiMail,       title: 'Email Notifications',   desc: 'Alerts about credential updates, expiries, and system events.' },
      { key: 'employeeUpdates'    as keyof typeof toggles, icon: FiUsers,       title: 'Employee Updates',      desc: 'Changes to employee accounts, roles, or activities.' },
      { key: 'expirySummary'      as keyof typeof toggles, icon: FiBell,        title: 'Expiry Summary Emails', desc: 'Weekly digest of credentials expiring soon.' },
      { key: 'criticalAlerts'     as keyof typeof toggles, icon: FiAlertCircle, title: 'Critical Alerts Only',  desc: 'Only urgent events — expired credentials or failed uploads.' },
    ];

    return (
      <div className="space-y-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <CardHeader />

          {/* Alert timing */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px flex-1 bg-gray-100" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest shrink-0">Alert Timing</p>
              <span className="h-px flex-1 bg-gray-100" />
            </div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Alert me before expiry</label>
            <Select
              value={frequency}
              onChange={val => setFrequency(val)}
              options={[
                { value: '7 days before',  label: '7 days before'  },
                { value: '15 days before', label: '15 days before' },
                { value: '30 days before', label: '30 days before' },
              ]}
            />
            <p className="text-xs text-gray-400 mt-2">This applies to all users in your organisation.</p>
          </div>

          {/* Notification channels */}
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-px flex-1 bg-gray-100" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest shrink-0">Notification Channels</p>
              <span className="h-px flex-1 bg-gray-100" />
            </div>
          </div>
          <div className="divide-y divide-gray-50 px-2 pb-2">
            {adminItems.map(item => {
              const Icon = item.icon;
              const active = toggles[item.key];
              return (
                <div key={item.key} className="flex items-center gap-4 px-4 py-3.5">
                  <div className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 transition-colors ${active ? 'bg-blue-50' : 'bg-gray-100'}`}>
                    <Icon size={15} className={active ? 'text-blue-500' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <Toggle active={active} onToggle={() => handleToggle(item.key)} />
                </div>
              );
            })}
          </div>

          {/* Enforce for all */}
          <div className="px-4 pb-4">
            <div className={`flex items-center gap-4 px-4 py-4 rounded-xl border transition-colors ${enforceForAll ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
              <Toggle active={enforceForAll} onToggle={() => setEnforceForAll(p => !p)} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${enforceForAll ? 'text-amber-800' : 'text-gray-700'}`}>Enforce for all employees</p>
                <p className={`text-xs mt-0.5 leading-relaxed ${enforceForAll ? 'text-amber-600' : 'text-gray-400'}`}>
                  Employees won't be able to change these notification settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={isSaving}
          className="w-full py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {isSaving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    );
  }

  // ── EMPLOYEE / VIEWER VIEW ────────────────────────────────────────────────────
  const userItems = [
    { key: 'emailNotifications' as keyof typeof toggles, icon: FiMail,       title: 'Email Notifications',   desc: 'Receive alerts about your credential updates and expiries.', adminLocked: false },
    { key: 'employeeUpdates'    as keyof typeof toggles, icon: FiUsers,       title: 'Employee Updates',      desc: 'Changes to your account, role, or activity.',               adminLocked: enforceForAll },
    { key: 'expirySummary'      as keyof typeof toggles, icon: FiBell,        title: 'Expiry Summary Emails', desc: 'Weekly digest of your credentials expiring soon.',           adminLocked: false },
    { key: 'criticalAlerts'     as keyof typeof toggles, icon: FiAlertCircle, title: 'Critical Alerts Only',  desc: 'Only urgent events — expired credentials or failed uploads.', adminLocked: false },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <CardHeader />

        {/* Admin-set frequency info card */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 grid place-items-center shrink-0">
              <FiBell size={14} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">Expiry alerts set to <span className="text-gray-900">{frequency}</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Configured by your admin. Contact them to change this.</p>
            </div>
            <FiLock size={13} className="text-gray-300 shrink-0" />
          </div>
        </div>

        {/* User toggles */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-px flex-1 bg-gray-100" />
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest shrink-0">Your Notifications</p>
            <span className="h-px flex-1 bg-gray-100" />
          </div>
        </div>
        <div className="divide-y divide-gray-50 px-2 pb-2">
          {userItems.map(item => {
            const Icon = item.icon;
            const active = toggles[item.key];
            const locked = item.adminLocked;
            return (
              <div key={item.key} className="flex items-center gap-4 px-4 py-3.5">
                <div className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${active && !locked ? 'bg-blue-50' : 'bg-gray-100'}`}>
                  <Icon size={15} className={active && !locked ? 'text-blue-500' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                    {locked && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-md">
                        <FiLock size={9} /> Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
                <Toggle active={active} onToggle={() => !locked && handleToggle(item.key)} disabled={locked} />
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={handleSave} disabled={isSaving}
        className="w-full py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        {isSaving ? 'Saving…' : 'Save Preferences'}
      </button>
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-900 grid place-items-center shrink-0">
            <FiUsers size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Team Members</h2>
            <p className="text-xs text-gray-400 mt-0.5">Assign roles and departments</p>
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
              const roleOptions = [
                { value: 'Admin',    label: 'Admin'    },
                { value: 'Employee', label: 'Employee' },
                { value: 'Viewer',   label: 'Viewer'   },
              ];
              return (
                <div key={emp.id} className="px-5 py-4 hover:bg-gray-50/40 transition-colors">
                  {/* Top row: avatar + name/email + action button */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full grid place-items-center text-sm font-bold shrink-0 ${avatarColor(fullName)}`}>
                      {emp.first_name?.[0]?.toUpperCase()}{emp.last_name?.[0]?.toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
                        {!isEditing && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${roleBadgeColor[emp.role] ?? 'bg-gray-100 text-gray-600'}`}>
                            {emp.role || 'No role'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{emp.email}</p>
                    </div>

                    <div className="shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => saveEdit(emp)} disabled={saving}
                            className="w-9 h-9 rounded-xl bg-gray-900 text-white grid place-items-center hover:bg-black transition-colors disabled:opacity-40">
                            <FiCheck size={14} />
                          </button>
                          <button onClick={cancelEdit}
                            className="w-9 h-9 rounded-xl border border-gray-200 grid place-items-center text-gray-500 hover:bg-gray-50 transition-colors">
                            <FiX size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(emp)}
                          className={`h-9 px-3.5 text-xs font-semibold rounded-xl border transition-colors ${
                            wasSaved
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}>
                          {wasSaved ? 'Saved ✓' : 'Edit'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Edit fields — expand below on all sizes */}
                  {isEditing && (
                    <div className="mt-3 grid grid-cols-2 gap-2 pl-[52px]">
                      <Select
                        value={editValues.role}
                        onChange={val => setEditValues(v => ({ ...v, role: val }))}
                        options={roleOptions}
                      />
                      <input
                        value={editValues.department}
                        onChange={e => setEditValues(v => ({ ...v, department: e.target.value }))}
                        placeholder="Department"
                        className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 transition-colors"
                      />
                    </div>
                  )}
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
    <div className="flex flex-col lg:flex-row gap-6">

      {/* ── Sidebar nav (desktop) / horizontal tabs (mobile) ── */}
      <aside className="lg:w-52 shrink-0">
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Settings</p>
          </div>

          {/* Tab list — vertical on lg, horizontal scroll on mobile */}
          <div className="flex lg:flex-col p-2 gap-1 overflow-x-auto lg:overflow-x-visible scrollbar-none">
            {tabs.map(t => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap w-full transition-all duration-150 ${
                    active
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <span className={`shrink-0 p-1.5 rounded-lg ${active ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <Icon size={13} className={active ? 'text-white' : 'text-gray-500'} />
                  </span>
                  <span className="leading-none">{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* ── Page content ── */}
      <div className="flex-1 min-w-0">
        {renderActivePage()}
      </div>

    </div>
  );
}