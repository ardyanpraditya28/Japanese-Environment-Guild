export default defineEventHandler(async (event) => {
  const decoded = requireRole(event, ['admin', 'staff'])
  const submissionId = getRouterParam(event, 'id')
  const body = await readBody(event).catch(() => ({}))

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase.rpc('reject_submission', {
    p_submission_id: submissionId,
    p_verifier_id: decoded.id,
    p_feedback: body?.feedback || null,
  })

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return data
})
