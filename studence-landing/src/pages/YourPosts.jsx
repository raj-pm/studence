import React, { useEffect, useState } from "react";
import { ThumbsUp, MessageSquare, Trash2, Pencil } from "lucide-react";
import { getAuth } from "firebase/auth";

const typeColors = {
  Question: "bg-[#fbd1ac] text-[#7b3f00]",
  Team: "bg-[#eec6a0] text-[#5c2e00]",
  Resource: "bg-[#d8a073] text-[#4a2600]",
};

export default function YourPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const auth = getAuth();

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken(true);
        const res = await fetch("http://localhost:3000/api/posts/your-posts", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching user posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken(true);
      const res = await fetch(`http://localhost:3000/api/posts/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
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
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setEditedContent(post.content);
  };

  const saveEdit = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken(true);
      const res = await fetch(`http://localhost:3000/api/posts/edit/${editingPost.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: editedContent,
          tags: editingPost.tags || [],
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === editingPost.id ? { ...p, content: editedContent } : p
          )
        );
        setEditingPost(null);
      } else {
        alert(data.error || "Failed to update post.");
      }
    } catch (err) {
      console.error("Edit error:", err);
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

        {loading ? (
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

                  {renderContent(post)}

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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-[#7b3f00]">Edit Post</h2>
            <textarea
              className="w-full border rounded-md p-2 h-32 resize-none mb-4"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
            <div className="flex justify-end gap-3">
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
          </div>
        </div>
      )}
    </div>
  );
}
