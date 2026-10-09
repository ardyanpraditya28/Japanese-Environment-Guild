// DELETE /api/shop/:id — hapus item (admin/staff only)
export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'staff'])
  const id = getRouterParam(event, 'id')

  const supabase = useSupabaseAdmin()
  const { error } = await supabase.from('shop_items').delete().eq('id', id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { ok: true }
})
