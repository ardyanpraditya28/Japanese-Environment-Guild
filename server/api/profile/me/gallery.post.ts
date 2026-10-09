const MAX_GALLERY_SLOT = 8

export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const { image_url, caption } = await readBody(event)

  if (!image_url) {
    throw createError({ statusCode: 400, statusMessage: 'image_url wajib diisi' })
  }

  const supabase = useSupabaseAdmin()

  const { count } = await supabase
    .from('user_gallery')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', decoded.id)

  if ((count ?? 0) >= MAX_GALLERY_SLOT) {
    throw createError({ statusCode: 400, statusMessage: `Slot gallery penuh (maksimal ${MAX_GALLERY_SLOT})` })
  }

  const { data, error } = await supabase
    .from('user_gallery')
    .insert({ user_id: decoded.id, image_url, caption })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
