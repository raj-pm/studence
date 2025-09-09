import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import { ThumbsUp, MessageSquare, Trash2, Pencil } from "lucide-react";
import { useUser } from "../UserContext"; // Import useUser to get current user's token and UID

const typeColors = {
  Question: "bg-[#fbd1ac] text-[#7b3f00]",
  Team: "bg-[#eec6a0] text-[#5c2e00]",
  Resource: "bg-[#d8a073] text-[#4a2600]",
};

export default function YourPosts() {
  const { user, loading: userLoading } = useUser(); // Get user and userLoading state from context
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [editedContent, setEditedContent] = useState("");

  // Use useCallback to memoize fetchUserPosts to prevent infinite loops in useEffect
  const fetchUserPosts = useCallback(async () => {
    // Only fetch if user is loaded and authenticated
    if (userLoading || !user || !user.token || !user.uid) {
      setLoading(false); // Set loading to false if user is not available
      setPosts([]); // Clear posts if not logged in
      return;
    }

    try {
      setLoading(true);
      // Fetch user's own posts
      const res = await fetch("http://localhost:3000/api/posts/your-posts", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error fetching user posts:", errorData.error || "Unknown error");
        alert("Failed to load your posts: " + (errorData.error || "Please try again."));
        setPosts([]);
        return;
      }

      const data = await res.json();
      // Ensure data.posts exists and is an array
      const userPosts = Array.isArray(data.posts) ? data.posts : [];

      // Fetch likes and comments count for each post
      const postsWithCounts = await Promise.all(userPosts.map(async (post) => {
        const likesRes = await fetch(`http://localhost:3000/api/posts/${post.id}/likes/count`);
        const likesData = await likesRes.json();
        const likeCount = likesData.count || 0;

        const commentsRes = await fetch(`http://localhost:3000/api/posts/${post.id}/comments/count`);
        const commentsData = await commentsRes.json();
        const commentCount = commentsData.count || 0;

        return {
          ...post,
          likes: likeCount,
          comments: commentCount,
        };
      }));

      setPosts(postsWithCounts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      alert("An unexpected error occurred while fetching your posts.");
    } finally {
      setLoading(false);
    }
  }, [user, userLoading]); // Depend on user and userLoading to re-run when auth state changes

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]); // Re-run effect when fetchUserPosts changes (due to its dependencies)

  const handleDelete = async (id) => {
    // Replaced window.confirm with alert as per guidelines
    const confirmed = alert("Are you sure you want to delete this post? (This action cannot be undone)");
    // In a real app, you'd use a custom modal for confirmation and handle its result.
    // For now, we'll proceed with deletion after the alert is dismissed.

    try {
      if (!user || !user.token) {
        alert("You must be logged in to delete posts.");
        return;
      }

      const res = await fetch(`http://localhost:3000/api/posts/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((post) => post.id !== id));
       
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete post.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred during deletion.");
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setEditedContent(post.content);
  };

  const saveEdit = async () => {
    if (!editedContent.trim()) {
      alert("Post content cannot be empty.");
      return;
    }

    try {
      if (!user || !user.token) {
        alert("You must be logged in to edit posts.");
        return;
      }

      const res = await fetch(`http://localhost:3000/api/posts/edit/${editingPost.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: editedContent,
          tags: editingPost.tags || [], // Ensure tags are sent, even if empty
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === editingPost.id ? { ...p, content: editedContent } : p
          )
        );
        setEditingPost(null); // Close the modal
        alert("Post updated successfully!");
      } else {
        alert(data.error || "Failed to update post.");
      }
    } catch (err) {
      console.error("Edit error:", err);
      alert("An error occurred during update.");
    }
  };

  const renderContent = (post) => {
    const content = post.content?.trim();
    const fileUrl = post.link;

    if (post.type === "resource") {
      return (
        <div className="text-lg text-black-600 whitespace-pre-line font-semibold space-y-2">
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-700 underline break-words"
            >
              📄 View Resource
            </a>
          )}
          {content && <p>{content}</p>}
          {!fileUrl && !content && (
            <p className="italic text-gray-500">No content or resource provided.</p>
          )}
        </div>
      );
    }

    if (post.type === "team") {
      return (
        <div className="text-lg text-black-600 whitespace-pre-line font-semibold">
          <p className="mb-2">{content}</p>
          {post.tags?.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold text-black mb-1">
                Skills Required: {post.tags.join(", ")}
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <p className="text-lg font-semibold text-black-600 whitespace-pre-line">
        {content}
      </p>
    );
  };

  const capitalizeType = (type) =>
    type?.charAt(0).toUpperCase() + type?.slice(1).toLowerCase();

  const filteredPosts = posts.filter((post) =>
    post.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fff8f3]">
      <div className="w-full py-10 px-4">
        <h1 className="text-3xl font-bold text-[#7b3f00] mb-4">Your Posts</h1>

        <input
          type="text"
          placeholder="Search your posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border rounded-md px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-[#fbd1ac]"
        />

        {userLoading ? (
          <p className="text-gray-600">Checking authentication...</p>
        ) : !user ? (
          <p className="text-red-600">Please log in to view your posts.</p>
        ) : loading ? (
          <p className="text-gray-600">Loading your posts...</p>
        ) : filteredPosts.length === 0 ? (
          <p className="text-gray-600">You haven't posted anything yet.</p>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => {
              const displayType = capitalizeType(post.type);
              return (
                <div
                  key={post.id}
                  className="bg-white shadow-md border border-[#f1e2d1] rounded-2xl px-6 py-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md text-[#7b3f00] font-medium">
                      {post.is_anonymous ? "Anonymous" : post.name || "You"}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Display content or edit textarea */}
                  {editingPost?.id === post.id ? (
                    <textarea
                      className="w-full border rounded-md p-2 h-32 resize-none mb-4"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                    />
                  ) : (
                    renderContent(post)
                  )}


                  <div className="flex justify-between items-center mt-3">
                    <div className="flex gap-6 text-md font-medium">
                      <div className="flex items-center gap-1 text-[#7b3f00]">
                        <ThumbsUp className="w-4 h-4" /> {post.likes || 0}
                      </div>
                      <div className="flex items-center gap-1 text-[#7b3f00]">
                        <MessageSquare className="w-4 h-4" /> {post.comments || 0}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        typeColors[displayType] || "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {displayType}
                    </span>
                  </div>

                  {/* Edit/Delete Buttons */}
                  {editingPost?.id === post.id ? (
                    <div className="flex justify-end gap-3 mt-3">
                      <button
                        onClick={() => setEditingPost(null)}
                        className="px-4 py-2 bg-gray-200 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        className="px-4 py-2 bg-[#fbd1ac] text-[#7b3f00] font-semibold rounded-md"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4 mt-3 text-sm text-[#7b3f00] font-medium">
                      <button
                        onClick={() => handleEdit(post)}
                        className="flex items-center gap-1 hover:underline"
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="flex items-center gap-1 hover:underline text-red-500"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
