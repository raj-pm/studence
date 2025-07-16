import React, { useState, useEffect } from "react";
import { X, Send, User, MessageSquare } from "lucide-react"; // Import necessary icons
import { getAuth } from "firebase/auth"; // To get current Firebase user for displayName/photoURL fallback
import defaultAvatar from "../assets/default-avatar.png"; // Assuming you have this asset

export default function CommentsModal({
  postId,
  onClose,
  currentUserName,
  currentUserAvatar,
  currentUserId, // Received from Dashboard
  refetchPosts, // Callback to refresh post counts on Dashboard
}) {
  const [comments, setComments] = useState([]);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [postAsAnonymous, setPostAsAnonymous] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  const auth = getAuth(); // Get Firebase auth instance
  console.log("CommentsModal: currentUserId prop received:", currentUserId);

  // Fetch comments for the post
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`http://localhost:3000/api/posts/${postId}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      } else {
        console.error("Failed to fetch comments:", data.error);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]); // Refetch comments when postId changes

  const handleAddComment = async () => {
    if (!newCommentContent.trim()) {
      alert("Comment cannot be empty.");
      return;
    }

    console.log("CommentsModal: currentUserId inside handleAddComment:", currentUserId);
console.log("CommentsModal: postAsAnonymous state:", postAsAnonymous);
    // Ensure user is logged in (not guest) if not posting anonymously
    if (!currentUserId && !postAsAnonymous) {
      alert("Please log in to comment as yourself.");
      return;
    }

    setSubmittingComment(true);
    try {
      const firebaseUser = auth.currentUser;
      const token = firebaseUser ? await firebaseUser.getIdToken(true) : null;

      const payload = {
        content: newCommentContent,
        isAnonymous: postAsAnonymous,
        // If not anonymous, send the user's name and avatar
        ...(postAsAnonymous ? {} : {
          name: currentUserName || firebaseUser?.displayName || "User",
          avatar_url: currentUserAvatar || firebaseUser?.photoURL || null,
        }),
      };

      const res = await fetch(`http://localhost:3000/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Send token for authentication
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setNewCommentContent(""); // Clear input
        fetchComments(); // Refresh comments list
        refetchPosts(); // Refresh comment count on dashboard
      } else {
        alert(data.error || "Failed to add comment.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col p-6 shadow-xl border border-[#f1e2d1]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#7b3f00]">Comments</h2>
          <button onClick={onClose} className="text-[#7b3f00] hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto pr-4 mb-4 space-y-4">
          {loadingComments ? (
            <p className="text-gray-600">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-gray-600">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 bg-[#fdf8f4] p-3 rounded-lg shadow-sm">
                <img
                  src={comment.is_anonymous ? defaultAvatar : comment.avatar_url || defaultAvatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-[#eec6a0]"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#7b3f00]">
                      {comment.is_anonymous ? "Anonymous" : comment.name || "User"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t pt-4 flex flex-col gap-3">
          <textarea
            rows="2"
            placeholder={currentUserId ? "Write a comment..." : "Login to comment..."}
            className="w-full p-3 border border-[#eec6a0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fbd1ac]"
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            disabled={!currentUserId} // Disable if not logged in
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="postAsAnonymous"
                checked={postAsAnonymous}
                onChange={(e) => setPostAsAnonymous(e.target.checked)}
                className="form-checkbox h-4 w-4 text-[#7b3f00] rounded"
                disabled={!currentUserId} // Disable if not logged in
              />
              <label htmlFor="postAsAnonymous" className="text-sm text-[#7b3f00]">
                Post as Anonymous
              </label>
            </div>
            <button
              onClick={handleAddComment}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                currentUserId && newCommentContent.trim() && !submittingComment
                  ? "bg-[#d89566] text-white hover:bg-[#c87d45]"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
              disabled={!currentUserId || !newCommentContent.trim() || submittingComment}
            >
              {submittingComment ? "Submitting..." : "Comment"}
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
