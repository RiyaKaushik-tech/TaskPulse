import React, { useState } from "react";
import { FaSearch, FaBrain, FaTimes, FaTag, FaCalendar, FaUser } from "react-icons/fa";
import axiosInstance from "../utils/axiosInstance";
import toast from "react-hot-toast";
import moment from "moment";

/**
 * AI SMART SEARCH COMPONENT
 * 
 * Semantic search powered by Hugging Face
 * - Search by meaning, not just keywords
 * - Find similar tasks
 * - Natural language queries
 * 
 * Used in: ManageTasks, Dashboard pages
 */

const AISmartSearch = ({ onSelectTask, compact = false }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 2) {
      toast.error("Please enter at least 2 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/ai/smart-search", {
        query: query.trim(),
        limit: 10,
      });

      if (response.data.success) {
        setResults(response.data.data.results);
        setShowResults(true);
        
        if (response.data.data.results.length === 0) {
          toast.info("No similar tasks found");
        } else {
          toast.success(`Found ${response.data.data.results.length} similar tasks`);
        }
      }
    } catch (error) {
      console.error("Error performing smart search:", error);
      const message = error.response?.data?.message || "Search failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTask = (task) => {
    if (onSelectTask) {
      onSelectTask(task);
    }
    setShowResults(false);
    setQuery("");
    setResults([]);
  };

  const handleClose = () => {
    setShowResults(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FaBrain className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600 dark:text-purple-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !loading && handleSearch()}
              placeholder="AI Semantic Search..."
              className="w-full pl-10 pr-4 py-2 border border-purple-300 dark:border-purple-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                       focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : <FaSearch />}
          </button>
        </div>

        {/* Results Dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
            {results.map((task, index) => (
              <div
                key={task._id || index}
                onClick={() => handleSelectTask(task)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    {task.title}
                  </h4>
                  {task.similarityScore && (
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      {Math.round(task.similarityScore * 100)}% match
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {task.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
      <div className="flex items-center gap-2 mb-3">
        <FaBrain className="text-indigo-600 dark:text-indigo-400" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          AI Semantic Search
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Search tasks by meaning, not just keywords. Try: "urgent database issues" or "frontend bugs"
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !loading && handleSearch()}
            placeholder="Describe what you're looking for..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg
                   flex items-center gap-2 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <FaBrain />
              Search
            </>
          )}
        </button>
      </div>

      {/* Results Modal */}
      {showResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <FaBrain className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Search Results
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Found {results.length} similar {results.length === 1 ? "task" : "tasks"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>

            {/* Results */}
            <div className="p-6">
              {results.length === 0 ? (
                <div className="text-center py-12">
                  <FaSearch className="mx-auto text-gray-400 text-5xl mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No similar tasks found. Try a different search query.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((task, index) => (
                    <div
                      key={task._id || index}
                      onClick={() => handleSelectTask(task)}
                      className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700
                               hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer"
                    >
                      {/* Title & Similarity Score */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex-1">
                          {task.title}
                        </h3>
                        {task.similarityScore && (
                          <div className="ml-4 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              {Math.round(task.similarityScore * 100)}% match
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {task.description}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 flex-wrap text-sm">
                        <span className={`px-3 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <FaCalendar />
                            {moment(task.dueDate).format("MMM DD, YYYY")}
                          </span>
                        )}

                        {task.assignedTo && task.assignedTo.length > 0 && (
                          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <FaUser />
                            {task.assignedTo.length} assigned
                          </span>
                        )}

                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <FaTag className="text-gray-400" />
                            {task.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs text-gray-600 dark:text-gray-400">
                                {tag}
                                {i < Math.min(task.tags.length, 3) - 1 && ","}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISmartSearch;
