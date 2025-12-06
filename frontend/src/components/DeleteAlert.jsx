import React from "react";

const DeleteAlert = ({ message, onConfirm, onCancel }) => {
  console.log("DeleteAlert rendered with message:", message);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              console.log("Cancel button clicked");
              onCancel();
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              console.log("Confirm button clicked");
              onConfirm();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAlert;
