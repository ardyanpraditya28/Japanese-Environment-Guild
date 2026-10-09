export default defineEventHandler(async (event) => {
  requireAuth(event) // sekadar mastiin yang buka udah login, bukan filter role
  const id = getRouterParam(event, 'id')
  const supabase = useSupabaseAdmin()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, nickname, rank, total_xp, gold, gcp, avatar_url, banner_url, bio, border_id, created_at')
    .eq('id', id)
    .single()

  if (error || !profile) {
    throw createError({ statusCode: 404, statusMessage: 'Hunter tidak ditemukan' })
  }

  const { data: badgeRows } = await supabase
    .from('user_badges')
    .select('badges ( id, name, image_url )')
    .eq('user_id', id)

  const { data: gallery } = await supabase
    .from('user_gallery')
    .select('id, image_url, caption')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const { count: completedCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('hunter_id', id)
    .eq('status', 'approved')

  const { data: recentLogs } = await supabase
    .from('point_logs')
    .select('action_type, points_delta, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    ...profile,
    badges: (badgeRows || []).map((row: any) => row.badges),
    gallery: gallery || [],
    completed_count: completedCount || 0,
    recent_logs: recentLogs || [],
    rank_progress: nextRankInfo(profile.total_xp),
  }
})
