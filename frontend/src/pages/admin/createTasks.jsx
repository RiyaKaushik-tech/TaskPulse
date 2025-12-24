import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import DashboardLayout from "../../components/DashboardLayout"
import { MdDelete } from "react-icons/md"
import DatePicker from "react-datepicker"

import "react-datepicker/dist/react-datepicker.css"
import SelectedUsers from "../../components/SelectedUser.jsx"
import TodoListInput from "../../components/TodoListInput"
import AddAttachmentsInput from "../../components/AddAttachment.jsx"
import axiosInstance from "../../utils/axiosInstance.js"
import moment from "moment"
import toast from "react-hot-toast"
import Modal from "../../components/Modal"
import DeleteAlert from "../../components/DeleteAlert"
import FileUploader from "../../components/FileUploader";
import AddTagsInput from "../../components/AddTagsInput";
import AITaskSuggestions from "../../components/AITaskSuggestions";
import AISubtaskGenerator from "../../components/AISubtaskGenerator";

const CreateTask = () => {
  const [error,setError] = useState("")
  const location = useLocation()
  const { taskId } = location.state || {}

  const navigate = useNavigate()

  // default form state so inputs never become undefined
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "low",
    dueDate: null,           // Date or null
    assignedTo: [],         // array of ids
    todoCheckList: [],      // array of { text, completed }
    attachments: [],
    tags :[]
  })

  // when you load existing task by id, normalize fields:
  const loadTask = (apiTask) => {
    setTaskData({
      title: apiTask?.title ?? "",
      description: apiTask?.description ?? "",
      priority: (apiTask?.priority ?? "low").toString().toLowerCase(),
      dueDate: apiTask?.dueDate ? new Date(apiTask.dueDate) : null,
      assignedTo: Array.isArray(apiTask?.assignedTo) ? apiTask.assignedTo.map(a => a._id ?? a) : [],
      // normalize checklist to array of { text, completed }
      todoCheckList: Array.isArray(apiTask?.todoCheckList)
        ? apiTask.todoCheckList.map(i => ({ text: i?.text ?? i?.task ?? "", completed: !!i?.completed }))
        : Array.isArray(apiTask?.todoChecklist)
        ? apiTask.todoChecklist.map(i => ({ text: i?.text ?? i?.task ?? "", completed: !!i?.completed }))
        : [],
      // attachments can be strings or objects; keep as-is
      attachments: Array.isArray(apiTask?.attachments) ? apiTask.attachments : [],
      // tags
      tags: Array.isArray(apiTask?.tags) ? apiTask.tags : [],
    })
  }

  const [currentTask, setCurrentTask] = useState(null)

  // const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState([]);
  const [tags, setTags] = useState([]); // <--- added tags state

  const [openDeleteAlert, setOpenDeleteAlert] = useState(false)

  const handleValueChange = (key, value) => {
    setTaskData((prevData) => ({
      ...prevData,
      [key]: value,
    }))
  }

  const clearData = () => {
    // reset form data
    setTaskData({
      title: "",
      description: "",
      priority: "low",
      dueDate: null,
      assignedTo: [],
      todoCheckList: [],
      attachments: [],
      tags:[]
    })
  }

  // create task
  const createTask = async () => {
    try {
      // normalize todo list to objects expected by backend
      const normalizedTodo = (taskData.todoCheckList || []).map((t) =>
        typeof t === "string"
          ? { text: t, completed: false }
          : { text: t?.text ?? t?.task ?? "", completed: !!t?.completed }
      );

      const payload = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
        assignedTo: taskData.assignedTo, // array of user ids
        attachments: taskData.attachments || [], // array of urls or objects
        todoCheckList: normalizedTodo,
        tags: taskData.tags || [],
      }

      const response = await axiosInstance.post("/tasks/create-task", payload)

      toast.success("Task created successfully!")

      clearData()

      // console.log(response.data)
    } catch (error) {
      console.log("Error creating task: ", error)
      toast.error("Error creating task!")
    }
  }

  // update task
  const updateTask = async () => {
    try {
      // build todo list preserving completed state where possible
      const prevList = Array.isArray(currentTask?.todoCheckList) ? currentTask.todoCheckList : [];
      const todolist = (taskData.todoCheckList || []).map((item) => {
        const text = typeof item === "string" ? item : item?.text ?? item?.task ?? "";
        const matched = prevList.find((t) => (t?.text ?? t?.task) === text);
        return {
          text,
          completed: matched ? !!matched.completed : !!item?.completed || false,
        }
      })

      const response = await axiosInstance.put(`/tasks/${taskId}`, {
        ...taskData,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
        todoCheckList: todolist,
        attachments: taskData.attachments || [],
        tags: taskData.tags || [],
      })

      toast.success("Task updated successfully!")

      // console.log(response.data)
    } catch (error) {
      console.log("Error updating task: ", error)
      toast.error("Error updating task!")
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (loading) return;

    // Basic client-side validation
    if (!taskData.title || !String(taskData.title).trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      // Normalize assignedTo to array of ids
      const assignedTo = (taskData.assignedTo || []).map((u) =>
        typeof u === "string" ? u : u?._id ?? u?.id ?? u
      ).filter(Boolean);

      // Prefer explicit UI state if user interacted with uploader/tags
      const attachmentsArr = (attachments && attachments.length) ? attachments : (taskData.attachments || []);
      const tagsArr = (tags && tags.length) ? tags : (taskData.tags || []);

      // Normalize todo checklist to objects expected by backend
      const normalizedTodo = (taskData.todoCheckList || []).map((t) =>
        typeof t === "string"
          ? { text: t, completed: false }
          : { text: t?.text ?? t?.task ?? "", completed: !!t?.completed }
      );

      const payload = {
        title: String(taskData.title).trim(),
        description: taskData.description ?? "",
        priority: taskData.priority ?? "low",
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
        assignedTo,
        todoCheckList: normalizedTodo,
        attachments: attachmentsArr,
        tags: tagsArr,
      };

      const res = taskId
        ? await axiosInstance.put(`/tasks/${taskId}`, payload)
        : await axiosInstance.post("/tasks/create-task", payload);

      if (res?.data?.success || res?.status === 200 || res?.status === 201) {
        toast.success(taskId ? "Task updated successfully!" : "Task created successfully!");
        clearData();
        if (!taskId) navigate("/admin/manageTasks");
      } else {
        console.warn("Unexpected response:", res);
        toast.error(res?.data?.message || "Unexpected response from server");
      }
    } catch (err) {
      console.error("Create task failed:", err, err?.response?.data);
      toast.error(err?.response?.data?.message || err.message || "Error creating/updating task");
    } finally {
      setLoading(false);
    }
  };

  // get task info by id
  const getTaskDetailsById = async () => {
    try {
      const response = await axiosInstance.get(`/tasks/${taskId}`)

      if (response.data) {
        const taskInfo = response.data
        setCurrentTask(taskInfo)
        loadTask(taskInfo)
      }
    } catch (error) {
      toast.error("Error fetching task details: ", error)
      console.log("Error fetching task details: ", error)
    }
  }

  // delete task
  const deleteTask = async () => {
    try {
      await axiosInstance.delete(`/tasks/${taskId}`)

      setOpenDeleteAlert(false)

      toast.success("Task deleted successfully!")
      
      navigate("/admin/manageTasks")
    } catch (error) {
      toast.error("Error deleting task: ", error)
      // console.log("Error deleting task: ", error)
    }
  }

  const handleUploadAndCreate = async (e) => {
    e.preventDefault?.();
    try {
      const payload = {
        // ...existing fields you already collect (title, description, etc.)
        title,
        description,
        priority,
        dueDate,
        assignedTo,
        todoCheckList, // or however you collect checklist items
        attachments: attachments, // attachments is array of urls or objects
        tags,
      };

      // ensure attachments are URLs if backend expects strings; if you stored objects keep objects
      const res = await axiosInstance.post("/tasks/create-task", payload);
      if (res?.data?.success) {
        // success handling (redirect or reset) — keep existing behavior
      }
    } catch (err) {
      console.error("Create task failed:", err);
    }
  };

  useEffect(() => {
    if (taskId) {
      getTaskDetailsById(taskId)
    }

    return () => {}
  }, [taskId])

  return (
    <DashboardLayout activeMenu={"Create Task"}>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {taskId ? "Update Task" : "Create New Task"}
            </h2>

            {taskId && (
              <button
                className="flex items-center gap-2 text-red-600 hover:text-red-800"
                onClick={() => setOpenDeleteAlert(true)}
              >
                <MdDelete className="text-lg" /> Delete Task
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              
              {/* AI Task Suggestions - Only show when creating new task */}
              {!taskId && (
                <AITaskSuggestions
                  onApply={(suggestions) => {
                    setTaskData({
                      ...taskData,
                      title: suggestions.title,
                      description: suggestions.description,
                      tags: suggestions.tags || [],
                      priority: suggestions.priority || "medium",
                    });
                  }}
                  disabled={loading}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter task title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={taskData.title}
                  onChange={(e) => handleValueChange("title", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>

                <textarea
                  placeholder="Enter task description"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={taskData.description}
                  onChange={(e) =>
                    handleValueChange("description", e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    priority
                  </label>

                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={taskData.priority}
                    onChange={(e) =>
                      handleValueChange("priority", e.target.value)
                    }
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>

                <div>
                <label>
                    Due Date
                  </label>

                  <div className="relative">
                    <DatePicker
                      selected={taskData.dueDate}
                      onChange={(data) => handleValueChange("dueDate", data)}
                      minDate={new Date()}
                      placeholderText="Select due date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>

                <SelectedUsers
                  selectedUser={taskData.assignedTo}
                  setSelectedUser={(value) =>
                    handleValueChange("assignedTo", value)
                  }
                />
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TODO Checklist
                </label>

                {/* AI Subtask Generator */}
                <div className="mb-3">
                  <AISubtaskGenerator
                    taskTitle={taskData.title}
                    taskDescription={taskData.description}
                    onApply={(subtasks) => {
                      const combinedList = [
                        ...(taskData.todoCheckList || []),
                        ...subtasks,
                      ];
                      handleValueChange("todoCheckList", combinedList);
                    }}
                    compact={true}
                  />
                </div>

                <TodoListInput
                  todoList={taskData?.todoCheckList}
                  setTodoList={(value) =>
                    handleValueChange("todoCheckList", value)
                  }
                />
              </div>

              {/* Tags input - keep styling consistent with other fields */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Tags</label>
                <AddTagsInput
                  tags={tags.length ? tags : taskData.tags || []}
                  setTags={(v) => {
                    setTags(v);
                    handleValueChange("tags", v);
                  }}
                />
              </div>

              {/* Attachments input (existing / FileUploader usage) */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Attachments</label>
                <FileUploader
                  onUploaded={(files) => {
                    const parsed = (files || []).map((f) => (typeof f === "string" ? f : f));
                    const next = [...(taskData.attachments || []), ...parsed];
                    setAttachments(next);
                    handleValueChange("attachments", next);
                  }}
                />
                {/* optional preview of attachments kept as before */}
                <div className="mt-2">
                  {(taskData.attachments || []).map((f, i) => {
                    const url = typeof f === "string" ? f : f.url || f.path || "";
                    const name = typeof f === "string"
                      ? (url.split("/").pop() || `file-${i+1}`)
                      : f.originalname || String(url).split("/").pop() || `file-${i+1}`;
                    return (
                      <div key={i} className="text-xs text-gray-600">
                        {name}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end mt-7">
                <button
                  className="px-2 py-2 bg-green-500 border border-green-300 rounded-md text-white hover:bg-green-800 cursor-pointer w-full"
                  onClick={handleSubmit}
                  type="button"
                >
                  {taskId ? "UPDATE TASK" : "CREATE TASK"}
                </button>
              </div>
             </div> 
          </form>
        </div>
      </div>

      <Modal
        isOpen={openDeleteAlert}
        onClose={() => setOpenDeleteAlert(false)}
        title={"Delete Task"}
      >
        <DeleteAlert
          content="Are you sure you want to delete this task?"
          onConfirm={() => deleteTask()}
          onCancel={()=>{navigate("/admin/manageTasks")}}
        />
      </Modal>
    </DashboardLayout>
  )
}

export default CreateTask