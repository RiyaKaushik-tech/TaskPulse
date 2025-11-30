import React from "react"

const TaskStatusTabs = ({ tabs, activeTab, setActiveTab }) => {
  // coerce tabs into an array of { label, count }
  let tabList = [];
  if (Array.isArray(tabs)) {
    tabList = tabs;
  } else if (tabs && typeof tabs === "object") {
    tabList = Object.keys(tabs).map((k) => {
      const v = tabs[k];
      // support both numeric counts or nested object keys like { label, count }
      if (v && typeof v === "object" && ("label" in v || "count" in v)) {
        return { label: v.label ?? k, count: Number(v.count ?? 0) };
      }
      return { label: k, count: Number(v ?? 0) };
    });
  } else {
    // fallback single label
    tabList = [{ label: typeof tabs === "string" ? tabs : "All", count: 0 }];
  }

  return (
    <div className="my-2">
      <div className="flex">
        {tabList.map((tab) => (
          <button
            key={tab.label}
            className={`relative px-3 md:px-4 py-2 text-sm font-medium ${
              activeTab === tab.label ? "text-primary" : "text-gray-500 hover:text-gray-700"
            } cursor-pointer`}
            onClick={() => setActiveTab(tab.label)}
            type="button"
          >
            <div className="flex items-center">
              <span className="text-lg">{tab.label}</span>

              <span
                className={`text-sm ml-2 px-2 py-0.5 rounded-full ${
                  activeTab === tab.label ? "bg-primary text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                ({tab.count})
              </span>
            </div>

            {activeTab === tab.label && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TaskStatusTabs
