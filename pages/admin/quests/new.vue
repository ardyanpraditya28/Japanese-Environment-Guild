<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'staff'] })
const { authHeader } = useAuth()

const form = reactive({
  title: '',
  description: '',
  category: 'regular',
  reward_xp: 50,
  reward_gold: 5,
  reward_gcp: 25,
  deadline: '',
})
const errorMsg = ref('')
const success = ref(false)
const loading = ref(false)

async function onSubmit() {
  errorMsg.value = ''
  loading.value = true
  try {
    await $fetch('/api/quests', { method: 'POST', headers: authHeader(), body: form })
    success.value = true
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || 'Gagal membuat quest'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen font-body text-text p-6 md:p-10 flex justify-center">
    <div class="w-full max-w-md bg-card rounded-3xl p-7">
      <div class="flex justify-between items-start mb-5">
        <div>
          <span class="inline-block text-xs font-heading font-bold text-cyan bg-cyan/10 px-3 py-1.5 rounded-xl mb-4">
            ◆ Staff / Admin
          </span>
          <h1 class="font-heading font-extrabold text-lg">Buat quest baru</h1>
        </div>
        <NuxtLink to="/quests" class="text-xs text-muted underline">← Kembali</NuxtLink>
      </div>

      <div v-if="success" class="text-center py-6">
        <p class="text-cyan font-heading font-bold mb-3">Quest berhasil dibuat!</p>
        <NuxtLink to="/quests" class="text-xs text-muted underline">Lihat di Quest Board</NuxtLink>
      </div>

      <form v-else @submit.prevent="onSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-heading font-bold text-muted mb-2">Judul</label>
          <input v-model="form.title" required
            class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan" />
        </div>
        <div>
          <label class="block text-xs font-heading font-bold text-muted mb-2">Deskripsi</label>
          <textarea v-model="form.description" rows="3" required
            class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan"></textarea>
        </div>
        <div>
          <label class="block text-xs font-heading font-bold text-muted mb-2">Kategori</label>
          <select v-model="form.category" required
            class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan">
            <option value="event">Event Mission</option>
            <option value="regular">Regular Mission</option>
            <option value="quiz">Quiz Mission</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-heading font-bold text-muted mb-2">Deadline</label>
          <input v-model="form.deadline" type="date" required :min="new Date().toISOString().split('T')[0]"
            class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan" />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-heading font-bold text-muted mb-2">XP</label>
            <input v-model.number="form.reward_xp" type="number" required min="0"
              class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan" />
          </div>
          <div>
            <label class="block text-xs font-heading font-bold text-muted mb-2">Gold</label>
            <input v-model.number="form.reward_gold" type="number" required min="0"
              class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan" />
          </div>
          <div>
            <label class="block text-xs font-heading font-bold text-muted mb-2">GCP</label>
            <input v-model.number="form.reward_gcp" type="number" required min="0"
              class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan" />
          </div>
        </div>

        <p v-if="errorMsg" class="text-sm text-accent">{{ errorMsg }}</p>

        <button type="submit" :disabled="loading"
          class="w-full bg-accent text-white font-heading font-bold rounded-2xl py-3 disabled:opacity-50">
          {{ loading ? 'Menyimpan...' : 'Buat quest' }}
        </button>
      </form>
    </div>
  </div>
</template>
