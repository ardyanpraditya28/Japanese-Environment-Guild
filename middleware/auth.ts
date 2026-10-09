export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn.value && to.path !== '/login') {
    return navigateTo('/login')
  }
})
