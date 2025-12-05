import React, { useState } from "react";

const AddTagsInput = ({ tags = [], setTags }) => {
  const [value, setValue] = useState("");

  const addTag = () => {
    const t = value.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setValue("");
  };

  const removeTag = (idx) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !value && tags.length) {
      // optional UX: remove last tag with backspace when input empty
      removeTag(tags.length - 1);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t, i) => (
          <span key={t + i} className="px-2 py-1 bg-gray-200 rounded flex items-center gap-2">
            <span className="text-sm">{t}</span>
            <button type="button" onClick={() => removeTag(i)} className="text-red-500">×</button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Add tag and press Enter"
          className="flex-1 px-3 py-2 rounded"
        />
        <button type="button" onClick={addTag} className="px-4 py-2 bg-blue-500 text-white rounded">
          Add
        </button>
      </div>
    </div>
  );
};

export default AddTagsInput;