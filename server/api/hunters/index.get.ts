export default defineEventHandler(async (event) => {
  requireAuth(event)
  const query = getQuery(event)
  const search = (query.q as string || '').trim()
  const supabase = useSupabaseAdmin()

  let req = supabase
    .from('profiles')
    .select('id, nickname, rank, total_xp, avatar_url, bio')

  if (search) {
    // Cari berdasarkan nickname (case-insensitive)
    req = req.ilike('nickname', `%${search}%`)
  }

  // Jika tidak ada query pencarian, ambil random dengan limit 20
  const { data, error } = await req
    .order('total_xp', { ascending: false })
    .limit(24)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // Jika tidak ada pencarian, acak urutan di server
  const result = search ? data : (data || []).sort(() => Math.random() - 0.5)

  return result
})
