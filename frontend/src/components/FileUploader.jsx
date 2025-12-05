import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";

const FileUploader = ({ onUploaded }) => {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await axiosInstance.post("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploaded = res.data?.files || [];
      if (typeof onUploaded === "function") onUploaded(uploaded);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      // clear input
      e.target.value = null;
    }
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFiles} />
      {uploading && <span className="text-sm text-gray-500">Uploading…</span>}
    </div>
  );
};

export default FileUploader;