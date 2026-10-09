<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const { authHeader, user } = useAuth()

// Fetch module detail langsung dari API (termasuk content)
const { data: mod, pending, error, refresh } = await useFetch(`/api/academy/${route.params.id}`, {
  headers: authHeader(),
})

const isStaff = computed(() => ['admin', 'staff'].includes(user.value?.role || ''))

// -- Baca Materi & Quiz --
const view = ref<'read' | 'quiz' | 'result'>('read')
const answers = ref<number[]>([])
const submitting = ref(false)
const result = ref<any>(null)
const errMsg = ref('')
const marking = ref(false)

// Quiz data datang dari API setelah modul di-load
const { data: quizData, pending: quizPending, refresh: refreshQuiz } = await useFetch(`/api/academy/${route.params.id}/quiz`, {
  headers: authHeader(),
  lazy: true,
})

async function markComplete() {
  marking.value = true
  try {
    await $fetch(`/api/academy/${route.params.id}/complete`, { method: 'POST', headers: authHeader() })
    await refresh()
    await refreshQuiz()
    view.value = 'quiz'
    answers.value = []
  } finally {
    marking.value = false
  }
}

function startQuiz() {
  view.value = 'quiz'
  answers.value = []
  result.value = null
  errMsg.value = ''
}

async function submitQuiz() {
  errMsg.value = ''
  submitting.value = true
  try {
    result.value = await $fetch(`/api/quiz/${route.params.id}/attempt`, {
      method: 'POST',
      headers: authHeader(),
      body: { answers: answers.value },
    })
    view.value = 'result'
  } catch (e: any) {
    errMsg.value = e?.data?.statusMessage || 'Gagal submit kuis'
  } finally {
    submitting.value = false
  }
}

function retakeQuiz() {
  view.value = 'quiz'
  answers.value = []
  result.value = null
  errMsg.value = ''
}

// Pastikan URL selalu punya protokol https://
function normalizeUrl(url: string): string {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  return 'https://' + url
}
</script>

