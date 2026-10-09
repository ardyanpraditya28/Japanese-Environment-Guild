export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const questId = getRouterParam(event, 'id')
  const { proof_url } = await readBody(event)

  if (!proof_url) {
    throw createError({ statusCode: 400, statusMessage: 'Bukti (link/teks) wajib diisi' })
  }

  const supabase = useSupabaseAdmin()

  const { data: quest, error: questError } = await supabase
    .from('quests')
    .select('id, status, deadline')
    .eq('id', questId)
    .single()

  if (questError || !quest || quest.status !== 'active') {
    throw createError({ statusCode: 404, statusMessage: 'Quest tidak ditemukan atau sudah tidak aktif' })
  }
  if (quest.deadline && new Date(quest.deadline) < new Date()) {
    throw createError({ statusCode: 400, statusMessage: 'Quest sudah lewat deadline' })
  }

  // Cegah hunter submit dobel selama masih ada submission pending/approved yang aktif
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('quest_id', questId)
    .eq('hunter_id', decoded.id)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Kamu sudah punya submission aktif untuk quest ini' })
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert({ quest_id: questId, hunter_id: decoded.id, proof_url, status: 'pending' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
