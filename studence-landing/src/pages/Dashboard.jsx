import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import { ThumbsUp, MessageSquare } from "lucide-react";
import PostModal from "../components/PostModal";
import CommentsModal from "../components/CommentsModal"; // NEW: Import CommentsModal
import { useUser } from "../UserContext";

const typeColors = {
  Question: "bg-[#fbd1ac] text-[#7b3f00]",
  Team: "bg-[#eec6a0] text-[#5c2e00]",
  Resource: "bg-[#d8a073] text-[#4a2600]",
};

export default function Dashboard() {
  const { user } = useUser();

  const [posts, setPosts] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCommentsModal, setShowCommentsModal] = useState(false); // NEW: State for comments modal
  const [selectedPostId, setSelectedPostId] = useState(null); // NEW: State to hold post ID for comments

  const openModal = (type) => {
    if (!user) {
      alert("Please login to post.");
      return;
    }
    setModalType(type);
  };
  const closeModal = () => setModalType(null);

  // NEW: Functions to handle comments modal
  const openCommentsModal = (postId) => {
    setSelectedPostId(postId);
    setShowCommentsModal(true);
  };
  const closeCommentsModal = () => {
    setSelectedPostId(null);
    setShowCommentsModal(false);
  };

  const fetchPosts = useCallback(async () => { // Wrapped in useCallback
    try {
      setLoading(true);
      // MODIFIED: Fetch likes and comments count from backend
      const res = await fetch("http://localhost:3000/api/posts/all");
      const data = await res.json();

      // For each post, fetch its like and comment counts
      const postsWithCounts = await Promise.all(data.posts.map(async (post) => {
        // Fetch like count
        const likesRes = await fetch(`http://localhost:3000/api/posts/${post.id}/likes/count`); // Assuming a new endpoint for like count
        const likesData = await likesRes.json();
        const likeCount = likesData.count || 0;

        // Fetch comment count
        const commentsRes = await fetch(`http://localhost:3000/api/posts/${post.id}/comments/count`); // Assuming a new endpoint for comment count
        const commentsData = await commentsRes.json();
        const commentCount = commentsData.count || 0;

        // Fetch user's like status for the post
        let userLiked = false;
        if (user && !user.isGuest && user.token) { // Only fetch if user is logged in
          const likeStatusRes = await fetch(`http://localhost:3000/api/posts/${post.id}/like-status`, {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          });
          const likeStatusData = await likeStatusRes.json();
          userLiked = likeStatusData.liked;
        }

        return {
          ...post,
          likes: likeCount,
          comments: commentCount,
          userLiked: userLiked, // Add user's like status
        };
      }));

      setPosts(postsWithCounts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [user]); // Dependency on user to refetch when user logs in/out

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]); // Dependency on fetchPosts

  // NEW: Handle liking/unliking a post
  const handleToggleLike = async (postId) => {
    if (!user || user.isGuest) {
      alert("Please login to like posts.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/posts/${postId}/like`, {
        method: "POST", // Or PUT
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        // Update the posts state to reflect the new like count and userLiked status
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likes: data.liked ? post.likes + 1 : post.likes - 1,
                  userLiked: data.liked,
                }
              : post
          )
        );
      } else {
        alert(data.error || "Failed to toggle like.");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Failed to toggle like.");
    }
  };


  const renderContent = (post) => {
    const content = post.content?.trim();
    const fileUrl = post.link;
    const type = post.type?.toLowerCase();

    if (type === "resource") {
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
          {!fileUrl && !content && (
            <p className="italic text-gray-500">No content or resource provided.</p>
          )}
          {content && <p>{content}</p>}
        </div>
      );
    }

   if (type === "team") {
  return (
    <div className="text-lg text-black-600 whitespace-pre-line font-semibold">
      <p className="mb-2">{content}</p>
      {post.tags && post.tags.length > 0 && (
        <div className="mt-2">
          <p className="text-sm italic text-black-600">
            Skills Required:{" "}
            <span className="not-italic font-medium text-black-700">
              {post.tags.join(", ")}
            </span>
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

  const filteredPosts = posts
    .filter((post) => {
      if (filterType === "All") return true;
      return capitalizeType(post.type) === filterType;
    })
    .filter((post) => {
      const contentMatch = post.content?.toLowerCase().includes(searchQuery.toLowerCase());
      const linkMatch = post.link?.toLowerCase().includes(searchQuery.toLowerCase());
      return contentMatch || linkMatch;
    });

  return (
    <div className="min-h-screen bg-[#fff8f3]">
      <div className="w-full py-10 px-4">
        <h1 className="text-3xl font-bold text-[#7b3f00] mb-2">
          Welcome to Studence
        </h1>
        <p className="text-md text-gray-700 mb-6">
          Ask questions, find teammates, and share resources — all in one place.
        </p>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbd1ac]"
          />
          <button className="bg-[#d89566] hover:bg-[#c87d45] text-white font-semibold px-4 py-2 rounded-md">
            Search
          </button>
        </div>

        {/* Post Buttons & Filter */}
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div className="flex flex-wrap gap-4 mt-4 sm:mt-0">
            {["Question", "Team", "Resource"].map((type) => (
              <button
                key={type}
                className={`px-4 py-2 rounded-md shadow font-semibold ${
                  user
                    ? "bg-[#7b3f00] text-white hover:bg-[#5e2f00]"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
                onClick={() => openModal(type)}
                disabled={!user}
              >
                {type === "Team"
                  ? "Find Team"
                  : type === "Resource"
                  ? "Share Resource"
                  : "Ask Question"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              className="border rounded-md px-8 py-2"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Question">Question</option>
              <option value="Team">Team</option>
              <option value="Resource">Resource</option>
            </select>
          </div>
        </div>

        {/* Posts */}
        <h2 className="text-xl font-semibold text-[#7b3f00] mb-4">
          Recent Posts
        </h2>

        {loading ? (
          <p className="text-gray-600">Loading posts...</p>
        ) : filteredPosts.length === 0 ? (
          <p className="text-gray-600">No posts found.</p>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white shadow-md border border-[#f1e2d1] rounded-2xl px-6 py-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-md text-[#7b3f00] font-medium">
                    {post.is_anonymous ? "Anonymous" : post.name || "User"}
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
                    {/* NEW: Like Button */}
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1 ${
                        post.userLiked ? "text-blue-600" : "text-[#7b3f00]"
                      } hover:text-blue-800 transition-colors duration-200`}
                      disabled={!user || user.isGuest}
                    >
                      <ThumbsUp className="w-4 h-4" /> {post.likes || 0}
                    </button>
                    {/* NEW: Comment Button */}
                    <button
                      onClick={() => openCommentsModal(post.id)}
                      className="flex items-center gap-1 text-[#7b3f00] hover:text-orange-600 transition-colors duration-200"
                    >
                      <MessageSquare className="w-4 h-4" /> {post.comments || 0}
                    </button>
                  </div>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      typeColors[capitalizeType(post.type)] ||
                      "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {capitalizeType(post.type)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Modal */}
      {modalType && user && (
       <PostModal
         type={modalType}
         onClose={closeModal}
         refetch={fetchPosts}
         currentUserName={user?.name}
       />
      )}

      {/* NEW: Comments Modal */}
      {showCommentsModal && selectedPostId && (
        console.log("Dashboard: user.uid being passed to CommentsModal:", user?.uid),
        <CommentsModal
          postId={selectedPostId}
          onClose={closeCommentsModal}
          currentUserName={user?.name}
          currentUserAvatar={user?.avatar_url} // Pass avatar for comments
          currentUserId={user?.uid} // Pass UID for comments (will be null if auth middleware issue persists)
          refetchPosts={fetchPosts} // To update comment count on dashboard
        />
      )}
    </div>
  );
}
