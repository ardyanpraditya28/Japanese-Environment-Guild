export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const itemId = getRouterParam(event, 'id')

  const supabase = useSupabaseAdmin()
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
