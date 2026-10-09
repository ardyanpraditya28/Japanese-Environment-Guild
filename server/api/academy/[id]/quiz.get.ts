export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const moduleId = getRouterParam(event, 'id')
  const supabase = useSupabaseAdmin()

  const { data: progress } = await supabase
    .from('user_progress')
    .select('is_completed')
    .eq('user_id', decoded.id)
    .eq('module_id', moduleId)
    .maybeSingle()

  if (!progress?.is_completed) {
    throw createError({ statusCode: 403, statusMessage: 'Selesaikan modul dulu sebelum mengakses kuis' })
  }

  const { data: mod, error } = await supabase
    .from('academy_modules')
    .select('id, title, quiz_data')
    .eq('id', moduleId)
    .single()

  if (error || !mod) throw createError({ statusCode: 404, statusMessage: 'Modul tidak ditemukan' })

  // quiz_data disimpan sebagai { questions: [...] }, bukan array langsung
  const rawQuestions = Array.isArray(mod.quiz_data)
    ? mod.quiz_data
    : (mod.quiz_data as any)?.questions || []

  if (rawQuestions.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Modul ini belum memiliki soal kuis' })
  }

  const questions = rawQuestions.map((q: any, idx: number) => ({
    index: idx,
    question: q.question,
    options: q.options,
    // correct_index SENGAJA tidak dikirim ke client
  }))

  return { module_id: mod.id, title: mod.title, questions }
})
