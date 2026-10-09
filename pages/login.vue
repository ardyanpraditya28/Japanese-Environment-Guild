<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const nim = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)
const { login } = useAuth()

async function onSubmit() {
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await login(nim.value, password.value)
    if (res.must_change_password) {
      await navigateTo('/change-password')
    } else {
      await navigateTo('/')
    }
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || 'Gagal login, coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat relative" style="background-image: url('/image/tanjiro-kamado-6082x5416-23027.jpg')">
    <div class="absolute inset-0 bg-bg/30 backdrop-blur-sm z-0"></div>
    <div class="w-full max-w-sm bg-card/90 backdrop-blur-md border border-line/50 rounded-3xl p-8 z-10 shadow-2xl">
      <div class="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
        <span class="font-heading font-extrabold text-accent text-xl">鬼</span>
      </div>
      <h1 class="font-heading font-extrabold text-2xl text-text text-center mb-1">Selamat datang, Hunter! ⛩️</h1>
      <p class="text-sm font-heading font-bold text-text text-center mb-1">Masuk ke Guild</p>
      <p class="text-sm text-muted text-center mb-6">Gunakan NIM dan password dari Ketua Guild.</p>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-heading font-bold text-muted mb-2">NIM</label>
          <input
            v-model="nim"
            type="text"
            required
            class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-cyan"
          />
        </div>
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-xs font-heading font-bold text-muted">Password</label>
            <button type="button" @click="showPassword = !showPassword" class="text-[10px] font-bold text-cyan hover:underline">
              {{ showPassword ? 'Sembunyikan' : 'Tampilkan' }}
            </button>
          </div>
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-cyan"
          />
        </div>

        <p v-if="errorMsg" class="text-sm text-accent">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-accent text-white font-heading font-bold rounded-2xl py-3 disabled:opacity-50"
        >
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>

      <p class="text-xs text-muted text-center mt-5">
        Lupa password? Hubungi <span class="text-cyan font-semibold">Ketua Guild</span>.
      </p>
    </div>
  </div>
</template>
