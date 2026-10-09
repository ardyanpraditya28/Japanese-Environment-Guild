<script setup lang="ts">
// Admin & Staff bisa akses halaman ini
definePageMeta({ middleware: ['auth', 'staff'] })
const { authHeader } = useAuth()

const { data: shop, refresh } = await useFetch('/api/shop', { headers: authHeader() })
const items = computed(() => shop.value?.items ?? [])

// ── Toast ──
const toast     = ref('')
const toastType = ref<'success'|'error'>('success')
function showToast(msg: string, type: 'success'|'error' = 'success') {
  toast.value = msg; toastType.value = type
  setTimeout(() => { toast.value = '' }, 3500)
}

// ── Modal tambah / edit ──
const BLANK = { name: '', description: '', type: 'merchandise', price_gold: 100, stock: '', min_rank: '', image_url: '' }
const modal        = ref(false)
const editId       = ref<string | null>(null)
const form         = reactive({ ...BLANK })
const saving       = ref(false)
const imageFile    = ref<File | null>(null)
const uploadingImg = ref(false)
const imagePreview = computed(() =>
  imageFile.value ? URL.createObjectURL(imageFile.value) : form.image_url || ''
)

function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) imageFile.value = f
}

async function uploadImage(): Promise<string | null> {
  if (!imageFile.value) return form.image_url || null
  uploadingImg.value = true
  try {
    const fd = new FormData()
    fd.append('file', imageFile.value)
    const res = await $fetch<{ url: string }>('/api/upload', {
      method: 'POST', headers: authHeader(), body: fd,
    })
    return res.url
  } catch {
    showToast('Gagal upload gambar', 'error')
    return null
  } finally {
    uploadingImg.value = false
  }
}

function openAdd() {
  Object.assign(form, BLANK)
  imageFile.value = null
  editId.value = null
  modal.value  = true
}
function openEdit(item: any) {
  Object.assign(form, {
    name:        item.name        ?? '',
    description: item.description ?? '',
    type:        item.type        ?? 'merchandise',
    price_gold:  item.price_gold  ?? 100,
    stock:       item.stock !== null ? String(item.stock) : '',
    min_rank:    item.min_rank    ?? '',
    image_url:   item.image_url   ?? '',
  })
  imageFile.value = null
  editId.value = item.id
  modal.value  = true
}
function closeModal() { modal.value = false }

async function saveItem() {
  saving.value = true
  try {
    // upload gambar dulu kalau ada file baru
    const uploadedUrl = await uploadImage()
    if (imageFile.value && !uploadedUrl) { saving.value = false; return }

    const body = {
      name:        form.name,
      description: form.description || null,
      type:        form.type,
      price_gold:  Number(form.price_gold),
      stock:       form.stock !== '' ? Number(form.stock) : null,
      min_rank:    form.min_rank || null,
      image_url:   uploadedUrl,
    }
    if (editId.value) {
      await $fetch(`/api/shop/${editId.value}`, { method: 'PATCH', headers: authHeader(), body })
      closeModal()
      showToast('Item berhasil diperbarui!')
    } else {
      await $fetch('/api/shop', { method: 'POST', headers: authHeader(), body })
      closeModal()
      showToast('Item berhasil ditambahkan!')
    }
    await refresh()
  } catch (e: any) {
    showToast(e?.data?.statusMessage || 'Gagal menyimpan', 'error')
  } finally {
    saving.value = false
  }
}

// ── Hide / Show ──
const togglingId = ref<string | null>(null)
async function toggleHide(item: any) {
  togglingId.value = item.id
  try {
    await $fetch(`/api/shop/${item.id}`, {
      method: 'PATCH',
      headers: authHeader(),
      body: { is_hidden: !item.is_hidden },
    })
    showToast(item.is_hidden ? `"${item.name}" ditampilkan kembali.` : `"${item.name}" disembunyikan.`)
    await refresh()
  } catch (e: any) {
    showToast(e?.data?.statusMessage || 'Gagal mengubah visibilitas', 'error')
  } finally {
    togglingId.value = null
  }
}

const RANKS = ['F','E','D','C','B','A','S','SS','SSS']
const typeLabel: Record<string, string> = { border: '扇 Border', theme: '燈 Theme', merchandise: '帯 Merchandise' }
</script>

