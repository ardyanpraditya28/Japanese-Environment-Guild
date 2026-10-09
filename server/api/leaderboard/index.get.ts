export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const supabase = useSupabaseAdmin()

  const { data: ranking, error } = await supabase
    .from('profiles')
    .select('id, nickname, gcp, rank, avatar_url')
    .order('gcp', { ascending: false })
    .limit(50)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'current_season_name')
    .maybeSingle()

  const list = ranking || []
  const myIndex = list.findIndex((r) => r.id === decoded.id)
  const me = myIndex >= 0 ? list[myIndex] : null

  return {
    season_name: setting?.value || 'Season Berjalan',
    ranking: list.map((r, i) => ({
      rank: i + 1,
      user_id: r.id,
      nickname: r.nickname,
      gcp: r.gcp,
      hunter_rank: r.rank,
      avatar_url: r.avatar_url || null,
    })),
    my_position: me
      ? {
          rank: myIndex + 1,
          gcp: me.gcp,
          avatar_url: me.avatar_url || null,
        }
      : null,
  }
})
