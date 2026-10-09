// GET single module detail (termasuk content untuk bacaan)
export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const id = getRouterParam(event, 'id')

  const supabase = useSupabaseAdmin()

  const { data: m, error } = await supabase
    .from('academy_modules')
    .select('id, title, path, content_url, content, xp_reward, gold_reward')
    .eq('id', id)
    .single()

  if (error || !m) throw createError({ statusCode: 404, statusMessage: 'Modul tidak ditemukan' })

  const { data: progress } = await supabase
    .from('user_progress')
    .select('is_completed, quiz_passed, quiz_score')
    .eq('user_id', decoded.id)
    .eq('module_id', id)
    .maybeSingle()

  return {
    id: m.id,
    title: m.title,
    path: m.path,
    content_url: m.content_url,
    content: m.content,
    xp_reward: m.xp_reward,
    gold_reward: m.gold_reward,
    is_completed: progress?.is_completed ?? false,
    quiz_passed: progress?.quiz_passed ?? false,
    quiz_score: progress?.quiz_score ?? null,
  }
})
