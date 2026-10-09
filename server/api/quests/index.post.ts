export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'staff'])

  const { title, description, category, reward_xp, reward_gold, reward_gcp, deadline } = await readBody(event)

  if (!title || !category) {
    throw createError({ statusCode: 400, statusMessage: 'Judul dan kategori wajib diisi' })
  }
  if (!['event', 'regular', 'quiz'].includes(category)) {
    throw createError({ statusCode: 400, statusMessage: 'Kategori tidak valid' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('quests')
    .insert({
      title,
      description,
      category,
      reward_xp: reward_xp ?? 0,
      reward_gold: reward_gold ?? 0,
      reward_gcp: reward_gcp ?? 0,
      deadline: deadline || null,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
