import React, { useState } from "react";
import { FaList, FaMagic, FaTimes } from "react-icons/fa";
import axiosInstance from "../utils/axiosInstance";
import toast from "react-hot-toast";

/**
 * AI SUBTASK GENERATOR COMPONENT
 * 
 * Generate subtask checklist from task title and description using Groq AI
 * - Break down complex tasks into actionable steps
 * - Smart checklist generation
 * - Edit before applying
 * 
 * Used in: CreateTasks page
 */

const AISubtaskGenerator = ({ taskTitle, taskDescription, onApply, compact = false }) => {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleGenerateSubtasks = async () => {
    if (!taskTitle || taskTitle.trim().length < 3) {
      toast.error("Please enter a task title first");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/ai/generate-subtasks", {
        taskTitle: taskTitle.trim(),
        taskDescription: taskDescription?.trim() || "",
      });

      if (response.data.success) {
        setSubtasks(response.data.data.subtasks);
        setShowModal(true);
        toast.success("Subtasks generated!");
      }
    } catch (error) {
      console.error("Error generating subtasks:", error);
      const message = error.response?.data?.message || "Failed to generate subtasks";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubtasks = () => {
    if (onApply && subtasks.length > 0) {
      onApply(subtasks);
      toast.success(`${subtasks.length} subtasks applied!`);
      setShowModal(false);
      setSubtasks([]);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleEditSubtask = (index, newText) => {
    const updated = [...subtasks];
    updated[index] = { ...updated[index], text: newText };
    setSubtasks(updated);
  };

  if (compact) {
    return (
      <>
        <button
          onClick={handleGenerateSubtasks}
          disabled={loading || !taskTitle}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 
                   dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-200
                   rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="AI Generate Subtasks"
        >
          {loading ? (
            <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaMagic size={14} />
          )}
          <span>Generate Subtasks</span>
        </button>

        {/* Subtasks Modal */}
        {showModal && subtasks.length > 0 && (
          <SubtasksModal
            subtasks={subtasks}
            onClose={handleClose}
            onApply={handleApplySubtasks}
            onRemove={handleRemoveSubtask}
            onEdit={handleEditSubtask}
          />
        )}
      </>
    );
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleGenerateSubtasks}
        disabled={loading || !taskTitle}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700
                 text-white font-medium rounded-lg transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating Subtasks...
          </>
        ) : (
          <>
            <FaMagic />
            <FaList />
            AI Generate Subtasks
          </>
        )}
      </button>

      {!taskTitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
          Enter a task title to generate subtasks
        </p>
      )}

      {/* Subtasks Modal */}
      {showModal && subtasks.length > 0 && (
        <SubtasksModal
          subtasks={subtasks}
          onClose={handleClose}
          onApply={handleApplySubtasks}
          onRemove={handleRemoveSubtask}
          onEdit={handleEditSubtask}
        />
      )}
    </div>
  );
};

// Subtasks Modal Component
const SubtasksModal = ({ subtasks, onClose, onApply, onRemove, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 
                          rounded-full flex items-center justify-center">
              <FaList className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                AI-Generated Subtasks
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtasks.length} actionable items • Edit before applying
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Subtasks List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {subtasks.map((subtask, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg 
                         border border-gray-200 dark:border-gray-700 hover:border-green-300 
                         dark:hover:border-green-600 transition-colors"
              >
                <div className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900 
                              text-green-600 dark:text-green-400 rounded-full font-semibold text-sm flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>

                <input
                  type="text"
                  value={subtask.text}
                  onChange={(e) => onEdit(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                           rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <button
                  onClick={() => onRemove(index)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 
                           transition-colors p-2 flex-shrink-0"
                  title="Remove subtask"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> You can edit any subtask before applying. These will be added to your task's checklist.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                     hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            disabled={subtasks.length === 0}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 
                     text-white font-medium rounded-lg transition-all flex items-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaMagic />
            Apply {subtasks.length} Subtasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISubtaskGenerator;
