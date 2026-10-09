<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { authHeader, user } = useAuth()

const isStaff = computed(() => ['admin', 'staff'].includes(user.value?.role || ''))
const activeTab = ref<'board' | 'manage' | 'review'>('board')

// --- Tab 1: Quest Board (Hunter) ---
const { data: boardQuests, pending: boardPending, refresh: boardRefresh } = await useFetch('/api/quests', { headers: authHeader() })
const proofDrafts = reactive<Record<string, string>>({})
const isUploading = reactive<Record<string, boolean>>({})
const submittingId = ref<string | null>(null)
const errMsgBoard = ref('')

async function handleFileChange(event: Event, questId: string) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isUploading[questId] = true
  errMsgBoard.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await $fetch<any>('/api/upload', {
      method: 'POST',
      headers: authHeader(),
      body: formData
    })
    proofDrafts[questId] = res.url
  } catch(e: any) {
    errMsgBoard.value = e?.data?.statusMessage || 'Gagal mengunggah gambar'
  } finally {
    isUploading[questId] = false
  }
}

async function submitProof(questId: string) {
  errMsgBoard.value = ''
  submittingId.value = questId
  try {
    await $fetch(`/api/quests/${questId}/submissions`, {
      method: 'POST',
      headers: authHeader(),
      body: { proof_url: proofDrafts[questId] || '' },
    })
    proofDrafts[questId] = ''
    await boardRefresh()
  } catch (e: any) {
    errMsgBoard.value = e?.data?.statusMessage || 'Gagal setor bukti'
  } finally {
    submittingId.value = null
  }
}

const tagColor: Record<string, string> = { event: 'text-accent bg-accent/10', regular: 'text-cyan bg-cyan/10', quiz: 'text-gold bg-gold/10' }
const tagIcon: Record<string, string> = { event: '祭', regular: '巻', quiz: '問' }
const statusStyle: Record<string, string> = { pending: 'text-gold bg-gold/10', approved: 'text-cyan bg-cyan/10', rejected: 'text-accent bg-accent/10' }
const statusLabel: Record<string, string> = { pending: 'Menunggu persetujuan', approved: 'Selesai', rejected: 'Ditolak — cek feedback staff' }

// --- Tab 2: Manage Quests (Staff/Admin) ---
// We can use lazy or check if isStaff before calling. For simplicity, we just fetch it.
const { data: manageQuests, pending: managePending, refresh: manageRefresh } = await useFetch('/api/admin/quests', { headers: authHeader(), lazy: true })
const busyId = ref<string | null>(null)

async function toggleStatus(q: any) {
  busyId.value = q.id
  const newStatus = q.status === 'active' ? 'inactive' : 'active'
  try {
    await $fetch(`/api/quests/${q.id}`, { method: 'PATCH', headers: authHeader(), body: { status: newStatus } })
    await manageRefresh()
    await boardRefresh()
  } finally {
    busyId.value = null
  }
}

// --- Tab 3: Review Submissions (Staff/Admin) ---
const { data: submissions, pending: subPending, refresh: subRefresh } = await useFetch('/api/submissions', {
  headers: authHeader(),
  query: { status: 'pending' },
  lazy: true
})
const feedbackDrafts = reactive<Record<string, string>>({})
const busySubId = ref<string | null>(null)
const errMsgSub = ref('')

async function actSubmission(id: string, action: 'approve' | 'reject') {
  errMsgSub.value = ''
  busySubId.value = id
  try {
    await $fetch(`/api/submissions/${id}/${action}`, {
      method: 'PATCH',
      headers: authHeader(),
      body: { feedback: feedbackDrafts[id] || '' },
    })
    await subRefresh()
    await boardRefresh()
  } catch (e: any) {
    errMsgSub.value = e?.data?.statusMessage || `Gagal ${action}`
  } finally {
    busySubId.value = null
  }
}
</script>

