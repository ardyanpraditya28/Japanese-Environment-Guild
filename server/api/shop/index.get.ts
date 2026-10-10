export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const supabase = useSupabaseAdmin()

  const query = getQuery(event)
  const isStaff = ['admin', 'staff'].includes(decoded.role ?? '')
  const showAll = isStaff && (query.all === 'true' || query.manage === 'true')

  const [{ data: items, error }, { data: profile }] = await Promise.all([
    supabase.from('shop_items').select('*').order('price_gold', { ascending: true }),
    supabase.from('profiles').select('gold, rank').eq('id', decoded.id).single(),
  ])

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // Admin & staff hanya melihat item hidden jika secara eksplisit meminta di halaman kelola shop (?all=true).
  // Di halaman belanja publik (/shop), item hidden tidak ditampilkan kepada siapa pun.
  const visibleItems = showAll ? (items || []) : (items || []).filter((i) => !i.is_hidden)

  return {
    items: visibleItems,
    my_gold: profile?.gold ?? 0,
    my_rank: profile?.rank ?? 'F',
  }
})
