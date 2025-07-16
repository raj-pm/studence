import supabase from "../supabaseClient.js";

export async function updateUserProfile(userId, name, avatarUrl) {
  const { data, error } = await supabase
    .from("users")
    .update({ name, avatar_url: avatarUrl })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Supabase update error:", error);
    throw error;
  }

  return {
    name: data.name,
    avatarUrl: data.avatar_url,
  };
}
