import React, { useState } from "react";
import { FaMagic, FaLightbulb, FaTimes } from "react-icons/fa";
import axiosInstance from "../utils/axiosInstance";
import toast from "react-hot-toast";

/**
 * AI TASK SUGGESTIONS COMPONENT
 * 
 * Allows users to type a brief task description and get AI-generated:
 * - Full title
 * - Detailed description
 * - Suggested tags
 * - Priority recommendation
 * - Estimated time to complete
 * 
 * Used in: CreateTasks page
 */

const AITaskSuggestions = ({ onApply, disabled = false }) => {
  const [userInput, setUserInput] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleGenerateSuggestions = async () => {
    if (!userInput.trim() || userInput.trim().length < 3) {
      toast.error("Please enter at least 3 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/ai/suggest-task", {
        userInput: userInput.trim(),
      });

      if (response.data.success) {
        setSuggestions(response.data.data);
        setShowModal(true);
        toast.success("AI suggestions generated!");
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      const message = error.response?.data?.message || "Failed to generate suggestions";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestions = () => {
    if (suggestions && onApply) {
      onApply({
        title: suggestions.title,
        description: suggestions.description,
        tags: suggestions.tags || [],
        priority: suggestions.priority || "medium",
        estimatedTimeHours: suggestions.estimatedTimeHours,
        aiGenerated: true,
        suggestedPriority: suggestions.priority,
      });
      toast.success("AI suggestions applied!");
      setShowModal(false);
      setUserInput("");
      setSuggestions(null);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setSuggestions(null);
  };

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
      <div className="flex items-center gap-2 mb-3">
        <FaMagic className="text-purple-600 dark:text-purple-400" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          AI Task Assistant
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Describe your task briefly, and AI will generate a complete task with title,
        description, tags, and priority.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !loading && handleGenerateSuggestions()}
          placeholder="E.g., 'Create login page with email validation'"
          disabled={disabled || loading}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                   focus:outline-none focus:ring-2 focus:ring-purple-500
                   disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleGenerateSuggestions}
          disabled={disabled || loading || !userInput.trim()}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg
                   flex items-center gap-2 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FaLightbulb />
              Generate
            </>
          )}
        </button>
      </div>

      {/* Suggestions Modal */}
      {showModal && suggestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <FaMagic className="text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  AI Task Suggestions
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Suggested Title
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    {suggestions.title}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Suggested Description
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-800 dark:text-gray-200">
                    {suggestions.description}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {suggestions.tags && suggestions.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Suggested Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 
                                 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority & Time Estimate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        suggestions.priority === "high"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : suggestions.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {suggestions.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {suggestions.estimatedTimeHours && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Estimated Time
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-800 dark:text-gray-200 font-medium">
                        {suggestions.estimatedTimeHours} {suggestions.estimatedTimeHours === 1 ? "hour" : "hours"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                         hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplySuggestions}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg
                         flex items-center gap-2 transition-colors"
              >
                <FaMagic />
                Apply Suggestions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITaskSuggestions;
