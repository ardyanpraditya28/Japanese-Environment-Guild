export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const itemId = getRouterParam(event, 'id')

  const supabase = useSupabaseAdmin()

  // Pastikan item tidak dalam status hidden
  const { data: item, error: itemError } = await supabase
    .from('shop_items')
    .select('is_hidden')
    .eq('id', itemId)
    .single()

  if (itemError || !item) {
    throw createError({ statusCode: 404, statusMessage: 'Item tidak ditemukan' })
  }
  if (item.is_hidden) {
    throw createError({ statusCode: 400, statusMessage: 'Item ini sedang tidak tersedia di toko' })
  }

  const { data, error } = await supabase.rpc('redeem_item', {
    p_user_id: decoded.id,
    p_item_id: itemId,
  })

  // Error yang paling sering keluar dari sini: "Gold tidak cukup",
  // "Rank belum memenuhi syarat minimum", "Stok habis" — semua dicek
  // di dalam SQL function, bukan di sini, jadi tidak bisa dilewati dari client.
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return data
})
