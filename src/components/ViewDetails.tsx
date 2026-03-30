
import { useNavigate, useLocation } from "react-router-dom";
import { type Credential } from "../lib/credentialsService";

export default function ViewDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const cred: Credential | null = (location && location.state as Credential) || null;

  // Debug logs
  if (cred) {
    console.log('ViewDetails cred:', cred);
  }

  // try a few common property names for uploaded file URL
  const imgUrl = cred?.image_url || cred?.file_url || cred?.fileUrl || cred?.imageUrl || null;

  // Calculate remaining days if not provided
  const calculateRemainingDays = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const remainingDays = cred?.remainingDays ?? calculateRemainingDays(cred?.expiry_date);

  if (!cred) {
    return (
      <div className="w-full min-h-screen bg-white p-4 sm:p-6 md:p-10 font-sans flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <p className="text-lg font-semibold text-red-600 mb-2">No credential data found</p>
          <p className="text-gray-600 text-sm sm:text-base">Use the "View Details" button from the credentials list.</p>
          <button onClick={() => navigate('/dashboard/credentials')} className="mt-4 w-full sm:w-auto bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            Back to Credentials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white p-4 sm:p-6 md:p-10 font-sans">
      <button 
        onClick={() => navigate('/dashboard/credentials')} 
        className="w-full sm:w-auto mb-4 sm:mb-0 sm:ml-auto flex-1 sm:flex-none border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-black hover:text-white transition duration-200"
      >
        Back
      </button>

      <div className="mt-6 flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* LICENSE PREVIEW */}
        <div className="w-full lg:w-auto lg:flex-1 max-w-sm mx-auto lg:mx-0">
          <p className="font-semibold text-lg sm:text-xl mb-2 text-center lg:text-left">{cred.name}</p>
          <p className="text-lg sm:text-xl font-bold text-gray-800 mb-4 text-center lg:text-left">Date of Issue: {cred.date_of_issue || '—'}</p>
          <div className="w-full h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] border-4 border-gray-200 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300">
            {imgUrl ? (
              <img 
                src={imgUrl} 
                alt="Uploaded certificate" 
                className="w-full h-full object-contain p-4 sm:p-6 md:p-8 hover:p-2 sm:hover:p-4 transition-all duration-300" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-8">
                <div className="w-16 sm:w-20 h-16 sm:h-20 md:w-24 md:h-24 bg-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1 text-center">No Image</p>
                <p className="text-sm sm:text-base text-gray-500 text-center">Upload certificate to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="w-full lg:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 text-sm lg:text-base">
          <div className="space-y-2">
            <p className="font-semibold text-sm sm:text-base lg:text-lg">Assigned Employees</p>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-800 font-semibold">{cred.entity || '—'}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm sm:text-base lg:text-lg">Credential Number</p>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-800 font-semibold">{cred.credential_number || cred._id || cred.id || '—'}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm sm:text-base lg:text-lg">Status</p>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-800 font-semibold">{cred.status || '—'}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm sm:text-base lg:text-lg">Expiry Date</p>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-800 font-semibold">{cred.expiry_date || '—'}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm sm:text-base lg:text-lg">Remaining Days</p>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-800 font-semibold">{remainingDays ?? '—'}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm sm:text-base lg:text-lg">Issuing Institute</p>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-800 font-semibold">{cred.issuing_institution || '—'}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm sm:text-base lg:text-lg">City</p>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-800 font-semibold">{cred.city || '—'}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm sm:text-base lg:text-lg">Country</p>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-800 font-semibold">{cred.country || '—'}</p>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="mt-12 pt-8 border-t border-gray-200 max-w-4xl mx-auto">
        <label className="block text-base sm:text-lg font-bold text-gray-900 mb-4">Additional Notes</label>
        <textarea
          value={cred.additional_notes || ""}
          readOnly
          className="w-full border border-gray-300 rounded-2xl p-4 sm:p-6 text-base sm:text-lg bg-gray-50 h-32 sm:h-40 focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none"
        />
      </div>
    </div>
  );
}
