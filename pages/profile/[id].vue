<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const { authHeader, user, logout } = useAuth()

const { data: profile, pending, error, refresh } = await useFetch(`/api/profile/${route.params.id}`, {
  headers: authHeader(),
})

const isMe = computed(() => user.value?.id === route.params.id)
const joinedDate = computed(() => {
  if (!profile.value?.created_at) return ''
  return new Date(profile.value.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
})

// --- Edit Profile Modal ---
const isEditing = ref(false)
const editForm = ref({ bio: '', avatar_url: '', banner_url: '' })
const isSaving = ref(false)
const isFileUploading = ref(false)

function openEdit() {
  editForm.value = {
    bio: profile.value?.bio || '',
    avatar_url: profile.value?.avatar_url || '',
    banner_url: profile.value?.banner_url || ''
  }
  isEditing.value = true
}

async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await $fetch<any>('/api/upload', {
    method: 'POST',
    headers: authHeader(),
    body: formData
  })
  return res.url
}

async function handleFileChange(event: Event, field: 'avatar_url' | 'banner_url' | 'gallery') {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isFileUploading.value = true
  try {
    const url = await uploadFile(file)
    if (field === 'avatar_url') editForm.value.avatar_url = url
    else if (field === 'banner_url') editForm.value.banner_url = url
    else if (field === 'gallery') galleryForm.value.image_url = url
  } catch(e: any) {
    alert(e.data?.statusMessage || 'Gagal mengupload gambar')
  } finally {
    isFileUploading.value = false
  }
}

async function saveProfile() {
  isSaving.value = true
  try {
    await $fetch('/api/profile/me', {
      method: 'PATCH',
      headers: authHeader(),
      body: editForm.value
    })
    isEditing.value = false
    await refresh()
  } catch(e: any) {
    alert(e.data?.statusMessage || 'Gagal menyimpan profil')
  } finally {
    isSaving.value = false
  }
}

// --- Gallery Upload Modal ---
const isUploadingGallery = ref(false)
const galleryForm = ref({ image_url: '', caption: '' })
const isSavingGallery = ref(false)

function openGalleryUpload() {
  galleryForm.value = { image_url: '', caption: '' }
  isUploadingGallery.value = true
}

async function saveGallery() {
  isSavingGallery.value = true
  try {
    await $fetch('/api/profile/me/gallery', {
      method: 'POST',
      headers: authHeader(),
      body: galleryForm.value
    })
    isUploadingGallery.value = false
    await refresh()
  } catch(e: any) {
    alert(e.data?.statusMessage || 'Gagal menambah karya')
  } finally {
    isSavingGallery.value = false
  }
}

// --- Delete Gallery Item ---
const deletingId = ref<string | null>(null)
async function deleteGalleryItem(id: string) {
  if (!confirm('Hapus karya ini?')) return
  deletingId.value = id
  try {
    await $fetch(`/api/profile/me/gallery/${id}`, {
      method: 'DELETE',
      headers: authHeader()
    })
    await refresh()
  } catch(e: any) {
    alert(e.data?.statusMessage || 'Gagal menghapus karya')
  } finally {
    deletingId.value = null
  }
}

// --- Activity Log helper ---
function parseLog(actionType: string) {
  const prefix = actionType?.split(':')?.[0] || ''
  const map: Record<string, { label: string; icon: string; color: string }> = {
    quest_xp:   { label: 'Menyelesaikan Quest', icon: '巻', color: 'text-cyan bg-cyan/10' },
    quest_gold: { label: 'Reward Gold Quest',  icon: '帯', color: 'text-gold bg-gold/10' },
    quest_gcp:  { label: 'Reward GCP Quest',   icon: '位', color: 'text-accent bg-accent/10' },
    quiz_xp:    { label: 'Menyelesaikan Kuis', icon: '学', color: 'text-cyan bg-cyan/10' },
    quiz_gold:  { label: 'Reward Gold Kuis',   icon: '学', color: 'text-gold bg-gold/10' },
    redeem:     { label: 'Tukar di Shop',      icon: '品', color: 'text-purple bg-purple/10' },
  }
  return map[prefix] || { label: 'Aktivitas', icon: '報', color: 'text-muted bg-line' }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}
</script>

