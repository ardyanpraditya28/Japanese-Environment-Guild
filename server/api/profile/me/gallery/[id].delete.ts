export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const galleryItemId = getRouterParam(event, 'id')
  const supabase = useSupabaseAdmin()

  // Pastikan item ini memang milik user yang request (security check)
  const { data: item, error: fetchError } = await supabase
    .from('user_gallery')
    .select('id, user_id')
    .eq('id', galleryItemId)
    .single()

  if (fetchError || !item) {
    throw createError({ statusCode: 404, statusMessage: 'Item tidak ditemukan' })
  }

  if (item.user_id !== decoded.id) {
    throw createError({ statusCode: 403, statusMessage: 'Kamu tidak punya izin untuk menghapus item ini' })
  }

  const { error } = await supabase
    .from('user_gallery')
    .delete()
    .eq('id', galleryItemId)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true }
})