<template>
  <div class="min-h-screen font-body text-text p-4 md:p-8">

    <!-- header -->
    <div class="flex justify-between items-center mb-6 gap-4 flex-wrap">
      <div>
        <span class="inline-block text-xs font-heading font-bold text-cyan bg-cyan/10 px-3 py-1.5 rounded-xl mb-2">◆ Admin / Staff</span>
        <h1 class="font-heading font-extrabold text-xl">Kelola Item Shop</h1>
        <p class="text-muted text-sm">Tambah, edit, atau hapus item Gold Sink.</p>
      </div>
      <div class="flex gap-3 items-center">
        <NuxtLink to="/shop" class="text-xs text-muted underline">Lihat toko →</NuxtLink>
        <button @click="openAdd"
          class="bg-accent text-white font-heading font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-accent/90 active:scale-95 transition-all">
          + Tambah Item
        </button>
      </div>
    </div>

    <!-- toast -->
    <transition name="fade">
      <div v-if="toast"
        class="flex items-center gap-3 rounded-2xl px-4 py-3 mb-5 text-sm font-semibold"
        :class="toastType === 'success' ? 'bg-cyan/10 text-cyan' : 'bg-accent/10 text-accent'">
        <span>{{ toastType === 'success' ? '✓' : '✕' }}</span>
        {{ toast }}
      </div>
    </transition>

    <!-- tabel item -->
    <div class="bg-card rounded-3xl overflow-hidden">
      <div v-if="!items.length" class="p-10">
        <UiEmpty icon="店" title="Belum ada item" subtitle="Klik 'Tambah Item' untuk mulai." />
      </div>

      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-line text-left">
            <th class="font-heading text-[10px] uppercase tracking-wider text-muted px-5 py-3">Item</th>
            <th class="font-heading text-[10px] uppercase tracking-wider text-muted px-4 py-3 hidden sm:table-cell">Tipe</th>
            <th class="font-heading text-[10px] uppercase tracking-wider text-muted px-4 py-3">Harga</th>
            <th class="font-heading text-[10px] uppercase tracking-wider text-muted px-4 py-3 hidden md:table-cell">Stok</th>
            <th class="font-heading text-[10px] uppercase tracking-wider text-muted px-4 py-3 hidden md:table-cell">Min. Rank</th>
            <th class="font-heading text-[10px] uppercase tracking-wider text-muted px-4 py-3 hidden lg:table-cell">Status</th>
            <th class="font-heading text-[10px] uppercase tracking-wider text-muted px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id"
            class="border-b border-line last:border-none hover:bg-bg/40 transition-colors"
            :class="item.is_hidden ? 'opacity-50' : ''">
            <td class="px-5 py-4">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-heading font-bold text-sm">{{ item.name }}</p>
                <span v-if="item.is_hidden"
                  class="text-[9px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-line text-muted">
                  Tersembunyi
                </span>
              </div>
              <p v-if="item.description" class="text-[11px] text-muted mt-0.5 line-clamp-1">{{ item.description }}</p>
            </td>
            <td class="px-4 py-4 hidden sm:table-cell">
              <span class="text-[10px] font-heading font-bold px-2.5 py-1 rounded-lg"
                :class="{
                  'text-cyan bg-cyan/10': item.type === 'border',
                  'text-purple bg-purple/10': item.type === 'theme',
                  'text-gold bg-gold/10': !item.type || item.type === 'merchandise',
                }">
                {{ typeLabel[item.type] || '品 Item' }}
              </span>
            </td>
            <td class="px-4 py-4">
              <span class="font-heading font-bold text-gold">{{ item.price_gold.toLocaleString() }}</span>
              <span class="text-muted text-[11px] ml-1">Gold</span>
            </td>
            <td class="px-4 py-4 hidden md:table-cell">
              <span :class="item.stock === 0 ? 'text-accent' : item.stock === null ? 'text-muted' : 'text-text'">
                {{ item.stock === null ? '∞' : item.stock }}
              </span>
            </td>
            <td class="px-4 py-4 hidden md:table-cell text-muted">
              {{ item.min_rank || '—' }}
            </td>
            <!-- Kolom Status -->
            <td class="px-4 py-4 hidden lg:table-cell">
              <span class="text-[10px] font-heading font-bold px-2.5 py-1 rounded-lg"
                :class="item.is_hidden
                  ? 'bg-line text-muted'
                  : 'bg-cyan/10 text-cyan'">
                {{ item.is_hidden ? '眠 Tersembunyi' : '見 Tampil' }}
              </span>
            </td>
            <td class="px-4 py-4 text-right">
              <div class="flex gap-2 justify-end flex-wrap">
                <!-- Tombol hide/show -->
                <button @click="toggleHide(item)" :disabled="togglingId === item.id"
                  class="text-xs font-heading font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  :class="item.is_hidden
                    ? 'text-cyan bg-cyan/10 hover:bg-cyan/20'
                    : 'text-muted bg-line hover:bg-line/80'">
                  {{ togglingId === item.id ? '…' : item.is_hidden ? 'Tampilkan' : 'Sembunyikan' }}
                </button>
                <button @click="openEdit(item)"
                  class="text-xs font-heading font-bold text-cyan bg-cyan/10 hover:bg-cyan/20 px-3 py-1.5 rounded-lg transition-colors">
                  Edit
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Modal tambah/edit ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="modal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal" />
          <div class="relative bg-card rounded-3xl p-6 w-full max-w-md shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <h2 class="font-heading font-extrabold text-lg text-text mb-5">
              {{ editId ? 'Edit Item' : 'Tambah Item Baru' }}
            </h2>

            <form @submit.prevent="saveItem" class="space-y-4">
              <div>
                <label class="block text-xs font-heading font-bold text-muted mb-1.5">Nama Item *</label>
                <input v-model="form.name" required placeholder="contoh: Border Sakura"
                  class="w-full bg-bg text-text border border-line rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan transition-colors placeholder:text-muted" />
              </div>

              <div>
                <label class="block text-xs font-heading font-bold text-muted mb-1.5">Deskripsi</label>
                <textarea v-model="form.description" rows="2" placeholder="Deskripsi singkat item..."
                  class="w-full bg-bg text-text border border-line rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan transition-colors resize-none placeholder:text-muted" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-heading font-bold text-muted mb-1.5">Tipe</label>
                  <select v-model="form.type"
                    class="w-full bg-bg text-text border border-line rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan">
                    <option value="merchandise">帯 Merchandise</option>
                    <option value="border">扇 Border</option>
                    <option value="theme">燈 Theme</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-heading font-bold text-muted mb-1.5">Harga (Gold) *</label>
                  <input v-model.number="form.price_gold" type="number" min="1" required
                    class="w-full bg-bg text-text border border-line rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-heading font-bold text-muted mb-1.5">Stok <span class="text-[10px] font-normal">(kosong = unlimited)</span></label>
                  <input v-model="form.stock" type="number" min="0" placeholder="∞"
                    class="w-full bg-bg text-text border border-line rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan placeholder:text-muted" />
                </div>
                <div>
                  <label class="block text-xs font-heading font-bold text-muted mb-1.5">Min. Rank <span class="text-[10px] font-normal">(opsional)</span></label>
                  <select v-model="form.min_rank"
                    class="w-full bg-bg text-text border border-line rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan">
                    <option value="">— Tidak ada —</option>
                    <option v-for="r in RANKS" :key="r" :value="r">Rank {{ r }}</option>
                  </select>
                </div>
              </div>

              <!-- Upload Gambar -->
              <div>
                <label class="block text-xs font-heading font-bold text-muted mb-1.5">
                  Gambar <span class="text-[10px] font-normal">(opsional)</span>
                </label>
                <!-- preview -->
                <div v-if="imagePreview" class="mb-2 rounded-xl overflow-hidden border border-line w-full h-32 flex items-center justify-center bg-bg">
                  <img :src="imagePreview" class="h-full w-full object-cover" alt="preview" />
                </div>
                <!-- drop zone -->
                <label class="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-line rounded-xl py-4 cursor-pointer hover:border-cyan transition-colors">
                  <span class="text-2xl">🖼</span>
                  <span class="text-xs text-muted">
                    {{ imageFile ? imageFile.name : 'Klik untuk pilih gambar' }}
                  </span>
                  <span v-if="uploadingImg" class="text-[10px] text-cyan">Mengupload…</span>
                  <input type="file" accept="image/*" class="hidden" @change="onFileChange" />
                </label>
              </div>

              <div class="flex gap-3 pt-2">
                <button type="button" @click="closeModal"
                  class="flex-1 border border-line font-heading font-bold text-sm rounded-xl py-2.5 text-muted hover:text-text transition-colors">
                  Batal
                </button>
                <button type="submit" :disabled="saving"
                  class="flex-1 bg-accent text-white font-heading font-bold text-sm rounded-xl py-2.5 disabled:opacity-50 hover:bg-accent/90 active:scale-95 transition-all">
                  {{ saving ? 'Menyimpan…' : editId ? 'Simpan Perubahan' : 'Tambah Item' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal hapus ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="deleteTarget = null" />
          <div class="relative bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl z-10">
            <h2 class="font-heading font-extrabold text-lg mb-2">Hapus Item?</h2>
            <p class="text-sm text-muted mb-6">
              Kamu akan menghapus <span class="text-text font-semibold">{{ deleteTarget.name }}</span>.
              Tindakan ini tidak bisa dibatalkan.
            </p>
            <div class="flex gap-3">
              <button @click="deleteTarget = null"
                class="flex-1 border border-line font-heading font-bold text-sm rounded-xl py-2.5 text-muted hover:text-text transition-colors">
                Batal
              </button>
              <button @click="doDelete"
                class="flex-1 bg-accent text-white font-heading font-bold text-sm rounded-xl py-2.5 hover:bg-accent/90 active:scale-95 transition-all">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.modal-enter-active, .modal-leave-active { transition: opacity .25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .relative, .modal-leave-active .relative { transition: transform .25s; }
.modal-enter-from .relative { transform: translateY(20px); }
.modal-leave-to .relative { transform: translateY(20px); }
</style>
