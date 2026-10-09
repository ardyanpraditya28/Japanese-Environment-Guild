export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const moduleId = getRouterParam(event, 'id')

  const supabase = useSupabaseAdmin()
  const { data: mod, error: modErr } = await supabase
    .from('academy_modules')
    .select('id')
    .eq('id', moduleId)
    .single()

  if (modErr || !mod) throw createError({ statusCode: 404, statusMessage: 'Modul tidak ditemukan' })

  // upsert — kalau baris (user_id, module_id) sudah ada, di-update, bukan bikin baru
  // (butuh unique constraint dari migration day4_academy_quiz.sql)
  const { error } = await supabase.from('user_progress').upsert(
    {
      user_id: decoded.id,
      module_id: moduleId,
      is_completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,module_id' }
  )

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { quiz_unlocked: true }
})
