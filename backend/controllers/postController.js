import supabase from "../supabaseClient.js";

// CREATE POST
export const createPost = async (req, res) => {
  try {
    const { uid } = req.user;
   // Change this


// To this
const { type, content, tags, isAnonymous, link } = req.body;

    const { data, error } = await supabase.from("posts").insert([
      {
        type,
        content: content || null,
        tags: tags || [],
        is_anonymous: isAnonymous,
        link: link || null,

        user_id: uid,
      },
    ]);

    if (error) {
      console.error("Error inserting post:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ message: "Post created successfully", data });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
};


// DELETE POST
export const deletePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    // Optional: Ensure post belongs to the user
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || post.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized or post not found" });
    }

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      console.error("Delete error:", error);
      return res.status(500).json({ error: "Failed to delete post" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// UPDATE POST
export const updatePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { content, tags } = req.body;

  try {
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || post.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized or post not found" });
    }

    const { data, error } = await supabase
      .from("posts")
      .update({ content, tags })
      .eq("id", postId);

    if (error) {
      console.error("Update error:", error);
      return res.status(500).json({ error: "Failed to update post" });
    }

    res.status(200).json({ message: "Post updated", data });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// GET ALL POSTS
export const getAllPosts = async (req, res) => {
  try {
    const { data: posts, error: postError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (postError) {
      console.error("Error fetching posts:", postError);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }

    // Fetch users separately
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, name, avatar_url");

    if (userError) {
      console.error("Error fetching users:", userError);
      return res.status(500).json({ error: "Failed to fetch user info" });
    }

    const userMap = new Map(users.map(user => [user.id, user]));

    const combinedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      type: post.type,
      tags: post.tags,
      
      link: post.link,
      created_at: post.created_at,
      likes: 0,
      comments: 0,
      is_anonymous: post.is_anonymous,
      name: post.is_anonymous ? "Anonymous" : userMap.get(post.user_id)?.name || "User",
      avatar_url: post.is_anonymous ? null : userMap.get(post.user_id)?.avatar_url || null,
    }));

    res.status(200).json({ posts: combinedPosts });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};


// GET USER'S OWN POSTS
export const getUserPosts = async (req, res) => {
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user posts:", error);
      return res.status(500).json({ error: "Failed to fetch user posts" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
