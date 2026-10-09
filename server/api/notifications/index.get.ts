export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const unreadOnly = getQuery(event).unread === 'true'

  const supabase = useSupabaseAdmin()
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', decoded.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (unreadOnly) query = query.eq('is_read', false)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
