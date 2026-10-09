export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const { bio, avatar_url, banner_url } = await readBody(event)

  // Sengaja cuma pick 3 field ini — meskipun body kirim total_xp/gold/gcp/rank,
  // field itu tidak pernah masuk ke query update. Ini yang menegakkan requirement
  // keamanan PRD: data reward tidak bisa diubah dari sisi client.
  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .update({ bio, avatar_url, banner_url })
    .eq('id', decoded.id)
    .select('id, nickname, bio, avatar_url, banner_url')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
