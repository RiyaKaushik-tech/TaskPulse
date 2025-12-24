import React, { useState } from "react";
import { FaComments, FaMagic, FaTimes, FaSpinner } from "react-icons/fa";
import axiosInstance from "../utils/axiosInstance";
import toast from "react-hot-toast";

/**
 * AI COMMENT SUMMARIZER COMPONENT
 * 
 * Summarizes long comment threads using Cohere AI
 * - Condense discussions into key points
 * - Quick overview of comment threads
 * - Save time reading long conversations
 * 
 * Used in: TaskDetails page, CommentSection
 */

const AICommentSummarizer = ({ taskId, commentCount = 0, compact = false }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSummarize = async () => {
    if (!taskId) {
      toast.error("Task ID is required");
      return;
    }

    if (commentCount === 0) {
      toast.info("No comments to summarize");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/ai/summarize-comments/${taskId}`);

      if (response.data.success) {
        setSummary(response.data.data);
        setShowModal(true);
        toast.success("Comments summarized!");
      }
    } catch (error) {
      console.error("Error summarizing comments:", error);
      const message = error.response?.data?.message || "Failed to summarize comments";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleCopySummary = () => {
    if (summary?.summary) {
      navigator.clipboard.writeText(summary.summary);
      toast.success("Summary copied to clipboard!");
    }
  };

  if (compact) {
    return (
      <>
        <button
          onClick={handleSummarize}
          disabled={loading || commentCount === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 
                   dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-200
                   rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="AI Summarize Comments"
        >
          {loading ? (
            <FaSpinner className="animate-spin" size={14} />
          ) : (
            <FaMagic size={14} />
          )}
          <span>AI Summary</span>
        </button>

        {/* Summary Modal */}
        {showModal && summary && (
          <SummaryModal
            summary={summary}
            onClose={handleClose}
            onCopy={handleCopySummary}
          />
        )}
      </>
    );
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleSummarize}
        disabled={loading || commentCount === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 
                 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700
                 text-white font-medium rounded-lg transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Summarizing {commentCount} comments...
          </>
        ) : (
          <>
            <FaMagic />
            AI Summarize Comments ({commentCount})
          </>
        )}
      </button>

      {commentCount === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
          No comments available to summarize
        </p>
      )}

      {/* Summary Modal */}
      {showModal && summary && (
        <SummaryModal
          summary={summary}
          onClose={handleClose}
          onCopy={handleCopySummary}
        />
      )}
    </div>
  );
};

// Summary Modal Component
const SummaryModal = ({ summary, onClose, onCopy }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 
                          rounded-full flex items-center justify-center">
              <FaComments className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Comment Summary
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-generated summary of {summary.commentCount} comments
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

        {/* Summary Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 
                        rounded-lg p-5 border border-purple-200 dark:border-purple-700">
            <div className="flex items-start gap-3">
              <FaMagic className="text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Key Discussion Points
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {summary.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> This AI-generated summary captures the main points of the discussion. 
              Read the full comments for complete context.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCopy}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                     hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors
                     flex items-center gap-2"
          >
            📋 Copy Summary
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                     text-white font-medium rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICommentSummarizer;
