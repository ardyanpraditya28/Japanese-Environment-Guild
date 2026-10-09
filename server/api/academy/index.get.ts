export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const path = getQuery(event).path as string | undefined
  const isStaff = ['admin', 'staff'].includes(decoded.role)

  const supabase = useSupabaseAdmin()
  
  // Jika staff, kita include quiz_data supaya mereka bisa edit/review kuisnya
  // Note: select() string harus literal agar TypeScript bisa infer tipenya dengan benar
  const staffSelect = 'id, title, path, content_url, content, xp_reward, gold_reward, quiz_data' as const
  const userSelect = 'id, title, path, content_url, content, xp_reward, gold_reward' as const

  let baseQuery = isStaff
    ? supabase.from('academy_modules').select(staffSelect)
    : supabase.from('academy_modules').select(userSelect)

  if (path) baseQuery = baseQuery.eq('path', path) as typeof baseQuery

  const { data: modules, error } = await baseQuery.order('title')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const { data: progress } = await supabase
    .from('user_progress')
    .select('module_id, is_completed, quiz_passed, quiz_score')
    .eq('user_id', decoded.id)

  const progressMap = new Map((progress || []).map((p) => [p.module_id, p]))

  return (modules || []).map((m) => {
    const p = progressMap.get(m.id)
    return {
      id: m.id,
      title: m.title,
      path: m.path,
      content_url: m.content_url,
      content: m.content,
      xp_reward: m.xp_reward,
      gold_reward: m.gold_reward,
      quiz_data: (m as any).quiz_data ?? null, // hanya ada isStaff (admin/staff)
      is_completed: p?.is_completed ?? false,
      quiz_unlocked: p?.is_completed ?? false,
      quiz_passed: p?.quiz_passed ?? false,
      quiz_score: p?.quiz_score ?? null,
    }
  })
})
