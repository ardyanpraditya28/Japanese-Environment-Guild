export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const supabase = useSupabaseAdmin()

  const isStaff = ['admin', 'staff'].includes(decoded.role ?? '')

  const [{ data: items, error }, { data: profile }] = await Promise.all([
    supabase.from('shop_items').select('*').order('price_gold', { ascending: true }),
    supabase.from('profiles').select('gold, rank').eq('id', decoded.id).single(),
  ])

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // Admin & staff lihat semua item (termasuk hidden) supaya bisa kelola.
  // User biasa hanya lihat item yang tidak hidden.
  const visibleItems = isStaff ? (items || []) : (items || []).filter((i) => !i.is_hidden)

  return {
    items: visibleItems,
    my_gold: profile?.gold ?? 0,
    my_rank: profile?.rank ?? 'F',
  }
})
