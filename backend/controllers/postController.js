import supabase from "../supabaseClient.js";

// Helper function to create a notification
const createNotification = async ({
  recipientId,
  senderId,
  type,
  postId,
  commentId = null,
  contentPreview,
}) => {
  try {
    const { data, error } = await supabase.from("notifications").insert([
      {
        recipient_id: recipientId,
        sender_id: senderId,
        type: type,
        post_id: postId,
        comment_id: commentId,
        content_preview: contentPreview,
      },
    ]).select();

    if (error) {
      console.error("❌ Error creating notification:", error.message);
    } else {
      console.log("✅ Notification created:", data);
    }
  } catch (err) {
    console.error("❌ Unexpected error in createNotification:", err.message);
  }
};


// CREATE POST
export const createPost = async (req, res) => {
  try {
    const { uid } = req.user;
    const { type, content, tags, isAnonymous, link, name } = req.body;

    const { data, error } = await supabase.from("posts").insert([
      {
        type,
        content: content || null,
        tags: tags || [],
        is_anonymous: isAnonymous,
        link: link || null,
        name: isAnonymous ? "Anonymous" : name || "User",
        user_id: uid,
      },
    ]).select();

    if (error) {
      console.error("Error inserting post:", error.message);
      return res.status(500).json({ error: error.message });
    }

    // FIX: Increment post_count for the user - Fetch current count, then update
    const { data: userData, error: fetchUserError } = await supabase
      .from("users")
      .select("post_count")
      .eq("id", uid)
      .single();

    if (fetchUserError || !userData) {
      console.error("Error fetching user for post count increment:", fetchUserError?.message || "User not found.");
    } else {
      const newPostCount = (userData.post_count || 0) + 1;
      const { error: updateError } = await supabase
        .from("users")
        .update({ post_count: newPostCount })
        .eq("id", uid);

      if (updateError) {
        console.error("Error incrementing post count:", updateError.message);
      }
    }

    console.log("Backend: Supabase insert data (after select):", data);
    console.log("Backend: Supabase insert error (after select):", error);

    return res.status(201).json({ message: "Post created successfully", data });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
};

// Toggle Like (Add or Remove)
export const toggleLike = async (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.uid; // Liker's UID

  if (!userId) {
    return res.status(401).json({ error: "Authentication required to like posts." });
  }

  try {
    // Get post owner's ID for notification recipient
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("user_id, content") // Also get content for notification preview
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("Error fetching post for like:", postError?.message || "Post not found.");
      return res.status(404).json({ error: "Post not found." });
    }

    const postOwnerId = post.user_id;
    const postContentPreview = post.content ? post.content.substring(0, 50) + "..." : "your post";


    // Check if the user has already liked this post
    const { data: existingLike, error: fetchError } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error checking existing like:", fetchError.message);
      return res.status(500).json({ error: "Failed to check like status." });
    }

    if (existingLike) {
      // If a like exists, delete it (unlike)
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) {
        console.error("Error deleting like:", deleteError.message);
        return res.status(500).json({ error: "Failed to unlike post." });
      }
      // Optionally, delete the notification if unliked, or mark as read/inactive
      // For simplicity, we'll just not create a new notification if unliked.
      return res.status(200).json({ message: "Post unliked successfully.", liked: false });
    } else {
      // If no like exists, add one
      const { data: newLike, error: insertError } = await supabase
        .from("likes")
        .insert([
          {
            post_id: postId,
            user_id: userId,
          },
        ])
        .select();

      if (insertError) {
        console.error("Error inserting like:", insertError.message);
        return res.status(500).json({ error: "Failed to like post." });
      }

      // NEW: Create a notification for the post owner if they are not the liker
      if (postOwnerId !== userId) {
        await createNotification({
          recipientId: postOwnerId,
          senderId: userId, // The user who liked
          type: "like",
          postId: postId,
          contentPreview: `${req.user.name || "Someone"} liked ${postContentPreview}`,
        });
      }

      return res.status(201).json({ message: "Post liked successfully.", liked: true, data: newLike });
    }
  } catch (error) {
    console.error("Unexpected error in toggleLike:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
};

// Get Like Status for a specific user on a specific post
export const getLikeStatus = async (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.uid;

  if (!userId) {
    return res.status(200).json({ liked: false });
  }

  try {
    const { data, error } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching like status:", error.message);
      return res.status(500).json({ error: "Failed to fetch like status." });
    }

    return res.status(200).json({ liked: !!data });
  } catch (error) {
    console.error("Unexpected error in getLikeStatus:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
};

// Get total like count for a post
export const getLikesCount = async (req, res) => {
  const postId = req.params.postId;
  try {
    const { count, error } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (error) {
      console.error("Error fetching likes count:", error.message);
      return res.status(500).json({ error: "Failed to fetch likes count." });
    }
    return res.status(200).json({ count });
  } catch (error) {
    console.error("Unexpected error in getLikesCount:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
};


// --- COMMENTS ---

// Add a new comment to a post
export const addComment = async (req, res) => {
  const postId = req.params.postId;
  const { content, isAnonymous, name, avatar_url } = req.body;
  const userId = req.user.uid; // Commenter's UID

  if (!userId) {
    return res.status(401).json({ error: "Authentication required to comment." });
  }
  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Comment content cannot be empty." });
  }

  try {
    // Get post owner's ID for notification recipient
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("user_id, content") // Get content for notification preview
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("Error fetching post for comment:", postError?.message || "Post not found.");
      return res.status(404).json({ error: "Post not found." });
    }

    const postOwnerId = post.user_id;
    const postContentPreview = post.content ? post.content.substring(0, 50) + "..." : "your post";


    const { data, error } = await supabase.from("comments").insert([
      {
        post_id: postId,
        user_id: isAnonymous ? null : userId,
        content,
        is_anonymous: isAnonymous,
        name: isAnonymous ? "Anonymous" : name || "User",
        avatar_url: isAnonymous ? null : avatar_url || null,
      },
    ]).select();

    if (error) {
      console.error("Error inserting comment:", error.message);
      return res.status(500).json({ error: error.message });
    }

    // NEW: Create a notification for the post owner if they are not the commenter
    if (postOwnerId !== userId) {
      await createNotification({
        recipientId: postOwnerId,
        senderId: isAnonymous ? null : userId, // Sender is null if anonymous
        type: "comment",
        postId: postId,
        commentId: data[0].id, // Pass the newly created comment's ID
        contentPreview: `${isAnonymous ? "Someone" : req.user.name || "Someone"} commented on ${postContentPreview}: "${content.substring(0, 50)}..."`,
      });
    }

    return res.status(201).json({ message: "Comment added successfully", data: data[0] });
  } catch (error) {
    console.error("Unexpected error in addComment:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
};

// Get all comments for a specific post
export const getCommentsForPost = async (req, res) => {
  const postId = req.params.postId;

  try {
    const { data: comments, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error.message);
      return res.status(500).json({ error: "Failed to fetch comments." });
    }

    return res.status(200).json({ comments });
  } catch (error) {
    console.error("Unexpected error in getCommentsForPost:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
};

// Get total comment count for a post
export const getCommentsCount = async (req, res) => {
  const postId = req.params.postId;
  try {
    const { count, error } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (error) {
      console.error("Error fetching comments count:", error.message);
      return res.status(500).json({ error: "Failed to fetch comments count." });
    }
    return res.status(200).json({ count });
  } catch (error) {
    console.error("Unexpected error in getCommentsCount:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
};


// DELETE POST
export const deletePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.uid; // Use uid from req.user

  try {
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !post || post.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized or post not found" });
    }

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      console.error("Delete error:", error);
      return res.status(500).json({ error: "Failed to delete post" });
    }

    // FIX: Decrement post_count for the user - Fetch current count, then update
    const { data: userData, error: fetchUserError } = await supabase
      .from("users")
      .select("post_count")
      .eq("id", userId)
      .single();

    if (fetchUserError || !userData) {
      console.error("Error fetching user for post count decrement:", fetchUserError?.message || "User not found.");
    } else {
      const newPostCount = Math.max(0, (userData.post_count || 0) - 1); // Ensure it doesn't go below 0
      const { error: updateError } = await supabase
        .from("users")
        .update({ post_count: newPostCount })
        .eq("id", userId);

      if (updateError) {
        console.error("Error decrementing post count:", updateError.message);
      }
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
  const userId = req.user.uid;
  const { content, tags } = req.body;

  try {
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !post || post.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized or post not found" });
    }

    const { data, error } = await supabase
      .from("posts")
      .update({ content, tags })
      .eq("id", postId);

    if (error) {
      console.error("Update error:", error);
      return res.status(500).json({ error: "Failed to update post." });
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
    // Fetch all posts
    const { data: posts, error: postError } = await supabase
      .from("posts")
      .select("*") // Select all columns, we'll get name from users table
      .order("created_at", { ascending: false });

    if (postError) {
      console.error("Error fetching posts:", postError);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }

    // Fetch all users to get their current names and avatars
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, name, avatar_url");

    if (userError) {
      console.error("Error fetching users:", userError);
      return res.status(500).json({ error: "Failed to fetch user info" });
    }

    const userMap = new Map(users.map(user => [user.id, user]));

    const combinedPosts = posts.map((post) => {
      const postOwner = userMap.get(post.user_id);
      return {
        id: post.id,
        title: post.title, // Assuming title exists or is handled
        content: post.content,
        type: post.type,
        tags: post.tags,
        link: post.link,
        created_at: post.created_at,
        likes: 0, // These will be fetched dynamically on Dashboard/YourPosts
        comments: 0, // These will be fetched dynamically on Dashboard/YourPosts
        is_anonymous: post.is_anonymous,
        // MODIFIED: Always use name/avatar from users table for non-anonymous posts
        name: post.is_anonymous
          ? "Anonymous"
          : postOwner?.name || "User", // Use userMap's name
        avatar_url: post.is_anonymous
          ? null
          : postOwner?.avatar_url || null, // Use userMap's avatar
      };
    });

    res.status(200).json({ posts: combinedPosts });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// GET USER'S OWN POSTS
export const getUserPosts = async (req, res) => {
  const userId = req.user.uid;

  try {
    const { data: posts, error: postError } = await supabase
      .from("posts")
      .select("*") // Select all columns
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (postError) {
      console.error("Error fetching user posts:", postError);
      return res.status(500).json({ error: "Failed to fetch user posts" });
    }

    // Fetch the current user's profile to get their latest name and avatar
    const { data: currentUserProfile, error: userProfileError } = await supabase
      .from("users")
      .select("name, avatar_url")
      .eq("id", userId)
      .single();

    if (userProfileError || !currentUserProfile) {
      console.error("Error fetching current user profile:", userProfileError?.message || "Profile not found.");
      // Fallback if user profile can't be fetched
      return res.status(500).json({ error: "Failed to fetch user profile for posts." });
    }

    const combinedPosts = posts.map((post) => ({
      ...post,
      // MODIFIED: Always use the current user's profile name/avatar for their own posts
      name: post.is_anonymous
        ? "Anonymous"
        : currentUserProfile.name || "User",
      avatar_url: post.is_anonymous
        ? null
        : currentUserProfile.avatar_url || null,
    }));

    res.status(200).json(combinedPosts); // Return the combined posts
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
