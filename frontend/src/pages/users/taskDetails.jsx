import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import DashboardLayout from "../../components/DashboardLayout";
import moment from "moment";
import AvatarGroup from "../../components/AvatarGroup";
import { FaExternalLinkAlt } from "react-icons/fa";

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

  const updateTodoChecklist = async (index) => {
    if (!task) return;
    const list = [...(task.todoCheckList || task.todoChecklist || [])];
    if (!list[index]) return;
    list[index].completed = !list[index].completed;
    try {
      const response = await axiosInstance.put(`/tasks/${id}/todo`, {
        todoCheckList: list, // send correct key
      });
      if (response.status === 200) {
        setTask(response.data?.task || task);
      } else {
        list[index].completed = !list[index].completed;
        setTask({ ...task, todoCheckList: list });
      }
    } catch {
      list[index].completed = !list[index].completed;
      setTask({ ...task, todoCheckList: list });
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
                          (u) => u.profileImageUrl || u.profilePicUrl
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
                  {(task.todoCheckList || []).map((item, index) => (
                    <TodoCheckItem
                      key={index}
                      text={item.text}
                      isChecked={!!item.completed}
                      onChange={() => updateTodoChecklist(index)}
                    />
                  ))}
                </div>

                {task.attachments?.length > 0 && (
                  <div className="mt-2">
                    <label className="text-xs font-medium text-slate-500">
                      Attachments
                    </label>
                    {task.attachments.map((link, index) => (
                      <Attachment
                        key={index}
                        link={link}
                        index={index}
                        onClick={() => handleLinkClick(link)}
                      />
                    ))}
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