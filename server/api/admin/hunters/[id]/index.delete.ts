export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID tidak valid' })

  const supabase = useSupabaseAdmin()

  // Pastikan tidak bisa menghapus sesama admin
  const { data: target } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', id)
    .single()

  if (!target) throw createError({ statusCode: 404, statusMessage: 'Hunter tidak ditemukan' })
  if (target.role === 'admin') throw createError({ statusCode: 403, statusMessage: 'Tidak bisa menghapus akun sesama admin' })

  // Hapus dari Auth (otomatis akan menghapus profil jika tabel diset ON DELETE CASCADE)
  // Jika tidak cascade, kita hapus manual dulu dari profiles
  await supabase.from('profiles').delete().eq('id', id)

  const { error } = await supabase.auth.admin.deleteUser(id)

  // Abaikan error "User not found" dari Auth karena profil sudah terhapus dari DB
  if (error && !error.message.toLowerCase().includes('not found')) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true, message: 'Hunter berhasil dihapus' }
})
