export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const { next_season_name } = await readBody(event)

  const supabase = useSupabaseAdmin()
  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'current_season_name')
    .maybeSingle()

  const closingSeasonName = setting?.value || 'Season Berjalan'

  const { error } = await supabase.rpc('close_season', { p_season_name: closingSeasonName })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  if (next_season_name) {
    await supabase.from('app_settings').upsert({ key: 'current_season_name', value: next_season_name })
  }

  return { closed_season: closingSeasonName, next_season: next_season_name || closingSeasonName }
})
