import { useEffect, useState } from "react";
import { useUser } from "../UserContext";
import MainLayout from "../components/MainLayout";

export default function YourPosts() {
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user?.token) return;

      try {
        const res = await fetch("/api/posts/your-posts", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error("Post fetch error:", err.message);
        setError("Could not load your posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 text-[#7b3f00]">
        <h2 className="text-3xl font-bold mb-4">Your Posts</h2>

        {loading && <p>Loading your posts...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && posts.length === 0 && <p>You haven't posted anything yet.</p>}

        <div className="grid gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-[#fffaf3] p-4 rounded-xl border border-[#f0c090] shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {post.type}
                </span>
                <span className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</span>
              </div>
              <h3 className="text-xl font-bold mb-1">{post.title}</h3>
              <p className="text-sm text-gray-700 mb-2">{post.description}</p>

              {post.tags?.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {post.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-[#fbd1ac] text-[#7b3f00] px-2 py-0.5 text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {post.type === "resource" && post.link && (
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline text-blue-600"
                >
                  View Resource
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
