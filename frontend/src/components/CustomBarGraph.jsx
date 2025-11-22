import React from "react"
import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"

const CustomBarChart = ({ data = [] }) => {
  const getBarColor = (entry) => {
    switch (entry?.priority) {
      case "low":
        return "#4CAF50"
      case "medium":
        return "#FF9800"
      case "high":
        return "#F44336"
      default:
        return "#4CAF50"
    }
  }

  const CustomToolTip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0]?.payload || {}
      return (
        <div className="bg-white p-2 shadow-md rounded-lg border border-gray-300">
          <p className="text-xs font-semibold text-purple-800 mb-1">{p.priority}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="text-sm font-medium text-gray-900">{p.count}</span>
          </p>
        </div>
      )
    }
    return null
  }

  // ensure data is an array and compute max for Y domain
  const vals = (data || []).map((d) => Number(d.count || 0))
  const max = vals.length ? Math.max(...vals) : 0

  return (
    <div className="bg-white mt-6" style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data || []} barCategoryGap="30%">
          <CartesianGrid stroke="none" />
          <XAxis dataKey="priority" tick={{ fill: "#555", fontSize: 12 }} stroke="none" />
          <YAxis
            tick={{ fill: "#555", fontSize: 12 }}
            stroke="none"
            allowDecimals={false}
            domain={[0, Math.max(1, max + 1)]} // ensure visible scale
          />
          <Tooltip content={<CustomToolTip />} cursor={{ fill: "transparent" }} />
          <Bar
            dataKey="count"
            name={"priority"}
            fill="#FF8042"
            radius={[10, 10, 0, 0]}
            barSize={48}
            minPointSize={6} // ensure tiny values are visible
          >
            {(data || []).map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CustomBarChart