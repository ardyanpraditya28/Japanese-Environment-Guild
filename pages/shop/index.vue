<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { authHeader, user } = useAuth()
const isStaff = computed(() => ['admin', 'staff'].includes(user.value?.role ?? ''))

const { data: shop, pending, refresh } = await useFetch('/api/shop', { headers: authHeader() })

const items   = computed(() => (shop.value?.items ?? []).filter((item: any) => !item.is_hidden))
const myGold  = computed(() => shop.value?.my_gold ?? 0)
const myRank  = computed(() => shop.value?.my_rank ?? 'F')

const busyId  = ref<string | null>(null)
const msg     = ref('')
const msgType = ref<'success' | 'error'>('success')

// ── Konfirmasi modal ──
const confirmItem = ref<any>(null)
function openConfirm(item: any) { confirmItem.value = item }
function closeConfirm() { confirmItem.value = null }

async function doRedeem() {
  if (!confirmItem.value) return
  const item = confirmItem.value
  closeConfirm()
  msg.value = ''
  busyId.value = item.id
  try {
    await $fetch(`/api/shop/${item.id}/redeem`, { method: 'POST', headers: authHeader() })
    msg.value = `Berhasil menukar "${item.name}"!`
    msgType.value = 'success'
    await refresh()
  } catch (e: any) {
    msg.value = e?.data?.statusMessage || 'Gagal menukar'
    msgType.value = 'error'
  } finally {
    busyId.value = null
  }
}

// ── Rank helper ──
const RANK_ORDER = ['F','E','D','C','B','A','S','SS','SSS']
function rankLevel(r: string) { return RANK_ORDER.indexOf(r ?? 'F') }
function canAfford(item: any) { return myGold.value >= item.price_gold }
function hasRank(item: any)   { return !item.min_rank || rankLevel(myRank.value) >= rankLevel(item.min_rank) }
function inStock(item: any)   { return item.stock === null || item.stock > 0 }
function canBuy(item: any)    { return canAfford(item) && hasRank(item) && inStock(item) }

const typeLabel: Record<string, string> = { border: '扇 Border', theme: '燈 Theme', merchandise: '帯 Merchandise' }
</script>

