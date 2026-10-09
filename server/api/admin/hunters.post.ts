export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])

  const { nim, nickname, role = 'hunter' } = await readBody(event)
  if (!nim || !nickname) {
    throw createError({ statusCode: 400, statusMessage: 'NIM dan nickname wajib diisi' })
  }
  if (!['hunter', 'staff'].includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Role tidak valid (hunter / staff)' })
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      nim,
      nickname,
      password_hash: passwordHash,
      role,
      must_change_password: true,
      rank: 'F',
      total_xp: 0,
      gold: 0,
      gcp: 0,
    })
    .select('id, nim, nickname, role')
    .single()

  if (error) {
    // 23505 = unique violation di Postgres, berarti NIM sudah dipakai
    if (error.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'NIM sudah terdaftar' })
    }
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // temporary_password HANYA muncul di response ini, tidak pernah disimpan plain text
  return { ...data, temporary_password: tempPassword }
})
