import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Toast from "./Toast";
import SearchableSelect from "./SearchableSelect";
import Select from "./Select";
import { credentialsService, type Credential } from "../lib/credentialsService";
import { fetchCountries, fetchCities, type Country, type City } from "../lib/geoService";
import { storageService } from "../lib/storageService";
import type { CredentialType } from "../lib/CredentialType";
import { FiArrowLeft, FiUpload, FiPlus, FiX } from "react-icons/fi";

const AddCredentials = () => {
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're editing an existing credential
  const existingCredential = location.state as Credential | null;

  // Country and City API states
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Entity options for dropdown
  const [entityOptions, setEntityOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  // Owner type: individual or company
  const [ownerType] = useState<string>(existingCredential?.type || 'individual');

  const [imagePreview, setImagePreview] = useState("");

  // Dynamic credential types from DB (shared)
  const [credentialTypes, setCredentialTypes] = useState<CredentialType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [showNewCertTypeModal, setShowNewCertTypeModal] = useState(false);
  const [newCertType, setNewCertType] = useState('');

  const [formData, setFormData] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    if (existingCredential) {
      return {
        credentialOwner: existingCredential.entity || "",
        credential_number: existingCredential.credential_number || "",
        date_of_issue: existingCredential.date_of_issue || today,
        issuingInstitution: existingCredential.issuing_institution || "",
        country: existingCredential.country || "",
        credentialType: existingCredential.name || "",
        credentialExpire: existingCredential.credential_expire || "",
        expiry_date: existingCredential.expiry_date || "",
        city: existingCredential.city || "",
        additional_notes: existingCredential.additional_notes || "",
        imageFile: null as File | null,
        imageUrl: existingCredential.imageUrl || "",
      };
    }
    return {
      credentialOwner: "",
      credential_number: "",
      date_of_issue: today,
      issuingInstitution: "",
      country: "",
      credentialType: "",
      credentialExpire: "",
      expiry_date: "",
      city: "",
      additional_notes: "",
      imageFile: null as File | null,
      imageUrl: "",
    };
  });

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, imageFile: file, imageUrl: '' }));
    setImagePreview(previewUrl);
  } else {
    alert('Please select JPG/PNG image under 5MB');
  }
};

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEntitySelect = async (selectedEntity: string) => {
    try {
      const data = await credentialsService.getEntitiesWithLatestCredentialsByType(ownerType);
      const selectedEntityData = data.find(item => item.entity === selectedEntity);
      if (selectedEntityData) {
        const credential = selectedEntityData.latestCredential;
        setFormData(prev => ({
          ...prev,
          credentialOwner: credential.entity || "",
          credential_number: credential.credential_number || "",
          date_of_issue: credential.date_of_issue || prev.date_of_issue,
          issuingInstitution: credential.issuing_institution || "",
          country: credential.country || "",
          credentialType: credential.name || "",
          credentialExpire: credential.credential_expire || "",
          expiry_date: credential.expiry_date || "",
          city: credential.city || "",
          additional_notes: credential.additional_notes || "",
          imageUrl: credential.image_url || "",
        }));
      }
    } catch (error) {
      console.error('Error fetching entity data:', error);
    }
  };

  const handleSaveCredentials = async () => {
    try {
      // Check if required fields are filled
      if (!formData.credentialOwner || !formData.credentialType) {
        console.error('Missing required fields:', { credentialOwner: formData.credentialOwner, credentialType: formData.credentialType });
        alert('Please fill in all required fields (Credential Owner and Credential Type)');
        return;
      }

      console.log('Form data:', formData);

      // Upload image if present (using storageService)
      let finalImageUrl = formData.imageUrl;
      if (formData.imageFile) {
        try {
          finalImageUrl = await storageService.uploadImage(formData.imageFile!, 'credentials-images');
          console.log('Image uploaded:', finalImageUrl);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          alert('Image upload failed, but credential will be saved without image.');
        }
        if (imagePreview) URL.revokeObjectURL(imagePreview);
      }

      // Truncation now handled in credentialsService - no local truncate needed
      const credentialData = {
        name: formData.credentialType || (existingCredential?.name || "New Credential"),
        entity: formData.credentialOwner || (existingCredential?.entity || "Individual"),
        type: ownerType || (existingCredential?.type || 'individual'),
        status: 'Active' as const,
        expiry_date: formData.expiry_date,
        date_of_issue: formData.date_of_issue,
        credential_number: formData.credential_number,
        issuing_institution: formData.issuingInstitution,
        country: formData.country,
        city: formData.city,
        additional_notes: formData.additional_notes,
        image_url: finalImageUrl,
        credential_expire: formData.credentialExpire,
      };

      if (existingCredential) {
        const credentialId = existingCredential.id || existingCredential._id;
        if (credentialId === undefined) {
          throw new Error('No credential ID available for update');
        }
        console.log('Updating existing credential:', credentialId);
        await credentialsService.updateCredential(credentialId, credentialData);
        console.log('Credential updated successfully');
      } else {
        console.log('Creating new credential');
        await credentialsService.createCredential(credentialData);
        console.log('Credential created successfully');
      }

      // Show success toast
      setShowToast(true);

      // Navigate back to credentials list after a short delay
      setTimeout(() => {
        navigate('/dashboard/credentials');
      }, 1500);
    } catch (error) {
      console.error('Error saving credential:', error);
      alert(`Failed to save credential: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  // Fetch countries on component mount
  useEffect(() => {
    const getCountries = async () => {
      setLoadingCountries(true);
      // setCountryError(null);
      try {
        const data = await fetchCountries();
        setCountries(data);
      } catch (error) {
        console.error('Error fetching countries:', error);
        // setCountryError('Failed to load countries. Please try again later.');
        // Set some default countries as fallback
        setCountries([
          { name: 'Nigeria', code: 'NG' },
          { name: 'United States', code: 'US' },
          { name: 'United Kingdom', code: 'GB' },
          { name: 'Canada', code: 'CA' },
          { name: 'Australia', code: 'AU' },
        ]);
      } finally {
        setLoadingCountries(false);
      }
    };

    getCountries();
  }, []);

  // Fetch cities when country changes
  useEffect(() => {
    const getCities = async () => {
      if (!formData.country) {
        console.log('[AddCredentials] No country selected, clearing cities');
        setCities([]);
        return;
      }

      console.log(`[AddCredentials] Fetching cities for country: "${formData.country}"`);
      setLoadingCities(true);
      try {
        const data = await fetchCities(formData.country);
        console.log(`[AddCredentials] Fetched ${data.length} cities for ${formData.country}`);
        if (data.length === 0) {
          console.warn('[AddCredentials] No cities returned - this may indicate API issues');
        }
        setCities(data);
      } catch (error) {
        console.error('[AddCredentials] Error fetching cities:', error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };

    getCities();
  }, [formData.country]);

  // Load credential types from DB
  useEffect(() => {
    const loadTypes = async () => {
      setLoadingTypes(true);
      try {
        const types = await credentialsService.getCredentialTypes();
        setCredentialTypes(types);
      } catch (error) {
        console.error('Error loading credential types:', error);
      } finally {
        setLoadingTypes(false);
      }
    };
    loadTypes();
  }, []);

  // Handle new cert type submission (DB)
  const handleAddNewCertType = async () => {
    const trimmed = newCertType.trim();
    if (!trimmed || trimmed.length < 2) {
      alert('Please enter a unique certificate type name (min 2 chars)');
      return;
    }

    try {
      const newType = await credentialsService.createCredentialType(trimmed);
      setCredentialTypes(prev => [...prev, newType]);
      setNewCertType('');
      setShowNewCertTypeModal(false);
      setFormData(prev => ({ ...prev, credentialType: trimmed }));
    } catch (error) {
      console.error('Error creating type:', error);
      alert(`Failed to create type: ${(error as Error).message}`);
    }
  };

  // Load entities on mount/ownerType change
  useEffect(() => {
    const getEntities = async () => {
      setLoadingEntities(true);
      try {
        const data = await credentialsService.getEntitiesWithLatestCredentialsByType(ownerType);
        const options = data.map(item => ({
          value: item.entity,
          label: item.entity
        }));
        setEntityOptions(options);
      } catch (error) {
        console.error('Error fetching entities:', error);
        setEntityOptions([]);
      } finally {
        setLoadingEntities(false);
      }
    };

    getEntities();
  }, [ownerType]);
  const fieldClass = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";
  const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="w-full relative">
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast message="Credential saved successfully" type="success" onClose={() => setShowToast(false)} />
        </div>
      )}

      {/* New Certificate Type Modal */}
      {showNewCertTypeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">New Certificate Type</h3>
              <button onClick={() => { setShowNewCertTypeModal(false); setNewCertType(''); }} className="w-7 h-7 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-400 hover:text-gray-700 transition-colors">
                <FiX size={15} />
              </button>
            </div>
            <input
              type="text"
              value={newCertType}
              onChange={(e) => setNewCertType(e.target.value)}
              placeholder="e.g. Safety Certificate"
              className={fieldClass}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button onClick={handleAddNewCertType} disabled={!newCertType.trim()}
                className="flex-1 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Add Type
              </button>
              <button onClick={() => { setShowNewCertTypeModal(false); setNewCertType(''); }}
                className="flex-1 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/credentials')}
            className="w-8 h-8 rounded-lg border border-gray-200 grid place-items-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors shrink-0">
            <FiArrowLeft size={15} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {existingCredential ? 'Edit Credential' : 'Add New Credential'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {existingCredential ? 'Update the details below' : 'Fill in the details to create a new credential record'}
            </p>
          </div>
        </div>

        {/* Section 1 — Credential Identity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3.5 border-b border-gray-100 rounded-t-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credential Identity</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Owner */}
            <div className="md:col-span-2">
              <label className={labelClass}>Credential Owner <span className="text-red-400 normal-case">*</span></label>
              <SearchableSelect
                name="credentialOwner"
                value={formData.credentialOwner}
                onChange={async (e) => { handleInputChange(e); if (e.target.value) await handleEntitySelect(e.target.value); }}
                options={entityOptions}
                placeholder={loadingEntities ? "Loading owners…" : "Select or enter owner name"}
                disabled={loadingEntities}
                loading={loadingEntities}
              />
              <button className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
                <FiPlus size={12} /> Create new owner
              </button>
            </div>

            {/* Credential Type */}
            <div>
              <label className={labelClass}>Credential Type <span className="text-red-400 normal-case">*</span></label>
              <Select
                value={formData.credentialType}
                onChange={val => setFormData(prev => ({ ...prev, credentialType: val }))}
                options={credentialTypes.map(ct => ({ value: ct.name, label: ct.name }))}
                placeholder="Select type"
                loading={loadingTypes}
                searchable={credentialTypes.length > 6}
              />
              <button type="button" onClick={() => setShowNewCertTypeModal(true)}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
                <FiPlus size={12} /> Add new certificate type
              </button>
            </div>

            {/* Credential Number */}
            <div>
              <label className={labelClass}>Credential Number</label>
              <input type="text" name="credential_number" value={formData.credential_number} onChange={handleInputChange}
                placeholder="e.g. CERT-20240001" className={fieldClass} />
            </div>
          </div>
        </div>

        {/* Section 2 — Dates */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3.5 border-b border-gray-100 rounded-t-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Date of Issue <span className="text-red-400 normal-case">*</span></label>
              <input type="date" name="date_of_issue" value={formData.date_of_issue} onChange={handleInputChange} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Expiry Date <span className="text-red-400 normal-case">*</span></label>
              <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Does it expire?</label>
              <Select
                value={formData.credentialExpire}
                onChange={val => setFormData(prev => ({ ...prev, credentialExpire: val }))}
                options={[
                  { value: 'Yes', label: 'Yes' },
                  { value: 'No',  label: 'No'  },
                ]}
                placeholder="Select"
              />
            </div>
          </div>
        </div>

        {/* Section 3 — Issuer & Location */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3.5 border-b border-gray-100 rounded-t-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Issuer & Location</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Issuing Institution</label>
              <Select
                value={formData.issuingInstitution}
                onChange={val => setFormData(prev => ({ ...prev, issuingInstitution: val }))}
                options={[
                  { value: 'Osun State University',            label: 'Osun State University'            },
                  { value: 'Lagos State University',           label: 'Lagos State University'           },
                  { value: 'University of Ibadan',             label: 'University of Ibadan'             },
                  { value: 'Federal University of Agriculture', label: 'Federal University of Agriculture' },
                  { value: 'Fuyoe',                            label: 'Fuyoe'                            },
                ]}
                placeholder="Select institution"
              />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <Select
                value={formData.country}
                onChange={val => setFormData(prev => ({ ...prev, country: val, city: '' }))}
                options={countries.map(c => ({ value: c.name, label: c.name }))}
                placeholder="Select country"
                loading={loadingCountries}
                searchable
              />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <Select
                value={formData.city}
                onChange={val => setFormData(prev => ({ ...prev, city: val }))}
                options={cities.map(c => ({ value: c.name, label: c.name }))}
                placeholder={loadingCities ? 'Loading…' : !formData.country ? 'Select a country first' : 'Select city'}
                loading={loadingCities}
                disabled={!formData.country}
                searchable
              />
            </div>
          </div>
        </div>

        {/* Section 4 — Media & Notes */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3.5 border-b border-gray-100 rounded-t-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Media & Notes</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Image upload */}
            <div>
              <label className={labelClass}>Credential Image</label>
              <div className="relative">
                <div
                  className={`w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${imagePreview ? 'border-gray-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-lg bg-gray-100 grid place-items-center mb-2">
                        <FiUpload size={16} className="text-gray-400" />
                      </div>
                      <p className="text-xs font-medium text-gray-500">Click to upload</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG · max 5MB</p>
                    </>
                  )}
                </div>
                {imagePreview && (
                  <button
                    onClick={() => { setImagePreview(''); setFormData(prev => ({ ...prev, imageFile: null, imageUrl: '' })); const i = document.getElementById('image-upload') as HTMLInputElement; if (i) i.value = ''; }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full grid place-items-center hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <FiX size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Additional Notes</label>
              <textarea
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleInputChange}
                placeholder="Any extra details about this credential…"
                rows={5}
                className={`${fieldClass} resize-none`}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-2">
          <button onClick={() => navigate('/dashboard/credentials')}
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSaveCredentials}
            className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
            {existingCredential ? 'Update Credential' : 'Save Credential'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCredentials;