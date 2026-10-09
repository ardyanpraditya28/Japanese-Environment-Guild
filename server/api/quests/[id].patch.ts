const ALLOWED_FIELDS = ['title', 'description', 'category', 'reward_xp', 'reward_gold', 'reward_gcp', 'deadline', 'status']

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'staff'])
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  // whitelist field — jaga-jaga kalau body kirim field aneh, cuma yang di-allow yang kepakai
  const payload: Record<string, any> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) payload[key] = body[key]
  }

  if (Object.keys(payload).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada field yang diupdate' })
  }
  if (payload.status && !['active', 'inactive'].includes(payload.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Status tidak valid' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase.from('quests').update(payload).eq('id', id).select().single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
