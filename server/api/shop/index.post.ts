// Staff Guild: tambah item ke shop (Gold Sink)
export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'staff'])

  const { name, description, type, price_gold, image_url, stock, min_rank } = await readBody(event)

  if (!name || !price_gold) {
    throw createError({ statusCode: 400, statusMessage: 'Nama dan harga wajib diisi' })
  }
  if (!type) {
    throw createError({ statusCode: 400, statusMessage: 'Tipe item wajib dipilih' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('shop_items')
    .insert({
      name,
      description: description || null,
      type,
      price_gold: Number(price_gold),
      image_url:  image_url  || null,
      stock:      stock !== undefined && stock !== null ? Number(stock) : null,
      min_rank:   min_rank   || null,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})