<template>
  <div class="min-h-screen font-body text-text p-4 md:p-8">

    <!-- header + saldo -->
    <div class="flex justify-between items-start mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="font-heading font-extrabold text-xl mb-1">The Gold Sink 帯</h1>
        <p class="text-muted text-sm">Tukar Gold hasil quest jadi reward.</p>
        <!-- tombol kelola untuk admin/staff -->
        <NuxtLink v-if="isStaff" to="/admin/shop"
          class="inline-flex items-center gap-1.5 mt-3 text-xs font-heading font-bold text-cyan bg-cyan/10 hover:bg-cyan/20 px-3 py-1.5 rounded-xl transition-colors">
          ⚙ Kelola Item Shop
        </NuxtLink>
      </div>
      <div class="text-right shrink-0 bg-card rounded-2xl px-4 py-3">
        <p class="text-[10px] text-muted uppercase tracking-wider mb-0.5">Saldo Gold</p>
        <p class="font-heading font-extrabold text-xl text-gold">
          {{ myGold.toLocaleString() }} <span class="text-sm font-semibold">Gold</span>
        </p>
      </div>
    </div>

    <!-- toast -->
    <transition name="fade">
      <div v-if="msg"
        class="flex items-center gap-3 rounded-2xl px-4 py-3 mb-5 text-sm font-semibold"
        :class="msgType === 'success' ? 'bg-cyan/10 text-cyan' : 'bg-accent/10 text-accent'">
        <span>{{ msgType === 'success' ? '✓' : '✕' }}</span>
        {{ msg }}
        <button @click="msg = ''" class="ml-auto opacity-60 hover:opacity-100">×</button>
      </div>
    </transition>

    <UiLoading v-if="pending" :rows="3" />

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="item in items" :key="item.id"
        class="relative bg-card rounded-3xl p-5 flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-xl">

        <!-- lock overlay jika rank tidak cukup -->
        <div v-if="!hasRank(item)"
          class="absolute inset-0 rounded-3xl flex flex-col items-center justify-center bg-bg/75 backdrop-blur-[2px] z-10">
          <span class="text-3xl mb-2">🔒</span>
          <p class="text-xs font-heading font-bold text-muted">Min. Rank {{ item.min_rank }}</p>
          <p class="text-[10px] text-muted mt-1">Rank-mu: {{ myRank }}</p>
        </div>

        <!-- type badge -->
        <span class="inline-block text-[10px] font-heading font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg mb-3 self-start"
          :class="{
            'text-cyan bg-cyan/10': item.type === 'border',
            'text-purple bg-purple/10': item.type === 'theme',
            'text-gold bg-gold/10': item.type === 'merchandise' || !item.type,
          }">
          {{ typeLabel[item.type] || '品 Item' }}
        </span>

        <!-- gambar / icon -->
        <div class="w-full h-36 rounded-2xl overflow-hidden mb-4 flex items-center justify-center"
          :class="item.image_url ? '' : 'bg-gold/10'">
          <img v-if="item.image_url"
            :src="item.image_url"
            :alt="item.name"
            class="w-full h-full object-cover" />
          <span v-else class="font-heading text-2xl text-gold">
            {{ item.type === 'border' ? '扇' : item.type === 'theme' ? '燈' : '帯' }}
          </span>
        </div>

        <!-- info -->
        <h3 class="font-heading font-bold text-sm mb-1 text-center">{{ item.name }}</h3>
        <p v-if="item.description" class="text-[11px] text-muted text-center mb-2 leading-relaxed line-clamp-2">
          {{ item.description }}
        </p>

        <!-- meta -->
        <div class="flex items-center justify-center gap-2 flex-wrap text-[10px] text-muted mb-4">
          <span v-if="item.min_rank" class="bg-line rounded-lg px-2 py-0.5">Min. Rank {{ item.min_rank }}</span>
          <span v-if="item.stock !== null" class="rounded-lg px-2 py-0.5"
            :class="item.stock === 0 ? 'bg-accent/10 text-accent' : 'bg-line'">
            {{ item.stock === 0 ? 'Stok Habis' : `Stok: ${item.stock}` }}
          </span>
          <span v-else class="bg-line rounded-lg px-2 py-0.5">Unlimited</span>
        </div>

        <!-- price + tombol -->
        <div class="mt-auto">
          <div class="flex items-center justify-center gap-1.5 mb-3">
            <span class="font-heading font-extrabold text-gold text-lg">{{ item.price_gold.toLocaleString() }}</span>
            <span class="text-xs text-muted font-semibold">Gold</span>
            <span v-if="!canAfford(item) && inStock(item) && hasRank(item)"
              class="text-[10px] text-accent ml-1 font-semibold">
              (kurang {{ (item.price_gold - myGold).toLocaleString() }})
            </span>
          </div>

          <button
            @click="openConfirm(item)"
            :disabled="!canBuy(item) || busyId === item.id"
            class="w-full font-heading font-bold text-xs rounded-xl py-2.5 transition-all active:scale-95 disabled:cursor-not-allowed"
            :class="canBuy(item)
              ? 'bg-accent text-white hover:bg-accent/90'
              : 'bg-line text-muted'">
            <span v-if="busyId === item.id">Memproses…</span>
            <span v-else-if="!inStock(item)">Stok Habis</span>
            <span v-else-if="!canAfford(item)">Gold Tidak Cukup</span>
            <span v-else>Tukar Sekarang</span>
          </button>
        </div>
      </div>

      <div v-if="!items.length" class="sm:col-span-2 lg:col-span-3">
        <UiEmpty icon="店" title="Toko masih kosong" subtitle="Admin belum menambahkan item Gold Sink." />
      </div>
    </div>

    <!-- ── Modal konfirmasi ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmItem"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeConfirm" />
          <div class="relative bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl z-10">
            <p class="text-[10px] text-muted uppercase tracking-widest mb-1">Konfirmasi Penukaran</p>
            <h2 class="font-heading font-extrabold text-lg mb-4">{{ confirmItem.name }}</h2>

            <div class="bg-bg rounded-2xl p-4 mb-5 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Harga</span>
                <span class="font-heading font-bold text-gold">{{ confirmItem.price_gold.toLocaleString() }} Gold</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Saldo kamu</span>
                <span class="font-heading font-bold">{{ myGold.toLocaleString() }} Gold</span>
              </div>
              <div class="border-t border-line pt-2 flex justify-between">
                <span class="text-muted">Sisa setelah tukar</span>
                <span class="font-heading font-bold"
                  :class="myGold - confirmItem.price_gold >= 0 ? 'text-cyan' : 'text-accent'">
                  {{ (myGold - confirmItem.price_gold).toLocaleString() }} Gold
                </span>
              </div>
            </div>

            <p class="text-xs text-muted text-center mb-5">Penukaran tidak bisa dibatalkan setelah dikonfirmasi.</p>

            <div class="flex gap-3">
              <button @click="closeConfirm"
                class="flex-1 border border-line font-heading font-bold text-sm rounded-xl py-2.5 text-muted hover:text-text transition-colors">
                Batal
              </button>
              <button @click="doRedeem"
                class="flex-1 bg-accent text-white font-heading font-bold text-sm rounded-xl py-2.5 hover:bg-accent/90 active:scale-95 transition-all">
                Ya, Tukar!
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
