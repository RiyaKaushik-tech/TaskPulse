import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useSelector } from "react-redux";
import moment from "moment";
import toast from "react-hot-toast";
import { getSocket } from "../utils/socket";
import DeleteAlert from "./DeleteAlert";


const CommentSection = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  const { currentUser } = useSelector((state) => state.user);
  const textareaRef = useRef(null);
  const mentionsRef = useRef(null);

  // Helper to insert a new or replied comment without a full refresh
  const addCommentToState = (comment) => {
    setComments((prev) => {
      if (comment.parentComment) {
        return prev.map((c) =>
          c._id === comment.parentComment
            ? { ...c, replies: [...(c.replies || []), comment] }
            : c
        );
      }
      return [comment, ...prev];
    });
  };

  // Helper to update a comment wherever it sits (top-level or reply)
  const updateCommentInState = (updated) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c._id === updated._id) return { ...c, ...updated };
        return {
          ...c,
          replies: (c.replies || []).map((r) =>
            r._id === updated._id ? { ...r, ...updated } : r
          ),
        };
      })
    );
  };

  // Helper to remove a comment from state (handles replies too)
  const removeCommentFromState = (id) => {
    setComments((prev) =>
      prev
        .filter((c) => c._id !== id)
        .map((c) => ({
          ...c,
          replies: (c.replies || []).filter((r) => r._id !== id),
        }))
    );
  };

  useEffect(() => {
    fetchComments();
    fetchUsers();
    const cleanup = setupSocketListeners();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [taskId]);

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return () => {};

    socket.emit("join-task", taskId);

    socket.on("comment:new", (comment) => {
      addCommentToState(comment);
      toast.success("💬 New comment added");
    });

    socket.on("comment:updated", (comment) => {
      updateCommentInState(comment);
      toast.success("Comment updated");
    });

    socket.on("comment:deleted", ({ commentId }) => {
      removeCommentFromState(commentId);
      toast.success(" Comment deleted");
    });

    socket.on("comment:reaction", ({ commentId, reaction }) => {
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, reaction } : c))
      );
    });

    return () => {
      socket.emit("leave-task", taskId);
      socket.off("comment:new");
      socket.off("comment:updated");
      socket.off("comment:deleted");
      socket.off("comment:reaction");
    };
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/comments/tasks/${taskId}`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error(" Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/users/get-users");
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setNewComment(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const searchTerm = value.substring(lastAtIndex + 1);
      if (searchTerm.length > 0 && !searchTerm.includes(" ")) {
        setMentionSearch(searchTerm);
        setShowMentions(true);
        filterMentions(searchTerm);
      } else if (searchTerm.length === 0) {
        setShowMentions(true);
        setMentionSuggestions(users);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const filterMentions = (search) => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );
    setMentionSuggestions(filtered);
  };

  const handleMentionSelect = (user) => {
    const lastAtIndex = newComment.lastIndexOf("@");
    const beforeMention = newComment.substring(0, lastAtIndex);
    const newValue = `${beforeMention}@${user.name} `;
    setNewComment(newValue);
    setSelectedMentions([...selectedMentions, user._id]);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error(" Please enter a comment");
      return;
    }

    const submitToast = toast.loading("💬 Adding comment...");
    try {
      const { data } = await axiosInstance.post("/comments", {
        taskId,
        content: newComment,
        mentions: selectedMentions,
        parentCommentId: replyTo?._id || null,
      });

      // Optimistically update local state with returned comment
      if (data?.comment) {
        addCommentToState(data.comment);
      }

      setNewComment("");
      setReplyTo(null);
      setSelectedMentions([]);
      toast.success(" Comment added", { id: submitToast });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(" Failed to add comment", { id: submitToast });
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) {
      toast.error(" Please enter comment content");
      return;
    }

    const editToast = toast.loading(" Updating comment...");
    try {
      const { data } = await axiosInstance.put(`/comments/${commentId}`, {
        content: editContent,
      });

      if (data?.comment) {
        updateCommentInState(data.comment);
      }

      setEditingComment(null);
      setEditContent("");
      toast.success(" Comment updated", { id: editToast });
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error(" Failed to update comment", { id: editToast });
    }
  };

  const handleDeleteComment = async (commentId) => {
    
    const deleteToast = toast.loading(" Deleting comment...");
    try {
      await axiosInstance.delete(`/comments/${commentId}`);
      removeCommentFromState(commentId);
      toast.success(" Comment deleted", { id: deleteToast });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(" Failed to delete comment", { id: deleteToast });
    }
  };

  const openDeleteConfirm = (comment) => {
    setDeleteTarget(comment);
    const snippet = comment?.content ? `: "${comment.content.slice(0, 80)}"` : "";
    setDeleteMessage(`Delete this comment${snippet}?`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;
    await handleDeleteComment(deleteTarget._id);
    setDeleteTarget(null);
    setDeleteMessage("");
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setDeleteMessage("");
  };

  const handleReaction = async (commentId, emoji) => {
    try {
      await axiosInstance.post(`/comments/${commentId}/reaction`, { emoji });
      setShowEmojiPicker(null);
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error(" Failed to add reaction");
    }
  };

  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

  const renderComment = (comment, isReply = false) => {
    const isAuthor = comment.author?._id === currentUser?._id;
              // console.log("comment:",comment);
    const isEditing = editingComment === comment._id;

    return (
      <div
        key={comment._id}
        className={`${
          isReply ? "ml-12 mt-3" : "mt-4"
        } p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors`}
        >
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {comment.author?.profilePicUrl ? (
              <img
                src={comment.author.profilePicUrl}
                alt={comment.author.name}
                className="w-full h-full rounded-full object-cover"
                />
              ) : (
                comment.author?.name?.charAt(0) || "?"
              )}
              
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-800">
                {comment.author?.name || "Unknown"}
              </span>
              <span className="text-xs text-gray-500">
                {moment(comment.createdAt).fromNow()}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-gray-400 italic">(edited)</span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditComment(comment._id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent("");
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-700 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>

                {comment.mentions && comment.mentions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {comment.mentions.map((user) => (
                      <span
                        key={user._id}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                      >
                        @{user.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-2">
                  {/* reaction */}
                  <div className="flex items-center gap-1">
                    {comment.reaction && comment.reaction.length > 0 && (
                      <div className="flex gap-1">
                        {Object.entries(
                          comment.reaction.reduce((acc, r) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(comment._id, emoji)}
                            className="px-2 py-1 bg-white border border-gray-300 rounded-full text-xs hover:bg-gray-50 transition-colors"
                          >
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowEmojiPicker(
                            showEmojiPicker === comment._id ? null : comment._id
                          )
                        }
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                      >
                        😊 React
                      </button>
                      {showEmojiPicker === comment._id && (
                        <div className="absolute top-8 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex gap-1 z-10">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(comment._id, emoji)}
                              className="text-xl hover:bg-gray-100 p-1 rounded transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isReply && (
                    <button
                      onClick={() => setReplyTo(comment)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      💬 Reply
                    </button>
                  )}

                  {isAuthor && (
                    <>
                      <button
                        onClick={() => {
                          setEditingComment(comment._id);
                          setEditContent(comment.content);
                        }}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(comment)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                         Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8">
      {deleteTarget && (
        <DeleteAlert
          message={deleteMessage || "Delete this comment?"}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        💬 Comments ({comments.length})
      </h3>

      {/* Add Comment */}
      <div className="bg-white rounded-lg border border-gray-300 p-4 mb-4">
        {replyTo && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700">
              Replying to <strong>{replyTo.author?.name}</strong>
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              ❌ Cancel
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleCommentChange}
            placeholder="Add a comment... (Use @ to mention someone)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            rows="3"
          />

          {/* Mention Suggestions */}
          {showMentions && mentionSuggestions.length > 0 && (
            <div
              ref={mentionsRef}
              className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10"
            >
              {mentionSuggestions.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleMentionSelect(user)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                    {user.profilePicUrl ? (
                      <img
                        src={user.profilePicUrl}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-3">
          <div className="text-xs text-gray-500">
            💡 Tip: Use @ to mention team members
          </div>
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            💬 {replyTo ? "Reply" : "Comment"}
          </button>
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-3">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <span className="text-4xl">💬</span>
          <p className="text-gray-500 mt-2">No comments yet</p>
          <p className="text-sm text-gray-400">Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-2">{comments.map((comment) => renderComment(comment))}</div>
      )}
    </div>
  );
};

export default CommentSection;