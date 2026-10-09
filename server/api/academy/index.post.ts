// Staff Guild: tambah materi ke academy
export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'staff'])

  const { title, path, content_url, content, xp_reward, gold_reward, quiz_data } = await readBody(event)

  if (!title || !path) {
    throw createError({ statusCode: 400, statusMessage: 'Judul dan path wajib diisi' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('academy_modules')
    .insert({
      title,
      path,
      content_url: content_url || null,
      content: content || null,
      xp_reward: xp_reward !== undefined ? Number(xp_reward) : 100,
      gold_reward: gold_reward !== undefined ? Number(gold_reward) : 10,
      quiz_data: quiz_data || null,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
