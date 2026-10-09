<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })
const { authHeader } = useAuth()

const { data: hunters, pending, refresh } = await useFetch('/api/admin/hunters', { headers: authHeader() })
const search = ref('')
const filtered = computed(() => {
  if (!search.value) return hunters.value
  const q = search.value.toLowerCase()
  return hunters.value?.filter((h: any) => h.nickname.toLowerCase().includes(q) || h.nim.includes(q))
})

const resettingId = ref<string | null>(null)
const resetResult = ref<{ id: string; password: string } | null>(null)
const updatingRoleId = ref<string | null>(null)
const errMsg = ref('')

// --- Toast ---
const toast = ref<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
let toastTimer: ReturnType<typeof setTimeout>

function showToast(message: string, type: 'success' | 'error' = 'success') {
  clearTimeout(toastTimer)
  toast.value = { show: true, message, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3500)
}

// --- Modal Konfirmasi Hapus ---
const confirmModal = ref<{ show: boolean; hunterId: string; hunterName: string }>({ show: false, hunterId: '', hunterName: '' })
const deletingId = ref<string | null>(null)

function promptDelete(h: any) {
  confirmModal.value = { show: true, hunterId: h.id, hunterName: h.nickname }
}

async function confirmDelete() {
  const id = confirmModal.value.hunterId
  confirmModal.value.show = false
  errMsg.value = ''
  deletingId.value = id
  try {
    await $fetch(`/api/admin/hunters/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    })
    await refresh()
    showToast('Hunter berhasil dihapus.')
  } catch (e: any) {
    errMsg.value = e?.data?.statusMessage || 'Gagal menghapus hunter'
    showToast(errMsg.value, 'error')
  } finally {
    deletingId.value = null
  }
}

async function changeRole(id: string, newRole: string) {
  errMsg.value = ''
  updatingRoleId.value = id
  try {
    await $fetch(`/api/admin/hunters/${id}/role`, {
      method: 'PATCH',
      headers: authHeader(),
      body: { role: newRole },
    })
    await refresh()
  } catch (e: any) {
    errMsg.value = e?.data?.statusMessage || 'Gagal mengubah role'
  } finally {
    updatingRoleId.value = null
  }
}

async function resetPassword(id: string) {
  if (!confirm('Reset password hunter ini? Password lama otomatis tidak berlaku lagi.')) return
  errMsg.value = ''
  resettingId.value = id
  try {
    const res = await $fetch<{ temporary_password: string }>(`/api/admin/hunters/${id}/reset-password`, {
      method: 'POST',
      headers: authHeader(),
    })
    resetResult.value = { id, password: res.temporary_password }
    await refresh()
  } catch (e: any) {
    errMsg.value = e?.data?.statusMessage || 'Gagal reset password'
  } finally {
    resettingId.value = null
  }
}
</script>

<template>
  <div class="min-h-screen font-body text-text p-4 md:p-10">
    <!-- Toast Notifikasi -->
    <Transition name="toast">
      <div v-if="toast.show"
        class="fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-heading font-bold transition-all"
        :class="toast.type === 'success' ? 'bg-cyan text-white' : 'bg-accent text-white'">
        <span>{{ toast.type === 'success' ? '✓' : '✕' }}</span>
        {{ toast.message }}
      </div>
    </Transition>

    <!-- Modal Konfirmasi Hapus -->
    <Transition name="modal">
      <div v-if="confirmModal.show"
        class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        @click.self="confirmModal.show = false">
        <div class="bg-card rounded-3xl p-7 w-full max-w-sm shadow-2xl">
          <div class="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl mx-auto mb-4">⚠️</div>
          <h2 class="font-heading font-extrabold text-center text-lg mb-2">Hapus Hunter?</h2>
          <p class="text-muted text-sm text-center mb-6">
            Kamu akan menghapus akun
            <span class="text-text font-bold">{{ confirmModal.hunterName }}</span>
            secara permanen. Aksi ini tidak dapat dibatalkan.
          </p>
          <div class="flex gap-3">
            <button @click="confirmModal.show = false"
              class="flex-1 border border-line text-muted font-heading font-bold rounded-2xl py-3 text-sm hover:text-text transition-colors">
              Batal
            </button>
            <button @click="confirmDelete"
              class="flex-1 bg-accent hover:opacity-90 transition-opacity text-white font-heading font-bold rounded-2xl py-3 text-sm">
              Ya, Hapus
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div class="flex justify-between items-end mb-6 gap-3">
      <div class="min-w-0">
        <h1 class="font-heading font-extrabold text-xl mb-1 truncate">Daftar Hunter</h1>
        <p class="text-muted text-sm">Kelola akun &amp; reset password.</p>
      </div>
      <div class="flex gap-3 shrink-0">
        <NuxtLink to="/admin/hunters/new" class="text-xs font-heading font-bold text-cyan whitespace-nowrap">+ Hunter baru</NuxtLink>
        <NuxtLink to="/" class="text-xs text-muted underline whitespace-nowrap">← Kembali</NuxtLink>
      </div>
    </div>

    <input v-model="search" placeholder="Cari NIM atau nama..."
      class="w-full max-w-sm bg-card border border-line rounded-2xl px-4 py-2.5 text-sm mb-6 focus:outline-none focus:border-cyan" />

    <p v-if="errMsg" class="text-accent text-sm mb-4">{{ errMsg }}</p>

    <UiLoading v-if="pending" :rows="5" />

    <template v-else>
      <!-- Mobile: card list (di bawah md) -->
      <div class="md:hidden space-y-3">
        <div v-for="h in filtered" :key="h.id" class="bg-card rounded-2xl p-4">
          <div class="flex justify-between items-start mb-2">
            <div class="min-w-0">
              <p class="font-semibold text-sm truncate">{{ h.nickname }}</p>
              <p class="text-[10px] text-muted font-heading">{{ h.nim }}</p>
            </div>
            <span class="font-heading font-bold text-gold text-sm shrink-0">Rank {{ h.rank }}</span>
          </div>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-heading font-bold" :class="h.must_change_password ? 'text-gold' : 'text-cyan'">
                {{ h.must_change_password ? 'Belum ganti password' : 'Aktif' }}
              </span>
              <span v-if="h.role === 'admin'" class="text-[10px] font-heading font-bold text-accent">· Admin</span>
              <select v-else :value="h.role" @change="changeRole(h.id, ($event.target as HTMLSelectElement).value)"
                :disabled="updatingRoleId === h.id"
                class="text-[10px] font-heading font-bold bg-bg border border-line rounded-lg px-2 py-0.5 text-muted focus:text-cyan focus:outline-none">
                <option value="hunter">⚔️ Hunter</option>
                <option value="staff">📜 Staff</option>
              </select>
            </div>
            <span v-if="resetResult?.id === h.id" class="font-heading font-bold text-cyan text-xs">
              {{ resetResult.password }}
            </span>
            <div v-else class="flex gap-2 shrink-0">
              <button @click="resetPassword(h.id)" :disabled="resettingId === h.id || deletingId === h.id"
                class="text-[11px] text-cyan font-heading font-bold disabled:opacity-50">
                {{ resettingId === h.id ? '...' : 'Reset' }}
              </button>
              <button @click="promptDelete(h)" :disabled="deletingId === h.id || resettingId === h.id"
                class="text-[11px] text-accent font-heading font-bold disabled:opacity-50">
                {{ deletingId === h.id ? '...' : 'Hapus' }}
              </button>
            </div>
          </div>
        </div>
        <UiEmpty v-if="!filtered?.length" icon="人" title="Tidak ada hunter ditemukan" />
      </div>

      <!-- Desktop: tabel (md ke atas) -->
      <div class="hidden md:block bg-card rounded-3xl overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-[10px] font-heading font-bold text-muted uppercase">
              <th class="px-5 py-3">Hunter</th>
              <th class="px-5 py-3">Rank</th>
              <th class="px-5 py-3">Role</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in filtered" :key="h.id" class="border-t border-line">
              <td class="px-5 py-3">
                <div class="font-semibold">{{ h.nickname }}</div>
                <div class="text-[10px] text-muted font-heading">{{ h.nim }}</div>
              </td>
              <td class="px-5 py-3 font-heading font-bold text-gold">{{ h.rank }}</td>
              <td class="px-5 py-3 text-xs">
                <span v-if="h.role === 'admin'" class="font-heading font-bold text-accent px-2 py-1 bg-accent/10 rounded-xl text-xs">Admin</span>
                <select v-else :value="h.role" @change="changeRole(h.id, ($event.target as HTMLSelectElement).value)"
                  :disabled="updatingRoleId === h.id"
                  class="bg-bg border border-line rounded-xl px-2.5 py-1 text-xs text-text focus:border-cyan focus:outline-none font-medium cursor-pointer">
                  <option value="hunter">⚔️ Hunter</option>
                  <option value="staff">📜 Staff</option>
                </select>
              </td>
              <td class="px-5 py-3">
                <span class="text-[10px] font-heading font-bold" :class="h.must_change_password ? 'text-gold' : 'text-cyan'">
                  {{ h.must_change_password ? 'Belum ganti password' : 'Aktif' }}
                </span>
              </td>
              <td class="px-5 py-3 text-right whitespace-nowrap">
                <span v-if="resetResult?.id === h.id" class="font-heading font-bold text-cyan text-xs">
                  {{ resetResult.password }}
                </span>
                <div v-else class="flex gap-3 justify-end whitespace-nowrap">
                  <button @click="resetPassword(h.id)" :disabled="resettingId === h.id || deletingId === h.id"
                    class="text-xs text-cyan font-heading font-bold disabled:opacity-50">
                    {{ resettingId === h.id ? '...' : 'Reset password' }}
                  </button>
                  <button @click="promptDelete(h)" :disabled="deletingId === h.id || resettingId === h.id"
                    class="text-xs text-accent font-heading font-bold disabled:opacity-50">
                    {{ deletingId === h.id ? '...' : 'Hapus' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <UiEmpty v-if="!filtered?.length" icon="人" title="Tidak ada hunter ditemukan" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.95);
}

.modal-enter-active, .modal-leave-active {
  transition: all 0.25s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .bg-card, .modal-leave-to .bg-card {
  transform: scale(0.95);
}
</style>
