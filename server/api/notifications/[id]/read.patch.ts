export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const id = getRouterParam(event, 'id')

  const supabase = useSupabaseAdmin()
  // filter eq('user_id', decoded.id) juga — biar orang tidak bisa iseng
  // tandai-baca notifikasi milik orang lain cuma dengan tebak UUID
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', decoded.id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
