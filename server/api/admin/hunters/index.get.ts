export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nim, nickname, rank, role, must_change_password, total_xp, gold, gcp, created_at')
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
