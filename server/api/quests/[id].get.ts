export default defineEventHandler(async (event) => {
  requireAuth(event)
  const id = getRouterParam(event, 'id')

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase.from('quests').select('*').eq('id', id).single()
  if (error || !data) throw createError({ statusCode: 404, statusMessage: 'Quest tidak ditemukan' })
  return data
})
