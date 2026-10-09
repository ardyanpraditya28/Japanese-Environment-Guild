<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })
const { authHeader } = useAuth()

const nextSeasonName = ref('')
const loading = ref(false)
const result = ref<any>(null)
const errMsg = ref('')

async function closeSeason() {
  if (!confirm('Yakin tutup season sekarang? GCP semua hunter akan direset ke 0.')) return
  errMsg.value = ''
  loading.value = true
  try {
    result.value = await $fetch('/api/admin/seasons/close', {
      method: 'POST',
      headers: authHeader(),
      body: { next_season_name: nextSeasonName.value || null },
    })
  } catch (e: any) {
    errMsg.value = e?.data?.statusMessage || 'Gagal tutup season'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen font-body text-text p-6 md:p-10 flex justify-center">
    <div class="w-full max-w-sm bg-card rounded-3xl p-7">
      <span class="inline-block text-xs font-heading font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-xl mb-4">
        ◆ Aksi sensitif — admin only
      </span>
      <h1 class="font-heading font-extrabold text-lg mb-2">Tutup season</h1>
      <p class="text-xs text-muted mb-6">
        Snapshot ranking sekarang ke Hall of Fame, lalu reset GCP semua hunter ke 0.
        Tidak bisa dibatalkan.
      </p>

      <label class="block text-xs font-heading font-bold text-muted mb-2">Nama season berikutnya (opsional)</label>
      <input v-model="nextSeasonName" placeholder="Season 4 - Ganjil 2027"
        class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-cyan" />

      <p v-if="errMsg" class="text-sm text-accent mb-3">{{ errMsg }}</p>

      <button @click="closeSeason" :disabled="loading"
        class="w-full bg-accent text-white font-heading font-bold rounded-2xl py-3 disabled:opacity-50">
        {{ loading ? 'Memproses...' : 'Tutup season sekarang' }}
      </button>

      <div v-if="result" class="mt-4 text-xs text-cyan">
        Season "{{ result.closed_season }}" ditutup. Season aktif sekarang: "{{ result.next_season }}".
      </div>
    </div>
  </div>
</template>
