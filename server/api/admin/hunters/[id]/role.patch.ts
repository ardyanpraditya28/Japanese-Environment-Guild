// Admin bisa ubah role hunter ↔ staff
export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const id = getRouterParam(event, 'id')
  const { role } = await readBody(event)

  if (!['hunter', 'staff'].includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Role tidak valid (hunter / staff)' })
  }

  const supabase = useSupabaseAdmin()

  // Pastikan tidak bisa mengubah role akun admin lain
  const { data: target } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', id)
    .single()

  if (!target) throw createError({ statusCode: 404, statusMessage: 'Hunter tidak ditemukan' })
  if (target.role === 'admin') throw createError({ statusCode: 403, statusMessage: 'Tidak bisa mengubah role admin' })

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('id, nickname, role')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
