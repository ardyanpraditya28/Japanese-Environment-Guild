export default defineEventHandler(async (event) => {
  const decoded = requireAuth(event) // pastikan user login
  const supabase = useSupabaseAdmin()

  // Nuxt/h3 punya fungsi bawaan untuk membaca multipart form-data (file upload)
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada file yang diunggah' })
  }

  const file = formData[0] // Asumsikan file ada di elemen pertama
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: 'Data file tidak valid' })
  }
  
  // Buat nama file unik (misal: user_id/timestamp-filename)
  const fileExt = file.filename?.split('.').pop() || 'png'
  const uniqueName = `${decoded.id}/${Date.now()}-${Math.round(Math.random() * 1000)}.${fileExt}`

  // Upload ke Supabase Storage (bucket bernama 'uploads')
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(uniqueName, file.data, {
      contentType: file.type,
      upsert: false
    })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Dapatkan Public URL dari file yang baru diupload
  const { data: publicUrlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(uniqueName)

  return {
    url: publicUrlData.publicUrl
  }
})
