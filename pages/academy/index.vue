<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { authHeader, user } = useAuth()

const isStaff = computed(() => ['admin', 'staff'].includes(user.value?.role || ''))
const activeTab = ref<'learn' | 'manage'>('learn')

// --- Tab Learn: Daftar Modul untuk Hunter ---
const { data: modules, pending, refresh } = await useFetch('/api/academy', { headers: authHeader() })

onMounted(() => {
  refresh()
})

const huruf = computed(() => modules.value?.filter((m: any) => m.path === 'huruf') || [])
const grammar = computed(() => modules.value?.filter((m: any) => m.path === 'grammar') || [])

function statusOf(m: any) {
  if (m.quiz_passed) return { label: 'Selesai', color: 'text-cyan', bg: 'bg-cyan/10', icon: '✓' }
  if (m.is_completed) return { label: 'Kuis tersedia', color: 'text-gold', bg: 'bg-gold/10', icon: '!' }
  return { label: 'Belum dibuka', color: 'text-muted', bg: 'bg-bg', icon: '–' }
}

// --- Tab Manage: Kelola Modul untuk Staff ---
const showForm = ref(false)
const editingModule = ref<any>(null)

const form = reactive({
  title: '',
  path: 'huruf',
  content: '',
  content_url: '',
  xp_reward: 100,
  gold_reward: 10,
})

// Form quiz: array soal
const quizQuestions = ref<{ question: string; options: string[]; correct: number }[]>([])

function addQuestion() {
  quizQuestions.value.push({ question: '', options: ['', '', '', ''], correct: 0 })
}

function removeQuestion(i: number) {
  quizQuestions.value.splice(i, 1)
}

const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

function openCreate() {
  editingModule.value = null
  form.title = ''
  form.path = 'huruf'
  form.content = ''
  form.content_url = ''
  form.xp_reward = 100
  form.gold_reward = 10
  quizQuestions.value = []
  saveError.value = ''
  saveSuccess.value = false
  showForm.value = true
}

function openEdit(m: any) {
  editingModule.value = m
  form.title = m.title
  form.path = m.path
  form.content = m.content || ''
  form.content_url = m.content_url || ''
  form.xp_reward = m.xp_reward || 100
  form.gold_reward = m.gold_reward || 10
  // Parse quiz data if any
  quizQuestions.value = m.quiz_data?.questions
    ? m.quiz_data.questions.map((q: any) => ({
        question: q.question,
        options: [...q.options],
        correct: q.correct,
      }))
    : []
  saveError.value = ''
  saveSuccess.value = false
  showForm.value = true
}

