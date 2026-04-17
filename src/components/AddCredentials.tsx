import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Toast from "./Toast";
import { toast } from "../lib/toast";
import DatePicker from "./DatePicker";
import SearchableSelect from "./SearchableSelect";
import Select from "./Select";
import { credentialsService, type Credential } from "../lib/credentialsService";
import { employeesService } from "../lib/supabaseService";
import { fetchCountries, fetchCities, type Country, type City } from "../lib/geoService";
import { storageService } from "../lib/storageService";
import { FiArrowLeft, FiUpload, FiX } from "react-icons/fi";

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


  // Employee options for owner dropdown
  const [entityOptions, setEntityOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  // Owner type: individual or company
  const [ownerType] = useState<string>(existingCredential?.type || 'individual');

  const [imagePreview, setImagePreview] = useState("");

  const credentialTypes = [
    { value: 'License',     label: 'License'     },
    { value: 'Certificate', label: 'Certificate' },
  ];

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
    toast('Please select a JPG or PNG image under 5MB.', 'warning');
  }
};

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSaveCredentials = async () => {
    try {
      // Check if required fields are filled
      if (!formData.credentialOwner || !formData.credentialType) {
        console.error('Missing required fields:', { credentialOwner: formData.credentialOwner, credentialType: formData.credentialType });
        toast('Please fill in all required fields (Credential Owner and Credential Type).', 'warning');
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
          toast('Image upload failed, but credential will be saved without image.', 'warning');
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
      toast(`Failed to save credential: ${(error as Error).message || 'Unknown error'}`, 'error');
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

  // Load employees for owner dropdown
  useEffect(() => {
    const getEmployees = async () => {
      setLoadingEntities(true);
      try {
        const employees = await employeesService.listEmployees();
        const options = employees.map(emp => ({
          value: `${emp.first_name} ${emp.last_name}`.trim(),
          label: `${emp.first_name} ${emp.last_name}`.trim(),
        }));
        setEntityOptions(options);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setEntityOptions([]);
      } finally {
        setLoadingEntities(false);
      }
    };

    getEmployees();
  }, []);
  const fieldClass = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";
  const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="w-full relative">
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast message="Credential saved successfully" type="success" onClose={() => setShowToast(false)} />
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
                onChange={(e) => handleInputChange(e)}
                options={entityOptions}
                placeholder={loadingEntities ? "Loading employees…" : "Select employee"}
                disabled={loadingEntities}
                loading={loadingEntities}
              />
            </div>

            {/* Credential Type */}
            <div>
              <label className={labelClass}>Credential Type <span className="text-red-400 normal-case">*</span></label>
              <Select
                value={formData.credentialType}
                onChange={val => setFormData(prev => ({ ...prev, credentialType: val }))}
                options={credentialTypes}
                placeholder="Select type"
              />
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
              <DatePicker
                value={formData.date_of_issue}
                onChange={val => setFormData(prev => ({ ...prev, date_of_issue: val }))}
                placeholder="Select issue date"
              />
            </div>
            <div>
              <label className={labelClass}>Expiry Date <span className="text-red-400 normal-case">*</span></label>
              <DatePicker
                value={formData.expiry_date}
                onChange={val => setFormData(prev => ({ ...prev, expiry_date: val }))}
                placeholder="Select expiry date"
              />
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
                searchable
                options={[
                  // Nigeria
                  { value: 'University of Lagos', label: 'University of Lagos' },
                  { value: 'University of Ibadan', label: 'University of Ibadan' },
                  { value: 'Obafemi Awolowo University', label: 'Obafemi Awolowo University' },
                  { value: 'University of Nigeria, Nsukka', label: 'University of Nigeria, Nsukka' },
                  { value: 'Lagos State University', label: 'Lagos State University' },
                  { value: 'Osun State University', label: 'Osun State University' },
                  { value: 'Federal University of Agriculture', label: 'Federal University of Agriculture' },
                  { value: 'Ahmadu Bello University', label: 'Ahmadu Bello University' },
                  { value: 'University of Benin', label: 'University of Benin' },
                  { value: 'University of Port Harcourt', label: 'University of Port Harcourt' },
                  { value: 'Covenant University', label: 'Covenant University' },
                  { value: 'Babcock University', label: 'Babcock University' },
                  { value: 'Pan-Atlantic University', label: 'Pan-Atlantic University' },
                  { value: 'Nnamdi Azikiwe University', label: 'Nnamdi Azikiwe University' },
                  { value: 'Federal University of Technology Akure', label: 'Federal University of Technology Akure' },
                  // USA
                  { value: 'Harvard University', label: 'Harvard University' },
                  { value: 'Massachusetts Institute of Technology', label: 'Massachusetts Institute of Technology' },
                  { value: 'Stanford University', label: 'Stanford University' },
                  { value: 'Yale University', label: 'Yale University' },
                  { value: 'Princeton University', label: 'Princeton University' },
                  { value: 'Columbia University', label: 'Columbia University' },
                  { value: 'University of Chicago', label: 'University of Chicago' },
                  { value: 'University of Pennsylvania', label: 'University of Pennsylvania' },
                  { value: 'California Institute of Technology', label: 'California Institute of Technology' },
                  { value: 'Duke University', label: 'Duke University' },
                  { value: 'Johns Hopkins University', label: 'Johns Hopkins University' },
                  { value: 'Northwestern University', label: 'Northwestern University' },
                  { value: 'University of California, Berkeley', label: 'University of California, Berkeley' },
                  { value: 'University of California, Los Angeles', label: 'University of California, Los Angeles' },
                  { value: 'University of Michigan', label: 'University of Michigan' },
                  { value: 'Cornell University', label: 'Cornell University' },
                  { value: 'New York University', label: 'New York University' },
                  { value: 'Georgetown University', label: 'Georgetown University' },
                  { value: 'University of Texas at Austin', label: 'University of Texas at Austin' },
                  { value: 'University of Washington', label: 'University of Washington' },
                  // UK
                  { value: 'University of Oxford', label: 'University of Oxford' },
                  { value: 'University of Cambridge', label: 'University of Cambridge' },
                  { value: 'Imperial College London', label: 'Imperial College London' },
                  { value: 'University College London', label: 'University College London' },
                  { value: 'London School of Economics', label: 'London School of Economics' },
                  { value: 'University of Edinburgh', label: 'University of Edinburgh' },
                  { value: 'King\'s College London', label: "King's College London" },
                  { value: 'University of Manchester', label: 'University of Manchester' },
                  { value: 'University of Bristol', label: 'University of Bristol' },
                  { value: 'University of Warwick', label: 'University of Warwick' },
                  // Canada
                  { value: 'University of Toronto', label: 'University of Toronto' },
                  { value: 'McGill University', label: 'McGill University' },
                  { value: 'University of British Columbia', label: 'University of British Columbia' },
                  { value: 'University of Alberta', label: 'University of Alberta' },
                  { value: 'McMaster University', label: 'McMaster University' },
                  { value: 'University of Waterloo', label: 'University of Waterloo' },
                  { value: 'Western University', label: 'Western University' },
                  // Australia
                  { value: 'Australian National University', label: 'Australian National University' },
                  { value: 'University of Melbourne', label: 'University of Melbourne' },
                  { value: 'University of Sydney', label: 'University of Sydney' },
                  { value: 'University of Queensland', label: 'University of Queensland' },
                  { value: 'Monash University', label: 'Monash University' },
                  { value: 'University of New South Wales', label: 'University of New South Wales' },
                  // Europe
                  { value: 'ETH Zurich', label: 'ETH Zurich' },
                  { value: 'University of Amsterdam', label: 'University of Amsterdam' },
                  { value: 'Sorbonne University', label: 'Sorbonne University' },
                  { value: 'Technical University of Munich', label: 'Technical University of Munich' },
                  { value: 'Heidelberg University', label: 'Heidelberg University' },
                  { value: 'Delft University of Technology', label: 'Delft University of Technology' },
                  { value: 'KU Leuven', label: 'KU Leuven' },
                  { value: 'University of Copenhagen', label: 'University of Copenhagen' },
                  { value: 'Uppsala University', label: 'Uppsala University' },
                  { value: 'University of Helsinki', label: 'University of Helsinki' },
                  { value: 'Sapienza University of Rome', label: 'Sapienza University of Rome' },
                  { value: 'University of Barcelona', label: 'University of Barcelona' },
                  { value: 'Charles University', label: 'Charles University' },
                  { value: 'University of Warsaw', label: 'University of Warsaw' },
                  // Asia
                  { value: 'National University of Singapore', label: 'National University of Singapore' },
                  { value: 'Nanyang Technological University', label: 'Nanyang Technological University' },
                  { value: 'University of Tokyo', label: 'University of Tokyo' },
                  { value: 'Kyoto University', label: 'Kyoto University' },
                  { value: 'Peking University', label: 'Peking University' },
                  { value: 'Tsinghua University', label: 'Tsinghua University' },
                  { value: 'Seoul National University', label: 'Seoul National University' },
                  { value: 'KAIST', label: 'KAIST' },
                  { value: 'Hong Kong University of Science and Technology', label: 'Hong Kong University of Science and Technology' },
                  { value: 'University of Hong Kong', label: 'University of Hong Kong' },
                  { value: 'Indian Institute of Technology Bombay', label: 'Indian Institute of Technology Bombay' },
                  { value: 'Indian Institute of Technology Delhi', label: 'Indian Institute of Technology Delhi' },
                  { value: 'University of Delhi', label: 'University of Delhi' },
                  // Middle East & Africa
                  { value: 'American University of Beirut', label: 'American University of Beirut' },
                  { value: 'University of Cape Town', label: 'University of Cape Town' },
                  { value: 'University of Pretoria', label: 'University of Pretoria' },
                  { value: 'Stellenbosch University', label: 'Stellenbosch University' },
                  { value: 'University of Nairobi', label: 'University of Nairobi' },
                  { value: 'University of Ghana', label: 'University of Ghana' },
                  { value: 'Cairo University', label: 'Cairo University' },
                  { value: 'American University in Cairo', label: 'American University in Cairo' },
                  // Latin America
                  { value: 'University of São Paulo', label: 'University of São Paulo' },
                  { value: 'National Autonomous University of Mexico', label: 'National Autonomous University of Mexico' },
                  { value: 'Pontifical Catholic University of Chile', label: 'Pontifical Catholic University of Chile' },
                  { value: 'University of Buenos Aires', label: 'University of Buenos Aires' },
                ]}
                placeholder="Search institution"
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