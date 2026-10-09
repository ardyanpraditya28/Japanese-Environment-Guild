export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()
  if (!['admin', 'staff'].includes(user.value?.role || '')) {
    return navigateTo('/')
  }
})
