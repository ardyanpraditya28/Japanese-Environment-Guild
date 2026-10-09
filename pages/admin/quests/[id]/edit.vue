<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'staff'] })
const route = useRoute()
const { authHeader } = useAuth()

const { data: quest, pending } = await useFetch(`/api/quests/${route.params.id}`, { headers: authHeader() })

const form = reactive({
  title: '', description: '', category: 'regular',
  reward_xp: 0, reward_gold: 0, reward_gcp: 0, deadline: '',
})

watchEffect(() => {
  if (quest.value) {
    form.title = quest.value.title
    form.description = quest.value.description || ''
    form.category = quest.value.category
    form.reward_xp = quest.value.reward_xp
    form.reward_gold = quest.value.reward_gold
    form.reward_gcp = quest.value.reward_gcp
    form.deadline = quest.value.deadline ? quest.value.deadline.slice(0, 10) : ''
  }
})

const loading = ref(false)
const success = ref(false)
const errMsg = ref('')

async function onSubmit() {
  errMsg.value = ''
  loading.value = true
  try {
    await $fetch(`/api/quests/${route.params.id}`, { method: 'PATCH', headers: authHeader(), body: form })
    success.value = true
  } catch (e: any) {
    errMsg.value = e?.data?.statusMessage || 'Gagal menyimpan'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen font-body text-text p-6 md:p-10 flex justify-center">
    <div class="w-full max-w-md bg-card rounded-3xl p-7">
      <div class="flex justify-between items-center mb-5">
        <h1 class="font-heading font-extrabold text-lg">Edit Quest</h1>
        <NuxtLink to="/quests" class="text-xs text-muted underline">← Kembali</NuxtLink>
      </div>

      <UiLoading v-if="pending" :rows="3" />

      <template v-else>
        <p v-if="success" class="text-cyan text-sm font-heading font-bold mb-4">Tersimpan!</p>

        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-heading font-bold text-muted mb-2">Judul</label>
            <input v-model="form.title" required
              class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan" />
          </div>
          <div>
            <label class="block text-xs font-heading font-bold text-muted mb-2">Deskripsi</label>
            <textarea v-model="form.description" rows="3"
              class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan"></textarea>
          </div>
          <div>
            <label class="block text-xs font-heading font-bold text-muted mb-2">Kategori</label>
            <select v-model="form.category"
              class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan">
              <option value="event">Event Mission</option>
              <option value="regular">Regular Mission</option>
              <option value="quiz">Quiz Mission</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-heading font-bold text-muted mb-2">Deadline</label>
            <input v-model="form.deadline" type="date"
              class="w-full bg-bg border border-line rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan" />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-heading font-bold text-muted mb-2">XP</label>
              <input v-model.number="form.reward_xp" type="number"
                class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan" />
            </div>
            <div>
              <label class="block text-xs font-heading font-bold text-muted mb-2">Gold</label>
              <input v-model.number="form.reward_gold" type="number"
                class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan" />
            </div>
            <div>
              <label class="block text-xs font-heading font-bold text-muted mb-2">GCP</label>
              <input v-model.number="form.reward_gcp" type="number"
                class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan" />
            </div>
          </div>

          <p v-if="errMsg" class="text-sm text-accent">{{ errMsg }}</p>

          <button type="submit" :disabled="loading"
            class="w-full bg-accent text-white font-heading font-bold rounded-2xl py-3 disabled:opacity-50">
            {{ loading ? 'Menyimpan...' : 'Simpan perubahan' }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>
