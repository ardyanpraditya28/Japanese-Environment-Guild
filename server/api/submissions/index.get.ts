export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'staff'])
  const status = (getQuery(event).status as string) || 'pending'

  const supabase = useSupabaseAdmin()
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('id, quest_id, hunter_id, proof_url, status, feedback, created_at')
    .eq('status', status)
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!submissions?.length) return []

  // Ambil quest & hunter terkait lewat query terpisah (bukan nested select)
  // supaya tidak bergantung nama constraint foreign key yang di-generate Supabase.
  const questIds = [...new Set(submissions.map((s) => s.quest_id))]
  const hunterIds = [...new Set(submissions.map((s) => s.hunter_id))]

  const { data: quests } = await supabase
    .from('quests')
    .select('id, title, category, reward_xp, reward_gold, reward_gcp')
    .in('id', questIds)
  const { data: hunters } = await supabase.from('profiles').select('id, nickname, nim').in('id', hunterIds)

  const questMap = new Map((quests || []).map((q) => [q.id, q]))
  const hunterMap = new Map((hunters || []).map((h) => [h.id, h]))

  return submissions.map((s) => ({
    ...s,
    quest: questMap.get(s.quest_id),
    hunter: hunterMap.get(s.hunter_id),
  }))
})