<template>
  <div class="min-h-screen font-body text-text p-6 md:p-10 flex justify-center">
    <div class="w-full max-w-2xl">
      <NuxtLink to="/academy" class="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors mb-6">
        ← Kembali ke Academy
      </NuxtLink>

      <div v-if="pending" class="text-muted text-sm">Memuat modul...</div>
      <div v-else-if="error" class="text-accent text-sm">Gagal memuat modul.</div>

      <template v-else-if="mod">
        <!-- Header Modul -->
        <div class="mb-6">
          <h1 class="font-heading font-extrabold text-2xl mb-1">{{ mod.title }}</h1>
          <div class="flex gap-4 text-xs font-heading font-bold text-muted">
            <span>{{ mod.xp_reward }} XP</span>
            <span>{{ mod.gold_reward }} Gold</span>
          </div>
        </div>

        <!-- Tab: Baca Materi -->
        <template v-if="view === 'read'">
          <div class="bg-card rounded-3xl p-6 mb-6">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-6 h-6 rounded-lg bg-cyan/10 flex items-center justify-center font-heading text-xs text-cyan">📖</span>
              <h2 class="font-heading font-bold text-sm text-muted uppercase tracking-wide">Materi Pelajaran</h2>
            </div>

            <!-- Konten teks langsung dari database -->
            <div v-if="mod.content?.trim()" class="prose prose-sm max-w-none text-text leading-relaxed whitespace-pre-wrap text-sm">
              {{ mod.content }}
            </div>
            <!-- Link eksternal (tampil meski ada content teks juga) -->
            <div v-if="mod.content_url?.trim()" :class="mod.content?.trim() ? 'mt-4 border-t border-line pt-4' : ''" class="flex items-center gap-2 text-sm">
              <span class="text-muted">📎 Materi eksternal:</span>
              <a :href="normalizeUrl(mod.content_url)" target="_blank" rel="noopener noreferrer"
                class="text-cyan underline hover:opacity-80 transition-opacity break-all">
                Buka link materi
              </a>
            </div>
            <!-- Fallback: belum ada isi sama sekali -->
            <div v-if="!mod.content?.trim() && !mod.content_url?.trim()" class="bg-bg rounded-2xl p-4 text-sm text-muted italic">
              Materi belum diisi oleh staff.
            </div>
          </div>

          <!-- Tombol aksi -->
          <div v-if="!mod.is_completed">
            <button @click="markComplete" :disabled="marking"
              class="w-full bg-accent hover:opacity-90 transition-opacity text-white font-heading font-bold rounded-2xl py-3.5 disabled:opacity-50 flex items-center justify-center gap-2">
              <span v-if="marking">Menyimpan...</span>
              <span v-else>Selesai Baca — Mulai Kuis ✏️</span>
            </button>
          </div>
          <div v-else>
            <button v-if="!mod.quiz_passed" @click="startQuiz"
              class="w-full bg-gold hover:opacity-90 transition-opacity text-white font-heading font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2">
              Kerjakan Kuis 📝
            </button>
            <div v-else class="bg-cyan/10 rounded-2xl p-4 text-center">
              <p class="text-cyan font-heading font-bold text-sm">✓ Kuis selesai</p>
              <p class="text-muted text-xs mt-1">Skor: {{ mod.quiz_score }}%</p>
              <button @click="startQuiz" class="mt-3 text-xs text-muted underline hover:text-text">Coba lagi (tanpa reward)</button>
            </div>
          </div>
        </template>

        <!-- Tab: Kuis -->
        <template v-if="view === 'quiz'">
          <div v-if="quizPending" class="text-muted text-sm">Memuat kuis...</div>
          <template v-else-if="quizData">
            <div class="flex items-center justify-between mb-6">
              <h2 class="font-heading font-extrabold text-lg">✏️ Kuis: {{ quizData.title }}</h2>
              <button @click="view = 'read'" class="text-xs text-muted underline hover:text-text">← Baca ulang materi</button>
            </div>

            <div v-for="q in quizData.questions" :key="q.index" class="bg-card rounded-2xl p-5 mb-4">
              <p class="text-sm font-semibold mb-3">{{ q.index + 1 }}. {{ q.question }}</p>
              <div class="space-y-2">
                <label v-for="(opt, oi) in q.options" :key="oi"
                  class="flex items-center gap-3 text-sm bg-bg rounded-xl px-4 py-2.5 cursor-pointer transition-colors"
                  :class="answers[q.index] === oi ? 'border border-cyan bg-cyan/5' : 'border border-transparent hover:border-line'">
                  <input type="radio" :name="`q-${q.index}`" :value="oi" @change="answers[q.index] = oi" class="accent-cyan" />
                  {{ opt }}
                </label>
              </div>
            </div>

            <p v-if="errMsg" class="text-accent text-sm mb-3">{{ errMsg }}</p>

            <button @click="submitQuiz" :disabled="submitting || answers.length < quizData.questions.length"
              class="w-full bg-accent hover:opacity-90 transition-opacity text-white font-heading font-bold rounded-2xl py-3.5 disabled:opacity-50">
              {{ submitting ? 'Menilai...' : 'Submit Jawaban' }}
            </button>
            <p v-if="answers.length < (quizData?.questions?.length || 0)" class="text-center text-xs text-muted mt-2">
              Isi semua {{ quizData.questions.length }} soal terlebih dahulu
            </p>
          </template>
        </template>

        <!-- Tab: Hasil Kuis -->
        <template v-if="view === 'result' && result">
          <div class="bg-card rounded-3xl p-8 text-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
              :class="(result.correct / result.total) >= 0.7 ? 'bg-cyan/10' : 'bg-accent/10'">
              {{ (result.correct / result.total) >= 0.7 ? '🎉' : '📚' }}
            </div>
            <p class="font-heading font-extrabold text-3xl mb-1">{{ result.correct }}/{{ result.total }}</p>
            <p class="text-muted text-sm mb-4">{{ Math.round((result.correct/result.total)*100) }}% benar</p>

            <div v-if="result.already_rewarded" class="bg-bg rounded-2xl p-3 text-xs text-muted mb-5">
              Reward sudah pernah diambil sebelumnya, skor ini hanya tercatat.
            </div>
            <div v-else class="flex gap-4 justify-center mb-5">
              <div class="bg-muted/10 rounded-2xl px-5 py-3">
                <p class="font-heading font-extrabold text-gold text-xl">+{{ result.xp_awarded }}</p>
                <p class="text-xs text-muted">XP</p>
              </div>
              <div class="bg-muted/10 rounded-2xl px-5 py-3">
                <p class="font-heading font-extrabold text-gold text-xl">+{{ result.gold_awarded }}</p>
                <p class="text-xs text-muted">Gold</p>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <NuxtLink to="/academy" class="w-full bg-cyan text-white font-heading font-bold rounded-2xl py-3 text-sm hover:opacity-90 transition-opacity">
                Kembali ke Academy
              </NuxtLink>
              <button @click="retakeQuiz" class="text-xs text-muted underline hover:text-text">
                Coba lagi (tanpa reward tambahan)
              </button>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
