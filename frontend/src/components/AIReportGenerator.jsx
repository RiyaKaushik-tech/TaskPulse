import React, { useState } from "react";
import { FaFileAlt, FaDownload, FaTimes, FaSpinner } from "react-icons/fa";
import axiosInstance from "../utils/axiosInstance";
import toast from "react-hot-toast";

/**
 * AI REPORT GENERATOR COMPONENT
 * 
 * Generate comprehensive reports with insights using Google Gemini
 * - Weekly/Monthly/Custom reports
 * - Filter by user, status, priority
 * - Export as markdown or copy to clipboard
 * 
 * Used in: Dashboard, Reports page
 */

const AIReportGenerator = ({ compact = false }) => {
  const [reportType, setReportType] = useState("weekly");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    userId: "",
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/ai/generate-report", {
        reportType,
        filters: Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      });

      if (response.data.success) {
        setReport(response.data.data);
        setShowModal(true);
        toast.success("Report generated successfully!");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      const message = error.response?.data?.message || "Failed to generate report";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (report?.report) {
      navigator.clipboard.writeText(report.report);
      toast.success("Report copied to clipboard!");
    }
  };

  const handleDownloadReport = () => {
    if (report?.report) {
      const blob = new Blob([report.report], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `task-report-${reportType}-${new Date().toISOString().split("T")[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Report downloaded!");
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  if (compact) {
    return (
      <>
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FaFileAlt />
              Generate Report
            </>
          )}
        </button>

        {/* Report Modal */}
        {showModal && report && (
          <ReportModal
            report={report}
            onClose={handleClose}
            onCopy={handleCopyReport}
            onDownload={handleDownloadReport}
          />
        )}
      </>
    );
  }

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
      <div className="flex items-center gap-2 mb-3">
        <FaFileAlt className="text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          AI Report Generator
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Generate comprehensive reports with AI-powered insights and analytics.
      </p>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="weekly">Weekly Report</option>
            <option value="monthly">Monthly Report</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status Filter
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priority Filter
          </label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerateReport}
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                 flex items-center justify-center gap-2 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating Report...
          </>
        ) : (
          <>
            <FaFileAlt />
            Generate AI Report
          </>
        )}
      </button>

      {/* Report Modal */}
      {showModal && report && (
        <ReportModal
          report={report}
          onClose={handleClose}
          onCopy={handleCopyReport}
          onDownload={handleDownloadReport}
        />
      )}
    </div>
  );
};

// Report Modal Component
const ReportModal = ({ report, onClose, onCopy, onDownload }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <FaFileAlt className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Generated Report
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {report.taskCount} tasks analyzed • {report.reportType} report
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

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {report.report}
            </pre>
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
            📋 Copy to Clipboard
          </button>
          <button
            onClick={onDownload}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                     flex items-center gap-2 transition-colors"
          >
            <FaDownload />
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIReportGenerator;
