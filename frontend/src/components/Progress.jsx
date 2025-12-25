
import React from "react"

const Progress = ({ progress, status }) => {
  const getColor = () => {
    switch (status) {
      case "In Progress":
        return "var(--accent-info)"

      case "Completed":
        return "var(--accent-primary)"

      default:
        return "var(--accent-warning)"
    }
  }

  return (
    <div
      className="w-full h-1.5 rounded-full"
      style={{
        backgroundColor: "var(--bg-tertiary)",
      }}
    >
            <div
              className="h-1.5 rounded-full text-center text-sm font-medium transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: getColor(),
              }}
            ></div>
          </div>
        )
      }
      
      export default Progress
