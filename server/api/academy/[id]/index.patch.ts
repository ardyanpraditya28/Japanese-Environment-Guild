// Staff Guild: update materi academy
export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'staff'])

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('academy_modules')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