<template>
  <div class="min-h-screen font-body text-text p-6 md:p-10">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="font-heading font-extrabold text-xl mb-1">Quest Board</h1>
        <p class="text-muted text-sm" v-if="isStaff">Pusat manajemen dan pengambilan misi.</p>
        <p class="text-muted text-sm" v-else>Ambil misi, kumpulkan reward.</p>
      </div>
      <NuxtLink to="/" class="text-xs text-muted underline">← Kembali</NuxtLink>
    </div>

    <!-- Tabs (Only for Staff/Admin) -->
    <div v-if="isStaff" class="flex gap-2 mb-6 p-1 bg-card rounded-2xl w-full max-w-[28rem] overflow-x-auto">
      <button @click="activeTab = 'board'" 
        class="flex-1 min-w-[100px] py-2 text-xs font-heading font-bold rounded-xl transition-colors whitespace-nowrap"
        :class="activeTab === 'board' ? 'bg-cyan text-white shadow-sm' : 'text-muted hover:text-text'">
        Papan Quest
      </button>
      <button @click="activeTab = 'manage'" 
        class="flex-1 min-w-[100px] py-2 text-xs font-heading font-bold rounded-xl transition-colors whitespace-nowrap"
        :class="activeTab === 'manage' ? 'bg-cyan text-white shadow-sm' : 'text-muted hover:text-text'">
        Kelola Quest
      </button>
      <button @click="activeTab = 'review'" 
        class="flex-1 min-w-[100px] py-2 text-xs font-heading font-bold rounded-xl transition-colors relative whitespace-nowrap"
        :class="activeTab === 'review' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-text'">
        Review Bukti
        <span v-if="submissions?.length" class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] text-white font-black border border-bg">
          {{ submissions.length }}
        </span>
      </button>
    </div>

    <!-- Tab 1: Quest Board (Hunter & Staff) -->
    <template v-if="activeTab === 'board'">
      <UiLoading v-if="boardPending" :rows="3" />
      <p v-if="errMsgBoard" class="text-accent text-sm mb-4">{{ errMsgBoard }}</p>

      <div v-else class="grid md:grid-cols-3 gap-5">
        <div v-for="q in boardQuests" :key="q.id"
          class="bg-card rounded-3xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-xl">
          <span class="self-start inline-flex items-center gap-1.5 text-[10px] font-heading font-bold uppercase px-3 py-1 rounded-lg" :class="tagColor[q.category]">
            <span>{{ tagIcon[q.category] }}</span>{{ q.category }}
          </span>
          <h3 class="font-heading font-bold text-base">{{ q.title }}</h3>
          <p class="text-xs text-muted flex-1">{{ q.description }}</p>

          <div class="flex gap-3 font-heading text-xs font-bold">
            <span class="text-muted">{{ q.reward_xp }} XP</span>
            <span class="text-cyan">{{ q.reward_gcp }} GCP</span>
            <span class="text-gold">{{ q.reward_gold }} Gold</span>
          </div>
          <p v-if="q.deadline" class="text-[10px] text-muted">
            Deadline: {{ new Date(q.deadline).toLocaleDateString('id-ID') }}
          </p>

          <div v-if="!q.my_submission_status" class="border-t border-line pt-3 space-y-2">
            <div v-if="proofDrafts[q.id]" class="bg-cyan/10 rounded-xl px-3 py-2.5 text-xs flex justify-between items-center text-cyan font-heading font-bold">
              <span class="flex items-center gap-1.5"><span class="text-sm">✓</span> Bukti siap dikirim</span>
              <button @click="proofDrafts[q.id] = ''" class="text-cyan opacity-80 hover:opacity-100 hover:text-accent transition-colors">✕ Batal</button>
            </div>
            <div v-else class="relative w-full">
              <input type="file" @change="e => handleFileChange(e, q.id)" accept="image/*"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" :disabled="isUploading[q.id]" />
              <div class="w-full bg-bg border border-line border-dashed rounded-xl px-3 py-2.5 text-xs text-center font-heading font-bold"
                   :class="isUploading[q.id] ? 'text-muted' : 'text-cyan hover:bg-cyan/5 transition-colors'">
                {{ isUploading[q.id] ? 'Mengunggah foto...' : '📸 Upload Foto Bukti' }}
              </div>
            </div>
            <button @click="submitProof(q.id)" :disabled="submittingId === q.id || !proofDrafts[q.id]"
              class="w-full bg-accent text-white font-heading font-bold text-xs rounded-xl py-2.5 disabled:opacity-50 transition-transform active:scale-95">
              {{ submittingId === q.id ? 'Mengirim...' : 'Setor bukti' }}
            </button>
          </div>
          <div v-else class="border-t border-line pt-3 text-center font-heading text-xs font-bold rounded-xl py-2.5"
            :class="statusStyle[q.my_submission_status]">
            {{ statusLabel[q.my_submission_status] }}
          </div>
        </div>

        <div v-if="!boardQuests?.length" class="md:col-span-3">
          <UiEmpty icon="巻" title="Belum ada quest aktif" subtitle="Cek lagi nanti, staff bakal nambahin misi baru." />
        </div>
      </div>
    </template>

    <!-- Tab 2: Manage Quests (Staff Only) -->
    <template v-if="isStaff && activeTab === 'manage'">
      <div class="flex justify-end mb-4">
        <NuxtLink to="/admin/quests/new" class="text-xs font-heading font-bold text-cyan bg-cyan/10 px-4 py-2 rounded-xl hover:bg-cyan/20 transition-colors">
          + Buat Quest Baru
        </NuxtLink>
      </div>
      
      <UiLoading v-if="managePending" :rows="4" />
      <div v-else class="space-y-3">
        <div v-for="q in manageQuests" :key="q.id" class="bg-card rounded-2xl p-4 flex items-center justify-between gap-4 transition-opacity">
          <div class="flex-1 min-w-0">
            <span class="text-[10px] font-heading font-bold uppercase px-2.5 py-0.5 rounded-lg" :class="tagColor[q.category]">
              {{ q.category }}
            </span>
            <p class="font-heading font-bold text-sm mt-1.5">{{ q.title }}</p>
            <p class="text-[10px] text-muted">{{ q.reward_xp }} XP · {{ q.reward_gcp }} GCP · {{ q.reward_gold }} Gold</p>
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <NuxtLink :to="`/admin/quests/${q.id}/edit`" class="text-xs text-cyan font-heading font-bold">Edit</NuxtLink>
            <button @click="toggleStatus(q)" :disabled="busyId === q.id"
              class="text-xs font-heading font-bold" :class="q.status === 'active' ? 'text-accent' : 'text-cyan'">
              {{ busyId === q.id ? '...' : q.status === 'active' ? 'Nonaktifkan' : 'Aktifkan' }}
            </button>
          </div>
        </div>
        <UiEmpty v-if="!manageQuests?.length" icon="巻" title="Belum ada quest dibuat" />
      </div>
    </template>

    <!-- Tab 3: Review Submissions (Staff Only) -->
    <template v-if="isStaff && activeTab === 'review'">
      <p v-if="errMsgSub" class="text-accent text-sm mb-4">{{ errMsgSub }}</p>
      <UiLoading v-if="subPending" :rows="3" />
      
      <div v-else class="space-y-4 max-w-2xl">
        <div v-for="s in submissions" :key="s.id"
          class="bg-card rounded-3xl p-5 transition-all hover:shadow-xl hover:shadow-black/20">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
            <div class="flex gap-3 items-start min-w-0">
              <div class="w-10 h-10 rounded-full bg-bg flex items-center justify-center font-heading text-sm shrink-0">
                {{ s.hunter?.nickname?.[0] }}
              </div>
              <div class="min-w-0">
                <span class="text-[10px] font-heading font-bold uppercase px-3 py-1 rounded-lg" :class="tagColor[s.quest?.category]">
                  {{ s.quest?.category }}
                </span>
                <h3 class="font-heading font-bold text-base mt-2 truncate">{{ s.quest?.title }}</h3>
                <p class="text-xs text-muted truncate">{{ s.hunter?.nickname }} · NIM {{ s.hunter?.nim }}</p>
              </div>
            </div>
            <div class="flex sm:flex-col gap-3 sm:gap-0 sm:text-right font-heading text-xs font-bold shrink-0 pl-[52px] sm:pl-0">
              <div class="text-muted">{{ s.quest?.reward_xp }} XP</div>
              <div class="text-cyan">{{ s.quest?.reward_gcp }} GCP</div>
              <div class="text-gold">{{ s.quest?.reward_gold }} Gold</div>
            </div>
          </div>

          <div class="mb-4 bg-bg border border-line rounded-xl overflow-hidden flex items-center justify-center min-h-[100px]">
            <template v-if="s.proof_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || s.proof_url.includes('supabase.co/storage')">
              <img :src="s.proof_url" alt="Bukti Quest" class="max-h-64 object-contain w-full" />
            </template>
            <template v-else>
              <a :href="s.proof_url" target="_blank" class="text-xs text-cyan underline break-all hover:opacity-80 p-4 block w-full text-center">
                Buka Link Bukti
              </a>
            </template>
          </div>

          <input v-model="feedbackDrafts[s.id]" placeholder="Feedback untuk hunter (opsional)"
            class="w-full bg-bg border border-line rounded-xl px-3 py-2 text-xs mb-3 focus:outline-none focus:border-cyan transition-colors" />

          <div class="flex gap-3">
            <button @click="actSubmission(s.id, 'approve')" :disabled="busySubId === s.id"
              class="flex-1 bg-cyan text-white font-heading font-bold text-xs rounded-xl py-2.5 disabled:opacity-50 transition-transform active:scale-95">
              {{ busySubId === s.id ? '...' : 'Approve' }}
            </button>
            <button @click="actSubmission(s.id, 'reject')" :disabled="busySubId === s.id"
              class="flex-1 border border-accent text-accent font-heading font-bold text-xs rounded-xl py-2.5 disabled:opacity-50 transition-transform active:scale-95">
              {{ busySubId === s.id ? '...' : 'Reject' }}
            </button>
          </div>
        </div>

        <UiEmpty v-if="!submissions?.length" icon="済" title="Tidak ada submission yang menunggu"
          subtitle="Semua bukti sudah direview. Kerja bagus!" />
      </div>
    </template>
  </div>
</template>