async function saveModule() {
  saveError.value = ''
  saving.value = true

  const quiz_data = quizQuestions.value.length > 0
    ? {
        questions: quizQuestions.value.map((q, i) => ({
          index: i,
          question: q.question,
          options: q.options,
          correct: q.correct,
        }))
      }
    : null

  const body = { ...form, quiz_data }

  try {
    if (editingModule.value) {
      await $fetch(`/api/academy/${editingModule.value.id}`, {
        method: 'PATCH',
        headers: authHeader(),
        body,
      })
    } else {
      await $fetch('/api/academy', {
        method: 'POST',
        headers: authHeader(),
        body,
      })
    }
    saveSuccess.value = true
    await refresh()
    setTimeout(() => { showForm.value = false; saveSuccess.value = false }, 1500)
  } catch (e: any) {
    saveError.value = e?.data?.statusMessage || 'Gagal menyimpan'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen font-body text-text p-6 md:p-10">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="font-heading font-extrabold text-xl mb-1">Hunter Academy</h1>
        <p class="text-muted text-sm">Pelajari bahasa Jepang, selesaikan kuis, raih XP.</p>
      </div>
      <NuxtLink to="/" class="text-xs text-muted underline">← Kembali</NuxtLink>
    </div>

    <!-- Tabs (Staff Only) -->
    <div v-if="isStaff" class="flex gap-2 mb-6 p-1 bg-card rounded-2xl w-full max-w-xs">
      <button @click="activeTab = 'learn'"
        class="flex-1 py-2 text-xs font-heading font-bold rounded-xl transition-colors"
        :class="activeTab === 'learn' ? 'bg-cyan text-white shadow-sm' : 'text-muted hover:text-text'">
        📚 Belajar
      </button>
      <button @click="activeTab = 'manage'"
        class="flex-1 py-2 text-xs font-heading font-bold rounded-xl transition-colors"
        :class="activeTab === 'manage' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-text'">
        ⚙️ Kelola
      </button>
    </div>

    <!-- TAB 1: Belajar (semua user) -->
    <template v-if="activeTab === 'learn'">
      <UiLoading v-if="pending" :rows="4" />
      <div v-else class="grid md:grid-cols-2 gap-5">
        <!-- Huruf -->
        <div class="bg-card rounded-3xl p-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="w-7 h-7 rounded-xl bg-cyan/10 flex items-center justify-center font-heading text-sm text-cyan">字</span>
            <h3 class="font-heading font-bold text-base">Huruf</h3>
          </div>
          <div v-if="huruf.length" class="space-y-1">
            <NuxtLink v-for="m in huruf" :key="m.id" :to="`/academy/${m.id}`"
              class="flex items-center justify-between py-3 px-2 border-b border-line last:border-none rounded-xl transition-all hover:bg-bg">
              <span class="text-sm" :class="m.is_completed ? 'text-text font-semibold' : 'text-muted'">{{ m.title }}</span>
              <span class="flex items-center gap-1.5 text-[10px] font-heading font-bold px-2.5 py-1 rounded-full" 
                :class="[statusOf(m).color, statusOf(m).bg]">
                {{ statusOf(m).icon }} {{ statusOf(m).label }}
              </span>
            </NuxtLink>
          </div>
          <UiEmpty v-else icon="字" title="Belum ada modul huruf" :subtitle="isStaff ? 'Tambah modul via tab Kelola' : ''" />
        </div>

        <!-- Grammar -->
        <div class="bg-card rounded-3xl p-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="w-7 h-7 rounded-xl bg-gold/10 flex items-center justify-center font-heading text-sm text-gold">文</span>
            <h3 class="font-heading font-bold text-base">Grammar</h3>
          </div>
          <div v-if="grammar.length" class="space-y-1">
            <NuxtLink v-for="m in grammar" :key="m.id" :to="`/academy/${m.id}`"
              class="flex items-center justify-between py-3 px-2 border-b border-line last:border-none rounded-xl transition-all hover:bg-bg">
              <span class="text-sm" :class="m.is_completed ? 'text-text font-semibold' : 'text-muted'">{{ m.title }}</span>
              <span class="flex items-center gap-1.5 text-[10px] font-heading font-bold px-2.5 py-1 rounded-full" 
                :class="[statusOf(m).color, statusOf(m).bg]">
                {{ statusOf(m).icon }} {{ statusOf(m).label }}
              </span>
            </NuxtLink>
          </div>
          <UiEmpty v-else icon="文" title="Belum ada modul grammar" :subtitle="isStaff ? 'Tambah modul via tab Kelola' : ''" />
        </div>
      </div>
    </template>

    <!-- TAB 2: Kelola (Staff/Admin) -->
    <template v-if="isStaff && activeTab === 'manage'">
      <div class="flex justify-end mb-4">
        <button @click="openCreate" class="text-xs font-heading font-bold text-cyan bg-cyan/10 px-4 py-2 rounded-xl hover:bg-cyan/20 transition-colors">
          + Tambah Modul Baru
        </button>
      </div>

      <UiLoading v-if="pending" :rows="4" />
      <div v-else class="space-y-3">
        <div v-for="m in modules" :key="m.id" class="bg-card rounded-2xl p-4 flex items-center justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-heading font-bold uppercase px-2.5 py-0.5 rounded-lg"
                :class="m.path === 'huruf' ? 'text-cyan bg-cyan/10' : 'text-gold bg-gold/10'">
                {{ m.path }}
              </span>
              <span v-if="m.quiz_data" class="text-[10px] font-heading font-bold text-muted bg-bg px-2 py-0.5 rounded-lg">
                📝 Ada kuis ({{ m.quiz_data?.questions?.length || 0 }} soal)
              </span>
              <span v-else class="text-[10px] text-muted">Belum ada kuis</span>
            </div>
            <p class="font-heading font-bold text-sm">{{ m.title }}</p>
            <p class="text-[10px] text-muted">{{ m.xp_reward }} XP · {{ m.gold_reward }} Gold · {{ m.content ? 'Ada materi' : 'Belum ada materi' }}</p>
          </div>
          <button @click="openEdit(m)" class="text-xs text-cyan font-heading font-bold shrink-0">Edit</button>
        </div>
        <UiEmpty v-if="!modules?.length" icon="学" title="Belum ada modul" />
      </div>

      <!-- Modal/Form Buat & Edit Modul -->
      <div v-if="showForm" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" @click.self="showForm = false">
        <div class="bg-card rounded-3xl p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-6">
            <h2 class="font-heading font-extrabold text-lg">
              {{ editingModule ? 'Edit Modul' : 'Tambah Modul Baru' }}
            </h2>
            <button @click="showForm = false" class="text-muted hover:text-accent text-xl leading-none">✕</button>
          </div>

          <div class="space-y-4">
            <!-- Info dasar -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-heading font-bold text-muted mb-2">Judul Modul</label>
                <input v-model="form.title" required placeholder="Contoh: Hiragana Dasar"
                  class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan" />
              </div>
              <div>
                <label class="block text-xs font-heading font-bold text-muted mb-2">Kategori</label>
                <select v-model="form.path" class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan">
                  <option value="huruf">Huruf</option>
                  <option value="grammar">Grammar</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-heading font-bold text-muted mb-2">XP Reward</label>
                <input v-model.number="form.xp_reward" type="number" min="0"
                  class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan" />
              </div>
              <div>
                <label class="block text-xs font-heading font-bold text-muted mb-2">Gold Reward</label>
                <input v-model.number="form.gold_reward" type="number" min="0"
                  class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan" />
              </div>
            </div>

            <!-- Konten Materi -->
            <div>
              <label class="block text-xs font-heading font-bold text-muted mb-2">
                Materi Pelajaran <span class="font-normal">(teks langsung, bisa pakai enter untuk baris baru)</span>
              </label>
              <textarea v-model="form.content" rows="8" placeholder="Tulis materi pelajaran di sini...
Contoh:
Hiragana adalah sistem penulisan silabik Jepang.
あ = a  い = i  う = u  え = e  お = o"
                class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan font-mono leading-relaxed"></textarea>
            </div>

            <div>
              <label class="block text-xs font-heading font-bold text-muted mb-2">Link Materi Eksternal (opsional)</label>
              <input v-model="form.content_url" type="url" placeholder="https://..."
                class="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan" />
            </div>

            <!-- Soal Kuis -->
            <div class="border-t border-line pt-4">
              <div class="flex justify-between items-center mb-3">
                <label class="text-xs font-heading font-bold text-muted">Soal Kuis ({{ quizQuestions.length }} soal)</label>
                <button type="button" @click="addQuestion" class="text-xs font-heading font-bold text-cyan bg-cyan/10 px-3 py-1.5 rounded-xl hover:bg-cyan/20 transition-colors">
                  + Tambah Soal
                </button>
              </div>

              <div v-for="(q, qi) in quizQuestions" :key="qi" class="bg-bg rounded-2xl p-4 mb-3 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-heading font-bold text-muted">Soal {{ qi + 1 }}</span>
                  <button @click="removeQuestion(qi)" class="text-xs text-accent hover:opacity-80">Hapus</button>
                </div>
                <input v-model="q.question" placeholder="Pertanyaan..."
                  class="w-full bg-card border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan" />
                <div class="space-y-2">
                  <div v-for="(opt, oi) in q.options" :key="oi" class="flex items-center gap-2">
                    <input type="radio" :name="`correct-${qi}`" :value="oi" v-model="q.correct" class="accent-cyan shrink-0" />
                    <input v-model="q.options[oi]" :placeholder="`Pilihan ${String.fromCharCode(65+oi)}...`"
                      class="flex-1 bg-card border border-line rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan" />
                  </div>
                  <p class="text-[10px] text-muted">Pilih radio button di kiri untuk menandai jawaban benar</p>
                </div>
              </div>

              <UiEmpty v-if="quizQuestions.length === 0" icon="📝" title="Belum ada soal kuis" subtitle="Klik '+ Tambah Soal' untuk mulai membuat kuis" />
            </div>

            <p v-if="saveError" class="text-accent text-sm">{{ saveError }}</p>
            <p v-if="saveSuccess" class="text-cyan text-sm font-heading font-bold">✓ Berhasil disimpan!</p>

            <div class="flex gap-3">
              <button @click="showForm = false" class="flex-1 border border-line text-muted font-heading font-bold rounded-2xl py-3 text-sm hover:text-text transition-colors">
                Batal
              </button>
              <button @click="saveModule" :disabled="saving || !form.title || !form.path"
                class="flex-1 bg-accent hover:opacity-90 transition-opacity text-white font-heading font-bold rounded-2xl py-3 text-sm disabled:opacity-50">
                {{ saving ? 'Menyimpan...' : editingModule ? 'Simpan Perubahan' : 'Buat Modul' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
