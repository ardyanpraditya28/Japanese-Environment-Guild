<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })

const { authHeader } = useAuth()
const nim = ref('')
const nickname = ref('')
const role = ref<'hunter' | 'staff'>('hunter')
const errorMsg = ref('')
const loading = ref(false)
const createdPassword = ref<string | null>(null)

async function onSubmit() {
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await $fetch<{ temporary_password: string }>('/api/admin/hunters', {
      method: 'POST',
      headers: authHeader(),
      body: { nim: nim.value, nickname: nickname.value, role: role.value },
    })
    createdPassword.value = res.temporary_password
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || 'Gagal membuat akun'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  nim.value = ''
  nickname.value = ''
  role.value = 'hunter'
  createdPassword.value = null
}

async function copyPassword() {
  if (createdPassword.value) await navigator.clipboard.writeText(createdPassword.value)
}
</script>

<template>
  <div class="min-h-screen font-body flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-sm bg-card border border-line rounded-3xl p-8">
      <div class="flex items-center justify-between mb-4">
        <span class="inline-flex items-center gap-2 text-xs font-heading font-bold text-cyan bg-cyan/10 px-3 py-1.5 rounded-xl">
          ◆ Panel admin
        </span>
        <NuxtLink to="/admin/hunters" class="text-xs text-muted hover:text-text transition-colors">
          ← Batal
        </NuxtLink>
      </div>
      <h1 class="font-heading font-extrabold text-lg text-text mb-1">Tambah hunter baru</h1>
      <p class="text-sm text-muted mb-6">Password acak dibuat otomatis, cuma tampil sekali.</p>

      <template v-if="!createdPassword">
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-heading font-bold text-muted mb-2">Role Akun</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="role = 'hunter'"
                :class="[
                  'py-2.5 px-3 rounded-2xl text-xs font-heading font-bold border transition-all text-center flex flex-col items-center gap-1',
                  role === 'hunter'
                    ? 'border-cyan bg-cyan/10 text-cyan shadow-sm shadow-cyan/10'
                    : 'border-line bg-bg text-muted hover:text-text'
                ]"
              >
                <span>⚔️ Hunter Reguler</span>
                <span class="text-[10px] font-normal opacity-80">Anggota Guild</span>
              </button>
              <button
                type="button"
                @click="role = 'staff'"
                :class="[
                  'py-2.5 px-3 rounded-2xl text-xs font-heading font-bold border transition-all text-center flex flex-col items-center gap-1',
                  role === 'staff'
                    ? 'border-gold bg-gold/10 text-gold shadow-sm shadow-gold/10'
                    : 'border-line bg-bg text-muted hover:text-text'
                ]"
              >
                <span>📜 Staff Guild</span>
                <span class="text-[10px] font-normal opacity-80">Moderator / Pengelola</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-heading font-bold text-muted mb-2">NIM</label>
            <input v-model="nim" type="text" required placeholder="Contoh: 21010101"
              class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-cyan" />
          </div>
          <div>
            <label class="block text-xs font-heading font-bold text-muted mb-2">Nickname</label>
            <input v-model="nickname" type="text" required placeholder="Contoh: Kirito"
              class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-cyan" />
          </div>

          <p v-if="errorMsg" class="text-sm text-accent">{{ errorMsg }}</p>

          <button type="submit" :disabled="loading"
            class="w-full bg-accent hover:opacity-90 transition-opacity text-white font-heading font-bold rounded-2xl py-3 disabled:opacity-50">
            {{ loading ? 'Membuat...' : 'Buat akun' }}
          </button>
        </form>
      </template>

      <template v-else>
        <div class="bg-bg border border-dashed border-cyan rounded-2xl p-5 text-center mb-4">
          <div class="text-xs font-heading font-bold text-muted uppercase tracking-wide mb-2">Password sekali tampil</div>
          <div class="font-heading font-extrabold text-2xl text-cyan tracking-widest mb-3">{{ createdPassword }}</div>
          <button @click="copyPassword" class="text-xs font-heading font-bold text-text bg-card px-4 py-2 rounded-xl">
            Salin password
          </button>
        </div>
        <div class="bg-accent/10 rounded-2xl p-3 text-xs text-muted mb-5 leading-relaxed">
          <span class="text-accent font-semibold">Sampaikan manual</span> ke hunter sekarang — password ini tidak bisa dilihat ulang.
        </div>
        <button @click="resetForm" class="w-full border border-line text-muted font-heading font-bold rounded-2xl py-3">
          Tambah hunter lain
        </button>
      </template>
    </div>
  </div>
</template>
