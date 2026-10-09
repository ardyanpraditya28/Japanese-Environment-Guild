// PATCH /api/shop/:id — edit item (admin/staff only)
export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'staff'])
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const allowed = ['name', 'description', 'type', 'price_gold', 'stock', 'min_rank', 'image_url', 'is_hidden']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key] === '' ? null : body[key]
  }

  if (Object.keys(patch).length === 0)
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada field yang diubah' })

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('shop_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