<template>
  <div class="min-h-screen font-body text-text p-4 md:p-10">
    <UiLoading v-if="pending" :rows="4" />
    <UiEmpty v-else-if="error" icon="?" title="Hunter tidak ditemukan" />

    <div v-else class="max-w-4xl mx-auto grid md:grid-cols-[300px_1fr] gap-7">
      <!-- Hunter card -->
      <div class="bg-card rounded-3xl p-6 text-center relative shadow-sm">
        
        <button v-if="isMe" @click="openEdit" class="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-bold font-heading transition-colors shadow-sm">
          Edit Profil
        </button>

        <div class="h-24 rounded-2xl -mb-12 bg-cover bg-center"
          :style="profile.banner_url ? `background-image: url('${profile.banner_url}')` : `background: linear-gradient(135deg, rgba(49,216,255,0.18), rgba(255,59,87,0.18))`"></div>

        <div class="w-24 h-24 rounded-full mx-auto mb-3 p-1 transition-transform hover:scale-105 relative z-10"
          :style="{ background: `conic-gradient(#31D8FF 0deg, #FF3B57 ${(profile.rank_progress.progressPercent || 0) * 3.6}deg, #2A2B3D ${(profile.rank_progress.progressPercent || 0) * 3.6}deg 360deg)` }">
          <div class="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
            <img v-if="profile.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover rounded-full" />
            <span v-else class="font-heading text-3xl">{{ profile.nickname?.[0] }}</span>
          </div>
        </div>

        <h1 class="font-heading font-extrabold text-lg truncate">{{ profile.nickname }}</h1>
        <p v-if="joinedDate" class="text-[10px] text-muted mb-2">Bergabung sejak {{ joinedDate }}</p>
        
        <span class="inline-block font-heading text-xs font-bold text-gold bg-gold/10 px-3 py-1 rounded-xl my-2">
          Rank {{ profile.rank }}
        </span>
        
        <p class="text-xs text-muted leading-relaxed text-left border-t border-line pt-4 mt-2">
          {{ profile.bio || 'Belum ada bio. Hunter yang misterius...' }}
        </p>

        <div class="text-left mt-5">
          <div class="text-xs font-heading font-bold text-muted uppercase tracking-wide mb-2">Achievement</div>
          <div class="flex gap-2 flex-wrap">
            <div v-for="badge in profile.badges" :key="badge?.id"
              class="w-9 h-9 flex items-center justify-center text-xs font-heading font-bold text-accent bg-accent/10 transition-transform hover:scale-110"
              style="clip-path: polygon(25% 6.7%,75% 6.7%,100% 50%,75% 93.3%,25% 93.3%,0% 50%)">
              <img v-if="badge?.image_url" :src="badge.image_url" class="w-full h-full object-cover" />
              <span v-else>{{ badge?.name?.[0] }}</span>
            </div>
          </div>
          <div v-if="!profile.badges?.length" class="flex flex-col items-center justify-center py-4 text-muted">
            <span class="text-2xl mb-1 opacity-50">🏆</span>
            <p class="text-[10px]">Belum ada badge.</p>
          </div>
        </div>

        <!-- Tombol Logout untuk pemilik akun -->
        <button v-if="isMe" @click="logout"
          class="mt-6 w-full bg-accent/10 hover:bg-accent text-accent hover:text-white font-heading font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm">
          <span>🚪</span> Keluar dari Akun
        </button>
      </div>

      <!-- Stats -->
      <div class="space-y-5">
        <div class="bg-card rounded-3xl p-6 shadow-sm">
          <div class="flex flex-col sm:flex-row justify-between sm:items-baseline font-heading text-sm font-bold mb-3 gap-1">
            <span>{{ profile.total_xp }} XP</span>
            <span class="text-muted font-normal text-xs">
              {{ profile.rank_progress.nextRank
                ? `${profile.rank_progress.nextThreshold} XP menuju Rank ${profile.rank_progress.nextRank}`
                : 'Rank maksimal tercapai' }}
            </span>
          </div>
          <div class="h-2.5 rounded-full bg-bg overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700" style="background: linear-gradient(90deg, #31D8FF, #FF3B57)"
              :style="{ width: profile.rank_progress.progressPercent + '%' }"></div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 md:gap-3">
          <div class="bg-card rounded-2xl p-3 md:p-4 text-center transition-transform hover:-translate-y-0.5 shadow-sm">
            <div class="text-[9px] md:text-[10px] font-heading font-bold text-muted uppercase mb-2">Gold</div>
            <div class="font-heading font-extrabold text-base md:text-xl text-gold">{{ profile.gold }}</div>
          </div>
          <div class="bg-card rounded-2xl p-3 md:p-4 text-center transition-transform hover:-translate-y-0.5 shadow-sm">
            <div class="text-[9px] md:text-[10px] font-heading font-bold text-muted uppercase mb-2">GCP</div>
            <div class="font-heading font-extrabold text-base md:text-xl text-cyan">{{ profile.gcp }}</div>
          </div>
          <div class="bg-card rounded-2xl p-3 md:p-4 text-center transition-transform hover:-translate-y-0.5 shadow-sm">
            <div class="text-[9px] md:text-[10px] font-heading font-bold text-muted uppercase mb-2">Total Quest</div>
            <div class="font-heading font-extrabold text-base md:text-xl text-accent">{{ profile.completed_count }}</div>
          </div>
        </div>

        <div class="bg-card rounded-3xl p-6 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <div class="text-xs font-heading font-bold text-muted uppercase tracking-wide">Gallery</div>
            <button v-if="isMe" @click="openGalleryUpload" class="text-[10px] font-heading font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors">
              + Tambah Karya
            </button>
          </div>

          <div v-if="profile.gallery?.length" class="grid grid-cols-3 md:grid-cols-4 gap-2">
            <div v-for="item in profile.gallery" :key="item.id"
              class="aspect-square bg-bg rounded-xl overflow-hidden group cursor-pointer relative">
              <img :src="item.image_url" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              <!-- Caption overlay -->
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <p v-if="item.caption" class="text-white text-[9px] line-clamp-2 flex-1">{{ item.caption }}</p>
                <!-- Delete button (only for owner) -->
                <button v-if="isMe" @click.stop="deleteGalleryItem(item.id)"
                  :disabled="deletingId === item.id"
                  class="ml-auto shrink-0 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center text-xs transition-colors disabled:opacity-50">
                  {{ deletingId === item.id ? '…' : '✕' }}
                </button>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-10 text-muted bg-bg/50 rounded-2xl">
            <span class="text-3xl mb-2 opacity-50">🎨</span>
            <p class="text-xs font-medium">Belum ada karya diunggah.</p>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-card rounded-3xl p-6 shadow-sm">
          <div class="text-xs font-heading font-bold text-muted uppercase tracking-wide mb-4">Aktivitas Terakhir</div>
          <div v-if="profile.recent_logs?.length" class="space-y-0">
            <div v-for="(log, i) in profile.recent_logs" :key="i"
              class="flex items-center gap-3 py-2.5 border-b border-line last:border-none">
              <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-heading font-bold shrink-0"
                :class="parseLog(log.action_type).color">
                {{ parseLog(log.action_type).icon }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold truncate">{{ parseLog(log.action_type).label }}</p>
                <p class="text-[10px] text-muted">{{ timeAgo(log.created_at) }}</p>
              </div>
              <span class="font-heading text-xs font-bold shrink-0"
                :class="log.points_delta < 0 ? 'text-accent' : 'text-cyan'">
                {{ log.points_delta > 0 ? '+' : '' }}{{ log.points_delta }}
              </span>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-8 text-muted bg-bg/50 rounded-2xl">
            <span class="text-3xl mb-2 opacity-50">📜</span>
            <p class="text-xs font-medium">Belum ada aktivitas tercatat.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div v-if="isEditing" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-card w-full max-w-md rounded-3xl p-6 shadow-xl border border-line">
        <h2 class="font-heading font-extrabold text-xl mb-4">Edit Profil</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-muted mb-1.5">Bio Singkat</label>
            <textarea v-model="editForm.bio" rows="3" class="w-full bg-bg border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent resize-none" placeholder="Ceritakan sedikit tentang dirimu..."></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted mb-1.5">Foto Profil (Avatar)</label>
            <input type="file" accept="image/*" @change="e => handleFileChange(e, 'avatar_url')" class="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer" />
            <p v-if="editForm.avatar_url" class="text-[10px] text-cyan mt-1">Gambar sudah dipilih ✅</p>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted mb-1.5">Banner Profil</label>
            <input type="file" accept="image/*" @change="e => handleFileChange(e, 'banner_url')" class="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer" />
            <p v-if="editForm.banner_url" class="text-[10px] text-cyan mt-1">Gambar sudah dipilih ✅</p>
          </div>
        </div>

        <p v-if="isFileUploading" class="text-[11px] text-cyan text-center mt-2 animate-pulse">⏳ Sedang mengunggah gambar, harap tunggu...</p>
        <div class="flex gap-3 mt-4">
          <button @click="isEditing = false" :disabled="isSaving || isFileUploading" class="flex-1 bg-bg hover:bg-line text-text font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50">
            Batal
          </button>
          <button @click="saveProfile" :disabled="isSaving || isFileUploading" class="flex-1 bg-accent hover:bg-accent/90 text-white font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-70">
            {{ isSaving ? 'Menyimpan...' : isFileUploading ? 'Mengunggah...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Gallery Upload Modal -->
    <div v-if="isUploadingGallery" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-card w-full max-w-md rounded-3xl p-6 shadow-xl border border-line">
        <h2 class="font-heading font-extrabold text-xl mb-4">Tambah Karya</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-muted mb-1.5">Upload Gambar <span class="text-accent">*</span></label>
            <input type="file" accept="image/*" @change="e => handleFileChange(e, 'gallery')" class="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer" />
            <p v-if="galleryForm.image_url" class="text-[10px] text-cyan mt-1">Gambar berhasil diunggah ✅</p>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted mb-1.5">Keterangan (Opsional)</label>
            <textarea v-model="galleryForm.caption" rows="2" class="w-full bg-bg border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent resize-none" placeholder="Deskripsi karyamu..."></textarea>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="isUploadingGallery = false" class="flex-1 bg-bg hover:bg-line text-text font-bold text-sm py-2.5 rounded-xl transition-colors">
            Batal
          </button>
          <button @click="saveGallery" :disabled="isSavingGallery || !galleryForm.image_url" class="flex-1 bg-cyan hover:bg-cyan/90 text-white font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-70">
            {{ isSavingGallery ? 'Mengunggah...' : 'Unggah' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
