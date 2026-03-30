import { useNavigate } from "react-router-dom";

interface CredentialTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CredentialTypeSelector({ isOpen, onClose }: CredentialTypeSelectorProps) {
  const navigate = useNavigate();

  const handleSelectType = (type: "individual" | "company") => {
    onClose();
    if (type === "individual") {
      navigate("/dashboard/credentials/new");
    } else {
      navigate("/dashboard/credentials/company");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      {/* Individual Option */}
      <button
        onClick={() => handleSelectType("individual")}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100 first:rounded-t-lg"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <div className="text-left">
          <p className="font-medium text-gray-900">Individual</p>
          <p className="text-xs text-gray-500">For a single person</p>
        </div>
      </button>

      {/* Company Option */}
      <button
        onClick={() => handleSelectType("company")}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition last:rounded-b-lg"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 5 7 13 17 13 17 5" />
        </svg>
        <div className="text-left">
          <p className="font-medium text-gray-900">Company</p>
          <p className="text-xs text-gray-500">For organization</p>
        </div>
      </button>
    </div>
  );
}
