<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'auth' })

const { authHeader } = useAuth()
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function onSubmit() {
  errorMsg.value = ''
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = 'Konfirmasi password tidak cocok'
    return
  }
  loading.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'PATCH',
      headers: authHeader(),
      body: { old_password: oldPassword.value, new_password: newPassword.value },
    })
    await navigateTo('/')
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || 'Gagal ganti password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat relative" style="background-image: url('/image/tanjiro-kamado-6082x5416-23027.jpg')">
    <div class="absolute inset-0 bg-bg/80 backdrop-blur-sm z-0"></div>
    <div class="w-full max-w-sm bg-card/90 backdrop-blur-md border border-line/50 rounded-3xl p-8 z-10 shadow-2xl">
      <div class="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-5">
        <span class="font-heading font-extrabold text-gold text-xl">鍵</span>
      </div>
      <h1 class="font-heading font-extrabold text-xl text-text text-center mb-1">Ganti password kamu</h1>
      <p class="text-sm text-muted text-center mb-6">
        Password dari admin cuma sekali pakai. Buat password baru yang cuma kamu yang tahu.
      </p>

      <div class="bg-gold/10 rounded-2xl p-3 text-xs text-muted mb-5 leading-relaxed">
        Setelah ini, <span class="text-gold font-semibold">admin tidak lagi tahu</span> password kamu.
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div class="flex justify-end -mb-2">
           <button type="button" @click="showPassword = !showPassword" class="text-[10px] font-bold text-cyan hover:underline">
             {{ showPassword ? 'Sembunyikan semua password' : 'Tampilkan semua password' }}
           </button>
        </div>
        <div>
          <label class="block text-xs font-heading font-bold text-muted mb-2">Password lama (dari admin)</label>
          <input v-model="oldPassword" :type="showPassword ? 'text' : 'password'" required
            class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-cyan" />
        </div>
        <div>
          <label class="block text-xs font-heading font-bold text-muted mb-2">Password baru</label>
          <input v-model="newPassword" :type="showPassword ? 'text' : 'password'" required minlength="8"
            class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-cyan" />
        </div>
        <div>
          <label class="block text-xs font-heading font-bold text-muted mb-2">Konfirmasi password baru</label>
          <input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" required minlength="8"
            class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-cyan" />
        </div>

        <p v-if="errorMsg" class="text-sm text-accent">{{ errorMsg }}</p>

        <button type="submit" :disabled="loading"
          class="w-full bg-accent text-white font-heading font-bold rounded-2xl py-3 disabled:opacity-50">
          {{ loading ? 'Menyimpan...' : 'Simpan & lanjutkan' }}
        </button>
      </form>
    </div>
  </div>
</template>
