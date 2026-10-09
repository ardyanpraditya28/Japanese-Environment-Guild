export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event)
  const { old_password, new_password } = await readBody(event)

  if (!old_password || !new_password) {
    throw createError({ statusCode: 400, statusMessage: 'Password lama dan baru wajib diisi' })
  }
  if (new_password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password baru minimal 8 karakter' })
  }

  const supabase = useSupabaseAdmin()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, password_hash')
    .eq('id', decoded.id)
    .single()

  if (error || !profile) {
    throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' })
  }

  const valid = await verifyPassword(old_password, profile.password_hash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Password lama salah' })
  }

  const newHash = await hashPassword(new_password)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ password_hash: newHash, must_change_password: false })
    .eq('id', decoded.id)

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: updateError.message })
  }

  return { success: true }
})
