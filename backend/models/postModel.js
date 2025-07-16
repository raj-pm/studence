import supabase from "../supabaseClient.js";

export async function getUserPosts(userId) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }

  return data;
}
