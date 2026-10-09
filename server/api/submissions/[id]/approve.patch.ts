export default defineEventHandler(async (event) => {
  const decoded = requireRole(event, ['admin', 'staff'])
  const submissionId = getRouterParam(event, 'id')
  const body = await readBody(event).catch(() => ({}))

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase.rpc('approve_submission', {
    p_submission_id: submissionId,
    p_verifier_id: decoded.id,
    p_feedback: body?.feedback || null,
  })

  // Error paling umum di sini: submission sudah diproses sebelumnya
  // (dilempar dari dalam function SQL kalau status bukan 'pending' lagi) —
  // ini yang mencegah approve dobel walau di-klik dua kali cepat.
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return data
})
