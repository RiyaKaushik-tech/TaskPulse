import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import DashboardLayout from "../../components/DashboardLayout";
import moment from "moment";
import AvatarGroup from "../../components/AvatarGroup";
import { FaExternalLinkAlt } from "react-icons/fa";
import toast from "react-hot-toast";

const TaskDetails = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) {
      setErr("Missing task id");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await axiosInstance.get(`/tasks/${id}`);
        setTask(res.data?.task || null);
      } catch (e) {
        setErr(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const getStatusTagColor = (status) => {
    switch (status) {
      case "in-progress":
      case "In Progress":
        return "text-cyan-500 bg-cyan-50 border border-cyan-500/10";
      case "completed":
      case "Completed":
        return "text-lime-500 bg-lime-50 border border-lime-500/10";
      default:
        return "text-violet-500 bg-violet-50 border border-violet-500/10";
    }
  };

  const TagChip = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-700 mr-2 mb-2 hover:bg-gray-200"
  >
    #{label}
  </button>
);

  const updateTodoChecklist = async (index) => {
    if (!task) return;

    // Normalize current checklist (support both fields)
    const currentList = Array.isArray(task?.todoCheckList)
      ? task.todoCheckList.slice()
      : Array.isArray(task?.todoChecklist)
      ? task.todoChecklist.slice()
      : [];

    if (index < 0 || index >= currentList.length) return;

    // Optimistic update: toggle completed locally and normalize to todoCheckList
    const updatedList = currentList.map((it, i) =>
      i === index ? { ...(it || {}), completed: !Boolean(it?.completed) } : it
    );
    setTask((prev) => ({ ...(prev || {}), todoCheckList: updatedList }));

    try {
      const res = await axiosInstance.put(`/tasks/${id}/todo`, {
        todoCheckList: updatedList,
      });

      if (res.status === 200) {
        const returned = res.data?.task || res.data || null;
        // Normalize returned checklist into todoCheckList for consistent UI
        const returnedList = Array.isArray(returned?.todoCheckList)
          ? returned.todoCheckList
          : Array.isArray(returned?.todoChecklist)
          ? returned.todoChecklist
          : updatedList;

        // Merge returned task, but ensure todoCheckList is the normalized list
        setTask((prev) => ({ ...(prev || {}), ...(returned || {}), todoCheckList: returnedList }));
      }
    } catch (err) {
      toast.error(err)
      console.error("PUT /tasks/:id/todo failed:", err);
      // Revert optimistic change
      setTask((prev) => ({ ...(prev || {}), todoCheckList: currentList }));
    }
  };

  const handleLinkClick = (link) => {
    const url = /^https?:\/\//i.test(link) ? link : "https://" + link;
    window.open(url, "_blank");
  };

  return (
    <DashboardLayout activeMenu={"My Tasks"}>
      <div className="mt-5 px-4 sm:px-6 lg:px-8">
        {loading && <p>Loading...</p>}
        {err && !loading && <p className="text-red-600">Error: {err}</p>}
        {!loading && !err && !task && <p>No task found.</p>}

        {task && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
            <div className="md:col-span-3 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                <div className="flex flex-col space-y-3">
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                    {task.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusTagColor(
                        task.status
                      )}`}
                    >
                      {task.status}
                      <span className="ml-1.5 w-2 h-2 rounded-full bg-current opacity-80"></span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <InfoBox label="Description" value={task.description} />
                </div>

                <div className="grid grid-cols-12 gap-4 mt-4">
                  <div className="col-span-6 md:col-span-4">
                    <InfoBox label="Priority" value={task.priority} />
                  </div>
                  <div className="col-span-6 md:col-span-4">
                    <InfoBox
                      label="Due Date"
                      value={
                        task.dueDate
                          ? moment(task.dueDate).format("Do MMM YYYY")
                          : "N/A"
                      }
                    />
                  </div>
                  <div className="col-span-6 md:col-span-4">
                    <label className="text-xs font-medium text-slate-500">
                      Assigned To
                    </label>
                    <AvatarGroup
                      avatars={
                        (task.assignedTo || []).map(
                          (u) =>
                            u?.profileImageUrl ||
                            u?.profilePicUrl ||
                            u?.profile_image ||
                            ""
                        ) || []
                      }
                      maxVisible={5}
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="text-xs font-medium text-slate-500">
                    Todo Checklist
                  </label>
                  {(() => {
                    const checklist = Array.isArray(task?.todoCheckList)
                      ? task.todoCheckList
                      : Array.isArray(task?.todoChecklist)
                      ? task.todoChecklist
                      : [];

                    if (!checklist.length) {
                      return <p className="text-sm text-gray-500 mt-2">No items</p>;
                    }

                    return checklist.map((item, i) => (
                      <TodoCheckItem
                        key={String(i)}
                        text={item?.text || item?.task || ""}
                        isChecked={Boolean(item?.completed)}
                        onChange={() => updateTodoChecklist(i)}
                      />
                    ));
                  })()}
                </div>

                {task.tags?.length > 0 && (
                  <div className="mt-2">
                    <label className="text-xs font-medium text-slate-500">Tags</label>
                    <div className="mt-2 flex flex-wrap">
                      {task.tags.map((t, i) => (
                        <TagChip key={t + i} label={t} />
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(task?.attachments) && task.attachments.length > 0 && (
                  <div className="mt-2">
                    <label className="text-xs font-medium text-slate-500">Attachments</label>
                    <div className="mt-2 space-y-2">
                      {task.attachments.map((file, idx) => {
                        const isString = typeof file === "string";
                        const fileObj = isString ? { url: file } : (file || {});
                        const url = fileObj.url || fileObj.path || (isString ? file : "");
                        const rawName = fileObj.originalname || fileObj.originalName || (typeof url === "string" ? decodeURIComponent(String(url).split("/").pop() || "") : "");
                        const name = rawName || String(url || "").split("/").pop() || `file-${idx + 1}`;
                        const mime = fileObj.mimeType || fileObj.mimetype || "";
                        const ext = (name.split(".").pop() || "").toUpperCase();
                        const isImage = /^image\//.test(mime) || /\.(jpe?g|png|gif|webp|svg)$/i.test(name);
                        const sizeText = fileObj.size ? `${Math.round(fileObj.size / 1024)} KB` : null;

                        return (
                          <div
                            key={String(idx)}
                            className="flex items-center justify-between bg-gray-50 border border-gray-100 px-3 py-2 rounded-md mb-2 cursor-pointer"
                            onClick={() => url && window.open(url, "_blank")}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { url && window.open(url, "_blank"); } }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 flex items-center justify-center bg-white border rounded overflow-hidden">
                                {isImage && url ? (
                                  <img src={url} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-gray-600 text-sm font-semibold">{ext || "FILE"}</span>
                                )}
                              </div>

                              <div className="flex flex-col">
                                <p className="text-xs text-black truncate max-w-xs">{name}</p>
                                <p className="text-[11px] text-gray-400">
                                  {sizeText || mime || "file"}
                                </p>
                              </div>
                            </div>

                            <FaExternalLinkAlt className="text-gray-500" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TaskDetails;

const InfoBox = ({ label, value }) => (
  <>
    <label className="text-xs font-medium text-slate-500">{label}</label>
    <p className="text-[13px] md:text-sm font-medium text-gray-700 mt-0.5">
      {value}
    </p>
  </>
);

const TodoCheckItem = ({ text, isChecked, onChange }) => (
  <div className="flex items-center gap-3 p-3">
    <input
      type="checkbox"
      checked={isChecked}
      onChange={onChange}
      className="w-4 h-4 text-primary bg-gray-100 border border-gray-300 rounded outline-none cursor-pointer"
    />
    <p className="text-sm text-gray-800">{text}</p>
  </div>
);

const Attachment = ({ link, index, onClick }) => (
  <div
    className="flex justify-between bg-gray-50 border border-gray-100 px-3 py-2 rounded-md mb-3 mt-2 cursor-pointer"
    onClick={onClick}
  >
    <div className="flex flex-1 items-center gap-3">
      <span className="text-xs text-gray-400 font-semibold mr-2">
        {index < 9 ? `0${index + 1}` : index + 1}
      </span>
      <p className="text-xs text-black truncate">{link}</p>
    </div>
    <FaExternalLinkAlt className="text-gray-500" />
  </div>
);

