export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const moduleId = getRouterParam(event, 'module_id')
  const { answers } = await readBody(event)

  if (!Array.isArray(answers)) {
    throw createError({ statusCode: 400, statusMessage: '"answers" harus berupa array index jawaban' })
  }

  const supabase = useSupabaseAdmin()

  const { data: progress } = await supabase
    .from('user_progress')
    .select('is_completed, quiz_passed')
    .eq('user_id', decoded.id)
    .eq('module_id', moduleId)
    .maybeSingle()

  if (!progress?.is_completed) {
    throw createError({ statusCode: 403, statusMessage: 'Selesaikan modul dulu sebelum mengakses kuis' })
  }

  const { data: mod, error } = await supabase
    .from('academy_modules')
    .select('id, xp_reward, gold_reward, quiz_data')
    .eq('id', moduleId)
    .single()

  if (error || !mod) throw createError({ statusCode: 404, statusMessage: 'Modul tidak ditemukan' })

  // quiz_data disimpan sebagai { questions: [...] }, bukan array langsung
  const rawQuestions = Array.isArray(mod.quiz_data)
    ? mod.quiz_data
    : (mod.quiz_data as any)?.questions || []
  const questions: any[] = rawQuestions
  let correct = 0
  questions.forEach((q, idx) => {
    if (answers[idx] === q.correct) correct++
  })

  const total = questions.length
  const ratio = total > 0 ? correct / total : 0
  const alreadyRewarded = progress.quiz_passed // reward cuma sekali seumur hidup per modul

  let xpAwarded = 0
  let goldAwarded = 0

  if (!alreadyRewarded) {
    xpAwarded = Math.round((mod.xp_reward || 0) * ratio)
    goldAwarded = Math.round((mod.gold_reward || 0) * ratio)

    if (xpAwarded > 0 || goldAwarded > 0) {
      await supabase.from('point_logs').insert([
        { user_id: decoded.id, action_type: `quiz_xp:${moduleId}`, points_delta: xpAwarded },
        { user_id: decoded.id, action_type: `quiz_gold:${moduleId}`, points_delta: goldAwarded },
      ])

      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp, gold')
        .eq('id', decoded.id)
        .single()

      const newXp = (profile?.total_xp || 0) + xpAwarded
      await supabase
        .from('profiles')
        .update({ total_xp: newXp, gold: (profile?.gold || 0) + goldAwarded, rank: calculateRank(newXp) })
        .eq('id', decoded.id)
    }
  }

  await supabase
    .from('user_progress')
    .update({ quiz_passed: true, quiz_score: Math.round(ratio * 100) })
    .eq('user_id', decoded.id)
    .eq('module_id', moduleId)

  return {
    correct,
    total,
    xp_awarded: xpAwarded,
    gold_awarded: goldAwarded,
    already_rewarded: alreadyRewarded,
  }
})
