export default defineEventHandler(async (event) => {
  const { nim, password } = await readBody(event)

  if (!nim || !password) {
    throw createError({ statusCode: 400, statusMessage: 'NIM dan password wajib diisi' })
  }

  const supabase = useSupabaseAdmin()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, nim, nickname, role, password_hash, must_change_password')
    .eq('nim', nim)
    .single()

  // Sengaja pakai pesan error yang sama untuk NIM tidak ada maupun password salah,
  // supaya tidak bocor info "NIM ini terdaftar atau tidak" ke orang luar.
  if (error || !profile) {
    throw createError({ statusCode: 401, statusMessage: 'NIM atau password salah' })
  }

  const valid = await verifyPassword(password, profile.password_hash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'NIM atau password salah' })
  }

  const token = signToken({ id: profile.id, role: profile.role })

  return {
    token,
    must_change_password: profile.must_change_password,
    profile: { id: profile.id, nickname: profile.nickname, role: profile.role },
  }
})
