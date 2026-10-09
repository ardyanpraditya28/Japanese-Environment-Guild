export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const supabase = useSupabaseAdmin()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nickname, rank, total_xp, gold, gcp')
    .eq('id', decoded.id)
    .single()

  if (!profile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Profile not found'
    })
  }

  const { count: completedCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('hunter_id', decoded.id)
    .eq('status', 'approved')

  // Aktivitas 7 hari terakhir — dihitung dari jumlah baris point_logs per hari,
  // bukan strict XP, biar merepresentasikan "seberapa aktif" bukan cuma satu angka.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: logs } = await supabase
    .from('point_logs')
    .select('created_at')
    .eq('user_id', decoded.id)
    .gte('created_at', sevenDaysAgo)

  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { label: dayLabels[d.getDay()], count: 0, dateKey: d.toISOString().slice(0, 10) }
  })
  ;(logs || []).forEach((l: any) => {
    const key = (l.created_at as string).slice(0, 10)
    const bucket = buckets.find((b) => b.dateKey === key)
    if (bucket) bucket.count++
  })

  const { data: recentLogs } = await supabase
    .from('point_logs')
    .select('action_type, points_delta, created_at')
    .eq('user_id', decoded.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: activeQuests } = await supabase
    .from('quests')
    .select('id, title, category, reward_xp, reward_gold, reward_gcp')
    .eq('status', 'active')
    .limit(10)

  const { data: mySubs } = await supabase.from('submissions').select('quest_id').eq('hunter_id', decoded.id)
  const takenIds = new Set((mySubs || []).map((s: any) => s.quest_id))
  const recommended = (activeQuests || []).find((q: any) => !takenIds.has(q.id)) || null

  return {
    profile,
    completed_count: completedCount || 0,
    weekly_activity: buckets.map((b) => ({ label: b.label, count: b.count })),
    recent_logs: recentLogs || [],
    recommended_quest: recommended,
    rank_progress: nextRankInfo(profile.total_xp),
  }
})
