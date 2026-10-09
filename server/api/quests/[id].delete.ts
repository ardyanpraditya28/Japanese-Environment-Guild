export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'staff'])
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID Quest tidak valid' })

  const supabase = useSupabaseAdmin()

  // Hapus quest, submissions terkait biasanya akan ikut terhapus otomatis 
  // (atau supabase akan throw error jika restrict).
  const { error } = await supabase
    .from('quests')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true }
})
