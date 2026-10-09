export const useAuth = () => {
  const token = useCookie<string | null>('jge_token', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7, // 7 hari, samain sama expiresIn JWT
  })
  const user = useCookie<{ id: string; nickname: string; role: string } | null>('jge_user', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7,
  })

  const isLoggedIn = computed(() => !!token.value)

  async function login(nim: string, password: string) {
    const res = await $fetch<{
      token: string
      must_change_password: boolean
      profile: { id: string; nickname: string; role: string }
    }>('/api/auth/login', { method: 'POST', body: { nim, password } })

    token.value = res.token
    user.value = res.profile
    return res
  }

  function logout() {
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  // dipakai di composable/page lain yang manggil endpoint terproteksi
  function authHeader() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  return { token, user, isLoggedIn, login, logout, authHeader }
}
