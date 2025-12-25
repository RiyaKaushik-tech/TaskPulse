
import React from "react"
import { IoMdClose } from "react-icons/io"

const Modal = ({ children, isOpen, onClose, title }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--modal-overlay)" }}
        onClick={onClose}
      ></div>

      <div
        className="relative w-full max-w-md mx-4 overflow-hidden rounded-2xl shadow-xl border transform transition-all duration-300 ease-out"
        style={{
          backgroundColor: "var(--modal-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{
            borderColor: "var(--border-color)",
          }}
        >
          <h3
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>

          <button
            onClick={onClose}
            className="p-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2"
            style={{
              color: "var(--text-secondary)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <IoMdClose className="w-5 h-5" />
          </button>
        </div>

                <div style={{ color: "var(--text-primary)" }} className="p-6">
                  {children}
                </div>
              </div>
            </div>
          )
        }
        
        export default Modal
