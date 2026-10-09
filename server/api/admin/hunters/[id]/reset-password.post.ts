export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const id = getRouterParam(event, 'id')

  const supabase = useSupabaseAdmin()
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', id).single()
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Hunter tidak ditemukan' })

  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)

  const { error } = await supabase
    .from('profiles')
    .update({ password_hash: passwordHash, must_change_password: true })
    .eq('id', id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // sama seperti bikin akun baru — password ini SEKALI tampil, tidak disimpan plain text
  return { temporary_password: tempPassword }
})
