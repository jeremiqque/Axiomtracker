import React from "react";

interface Props {
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

const DeleteConfirmModal: React.FC<Props> = ({ onClose, onConfirm, itemName }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96 text-center">
        <p className="mb-6 font-medium">Confirm deletion of {itemName}</p>

        <div className="flex justify-center gap-4">
          <button onClick={onConfirm} className="bg-gray-100 border px-6 py-2 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white">
            Yes
          </button>
          <button
            onClick={onClose}
            className="bg-gray-100 border px-6 py-2 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;