export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'staff'])
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('quests')
    .select('id, title, category, reward_xp, reward_gold, reward_gcp, deadline, status, created_at')
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
