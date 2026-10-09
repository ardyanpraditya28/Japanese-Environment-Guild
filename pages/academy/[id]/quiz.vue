<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const { authHeader } = useAuth()

const { data: quiz, pending, error } = await useFetch(`/api/academy/${route.params.id}/quiz`, {
  headers: authHeader(),
})

const answers = ref<number[]>([])
const submitting = ref(false)
const result = ref<any>(null)
const errMsg = ref('')

async function submit() {
  errMsg.value = ''
  submitting.value = true
  try {
    result.value = await $fetch(`/api/quiz/${route.params.id}/attempt`, {
      method: 'POST',
      headers: authHeader(),
      body: { answers: answers.value },
    })
  } catch (e: any) {
    errMsg.value = e?.data?.statusMessage || 'Gagal submit kuis'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen font-body text-text p-6 md:p-10 flex justify-center">
    <div class="w-full max-w-lg">
      <div v-if="pending" class="text-muted">Memuat kuis...</div>
      <div v-else-if="error" class="text-accent text-sm">{{ (error as any)?.data?.statusMessage || 'Gagal memuat kuis' }}</div>

      <template v-else-if="!result">
        <h1 class="font-heading font-extrabold text-lg mb-6">Kuis: {{ quiz.title }}</h1>

        <div v-for="q in quiz.questions" :key="q.index" class="bg-card rounded-2xl p-5 mb-4">
          <p class="text-sm font-semibold mb-3">{{ q.index + 1 }}. {{ q.question }}</p>
          <div class="space-y-2">
            <label v-for="(opt, oi) in q.options" :key="oi"
              class="flex items-center gap-3 text-sm bg-bg rounded-xl px-4 py-2.5 cursor-pointer"
              :class="answers[q.index] === oi ? 'border border-cyan' : 'border border-transparent'">
              <input type="radio" :name="`q-${q.index}`" :value="oi" @change="answers[q.index] = oi" />
              {{ opt }}
            </label>
          </div>
        </div>

        <p v-if="errMsg" class="text-accent text-sm mb-3">{{ errMsg }}</p>

        <button @click="submit" :disabled="submitting || answers.length < quiz.questions.length"
          class="w-full bg-accent text-white font-heading font-bold rounded-2xl py-3 disabled:opacity-50">
          {{ submitting ? 'Menilai...' : 'Submit jawaban' }}
        </button>
      </template>

      <div v-else class="bg-card rounded-3xl p-7 text-center">
        <p class="font-heading font-extrabold text-xl mb-2">{{ result.correct }}/{{ result.total }} benar</p>
        <p v-if="result.already_rewarded" class="text-muted text-sm mb-4">
          Reward sudah pernah diambil sebelumnya, skor ini cuma tercatat.
        </p>
        <p v-else class="text-sm mb-4">
          Kamu dapat <span class="text-gold font-bold">+{{ result.xp_awarded }} XP</span> dan
          <span class="text-gold font-bold">+{{ result.gold_awarded }} Gold</span>!
        </p>
        <NuxtLink to="/academy" class="text-cyan text-sm underline">Kembali ke Academy</NuxtLink>
      </div>
    </div>
  </div>
</template>
