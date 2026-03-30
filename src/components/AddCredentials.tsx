import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Toast from "./Toast";
import SearchableSelect from "./SearchableSelect";
import { credentialsService, type Credential } from "../lib/credentialsService";
import { fetchCountries, fetchCities, type Country, type City } from "../lib/geoService";
import { storageService } from "../lib/storageService";
import type { CredentialType } from "../lib/CredentialType";

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
  return (
    <div className="w-full">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast
            message="Success credential saved successfully"
            type="success"
            onClose={() => setShowToast(false)}
          />
        </div>
      )}

      <div className="bg-white min-h-screen p-4 md:p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Add New Credentials/Individual</h2>
          <p className="text-gray-600 text-sm mt-2">Fill in the details below to add a new credential or individual</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Credential Owner */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Credential Owner *</label>
                <div className="mb-2">
                </div>

                <SearchableSelect
                  name="credentialOwner"
                  value={formData.credentialOwner}
                  onChange={async (e) => {
                    handleInputChange(e);
                    if (e.target.value) {
                      await handleEntitySelect(e.target.value);
                    }
                  }}
                  options={entityOptions}
                  placeholder={loadingEntities ? "Loading owners..." : "Select or enter owner name"}
                  disabled={loadingEntities}
                  loading={loadingEntities}
                />
                <button className="w-full mt-2 text-sm font-medium border border-gray-300 rounded-lg p-2.5 text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                  + Create New Owner
                </button>
              </div>

              {/* Credential Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Credential Type *</label>
                <select
                  name="credentialType"
                  value={formData.credentialType}
                  onChange={handleInputChange}
                  disabled={loadingTypes}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100"
                >
                  <option value="">{loadingTypes ? 'Loading types...' : 'Select Type'}</option>
                  {credentialTypes.map((ctype) => (
                    <option key={ctype.id} value={ctype.name}>{ctype.name}</option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={() => setShowNewCertTypeModal(true)}
                  className="w-full mt-2 text-sm font-medium border border-gray-300 rounded-lg p-2.5 text-gray-700 hover:bg-gray-50 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                   Add New Certificate Type
                </button>
              </div>

              {/* Credential Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Credential Number</label>
                <input
                  type="text"
                  name="credential_number"
                  value={formData.credential_number}
                  onChange={handleInputChange}
                  placeholder="Enter credential number"
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Date of Issue */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Issue *</label>
                <input
                  type="date"
                  name="date_of_issue"
                  value={formData.date_of_issue}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date *</label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* New Certificate Type Modal */}
{showNewCertTypeModal && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-6 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add New Certificate Type</h3>
                    <button
                      onClick={() => { setShowNewCertTypeModal(false); setNewCertType(''); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={newCertType}
                      onChange={(e) => setNewCertType(e.target.value)}
                      placeholder="Enter new certificate type name"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
                      autoFocus
                    />
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleAddNewCertType}
                        disabled={!newCertType.trim()}
                        className="cursor-pointer flex-1 bg-white text-black font-semibold py-2.5 px-4 rounded-lg hover:bg-black hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Type
                      </button>
                      <button
                        onClick={() => { setShowNewCertTypeModal(false); setNewCertType(''); }}
                        className="cursor-pointer flex-1 border border-gray-300 bg-white text-black font-semibold py-2.5 px-4 rounded-lg hover:bg-black hover:text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* Issuing Institute */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Issuing Institution</label>
                <select
                  name="issuingInstitution"
                  value={formData.issuingInstitution}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option>Select Institution</option>
                  <option>Osun State University</option>
                  <option>Lagos State University</option>
                  <option>University of Ibadan</option>
                  <option>Federal University of Agriculture</option>
                  <option>Fuyoe</option>
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  disabled={loadingCountries}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingCountries ? 'Loading countries...' : 'Select Country'}
                  </option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={loadingCities || !formData.country}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingCities ? 'Loading cities...' : !formData.country ? 'Select a country first' : 'Select City'}
                  </option>
                  {cities.map((city) => (
                    <option key={city.code} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Credential Image - Modern UI */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Upload Credential Image</label>
                <div className="relative">
                  <div 
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-center p-6 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <input
                      id="image-upload"
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {!imagePreview ? (
                      <>
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1 group-hover:text-gray-900">Click to upload image</p>
                        <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                      </>
                    ) : (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg shadow-md" />
                    )}
                  </div>
                  {imagePreview && (
                    <button
                      onClick={() => {
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, imageFile: null, imageUrl: '' }));
                        const input = document.getElementById('image-upload') as HTMLInputElement;
                        input && (input.value = '');
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Certificate Expires? */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Credential Expire?</label>
                <select
                  name="credentialExpire"
                  value={formData.credentialExpire}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer"
                >
                  <option>Select Type</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Notes - Full Width */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Additional Notes</label>
            <textarea
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleInputChange}
              placeholder="Enter any additional notes..."
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 bg-white h-32 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            ></textarea>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveCredentials}
              className="flex-1 sm:flex-none border border-gray-300 bg-white text-black font-semibold py-3 px-8 rounded-lg hover:bg-black hover:text-white transition duration-200">
              {existingCredential ? 'Update Credentials' : 'Save Credentials'}
            </button>
            <button
              onClick={() => navigate('/dashboard/credentials')}
              className="flex-1 sm:flex-none border border-gray-300 bg-white text-black font-semibold py-3 px-8 rounded-lg hover:bg-black hover:text-white transition duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCredentials;