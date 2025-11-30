import React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

const CustomBarChart = ({ data = [] }) => {
  // compute max for axis as before...
  const vals = (data || []).map((d) => Number(d.count || 0))
  const max = vals.length ? Math.max(...vals) : 0

  return (
    // ensure explicit height and minHeight
    <div className="bg-white mt-6" style={{ height: 300, minHeight: 220, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data || []} barCategoryGap="30%">
          <CartesianGrid stroke="none" />
          <XAxis dataKey="priority" tick={{ fill: "#555", fontSize: 12 }} />
          <YAxis allowDecimals={false} domain={[0, Math.max(1, max + 1)]} />
          <Tooltip />
          <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={40} minPointSize={6}>
            {(data || []).map((entry, i) => (
              <Cell key={i} fill={entry?.priority === "high" ? "#F44336" : entry?.priority === "medium" ? "#FF9800" : "#4CAF50"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CustomBarChart