export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const supabase = useSupabaseAdmin()

  const { data: quests, error } = await supabase
    .from('quests')
    .select('id, title, description, category, reward_xp, reward_gold, reward_gcp, deadline, status, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('quest_id, status')
    .eq('hunter_id', decoded.id)

  const statusMap = new Map((mySubmissions || []).map((s: any) => [s.quest_id, s.status]))

  return (quests || []).map((q: any) => ({
    ...q,
    my_submission_status: statusMap.get(q.id) ?? null,
  }))
})
