import { useEffect, useState } from "react";

type Props = {
  onClose: () => void;
  itemName?: string;
  onDelete?: () => Promise<void>;
};

export default function CredentialDeleteUI({ onClose, itemName, onDelete }: Props) {
  const [showConfirm, setShowConfirm] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete();
      }
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err) {
      console.error("Delete failed:", err);
      setIsDeleting(false);
    }
  };

  // when success appears, auto-close after 2s and notify parent
  useEffect(() => {
    let t: number | undefined;
    if (showSuccess) {
      t = window.setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [showSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 font-sans">
      {/* Dimmed backdrop */}
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose} />

      {/* CONFIRM DELETE MODAL */}
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white shadow-xl rounded-lg p-8 w-96 text-center z-10">
            <p className="text-lg font-semibold mb-2">Confirm credential deletion</p>
            {itemName && <p className="text-sm text-gray-600 mb-4">{itemName}</p>}

            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="bg-gray-100 border px-8 py-2 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white"
              >
                {isDeleting ? 'Deleting...' : 'Yes'}
              </button>

              <button onClick={onClose} className="bg-gray-100 border px-8 py-2 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white">
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white border border-gray-300 shadow-lg rounded-lg px-6 py-4 flex items-start gap-3 w-80 z-10">
            <div className="w-6 h-6 bg-green-300 rounded-full flex items-center justify-center">✓</div>

            <div className="flex flex-col -mt-1">
              <p className="font-semibold text-sm">Success</p>
              <p className="text-xs text-gray-600 -mt-1">Credential deleted successfully</p>
            </div>

            <button onClick={() => { setShowSuccess(false); onClose(); }} className="ml-auto text-gray-600 text-sm">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
