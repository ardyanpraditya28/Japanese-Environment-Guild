export default defineEventHandler(async (event) => {
  requireAuth(event)
  const supabase = useSupabaseAdmin()

  const { data: history, error } = await supabase
    .from('leaderboard_history')
    .select('id, season_name, user_id, final_gcp, rank_at_time, created_at')
    .order('season_name', { ascending: false })
    .order('rank_at_time', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!history?.length) return []

  const userIds = [...new Set(history.map((h) => h.user_id))]
  const { data: hunters } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url')
    .in('id', userIds)

  const profileMap = new Map((hunters || []).map((h) => [h.id, { nickname: h.nickname, avatar_url: h.avatar_url }]))

  // Kelompokkan per season, ambil top 3 per season
  const seasonMap = new Map<string, any[]>()
  for (const h of history) {
    const profile = profileMap.get(h.user_id)
    const entry = {
      ...h,
      nickname: profile?.nickname || 'Unknown',
      avatar_url: profile?.avatar_url || null,
    }
    if (!seasonMap.has(h.season_name)) seasonMap.set(h.season_name, [])
    const list = seasonMap.get(h.season_name)!
    if (list.length < 3) list.push(entry)
  }

  // Ubah ke array seasons dengan top3
  const seasons = Array.from(seasonMap.entries()).map(([season_name, top3]) => ({
    season_name,
    top3,
  }))

  return seasons
})
