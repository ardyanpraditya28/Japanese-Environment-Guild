<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { authHeader, user } = useAuth()

const searchQuery = ref('')
const debouncedQuery = ref('')
let debounceTimer: ReturnType<typeof setTimeout>

watch(searchQuery, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = val
  }, 350)
})

const { data: hunters, pending, refresh } = await useFetch('/api/hunters', {
  headers: authHeader(),
  query: computed(() => ({ q: debouncedQuery.value })),
  watch: [debouncedQuery],
})

const rankColors: Record<string, string> = {
  S: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30',
  A: 'text-cyan bg-cyan/10 border border-cyan/30',
  B: 'text-green-400 bg-green-400/10 border border-green-400/30',
  C: 'text-blue-400 bg-blue-400/10 border border-blue-400/30',
  D: 'text-muted bg-line border border-line',
  E: 'text-muted bg-line border border-line',
}

function rankColor(rank: string) {
  return rankColors[rank?.[0]?.toUpperCase()] || rankColors['E']
}
</script>

<template>
  <div class="p-4 md:p-6 min-w-0 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center flex-wrap gap-4">
      <div>
        <p class="text-xs text-muted">Temukan</p>
        <h1 class="font-heading font-extrabold text-xl">Pencarian Hunter</h1>
      </div>
      <NuxtLink v-if="user?.role === 'admin'" to="/admin/hunters"
        class="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-cyan bg-cyan/10 hover:bg-cyan/20 px-4 py-2 rounded-xl transition-colors">
        ⚙ Kelola Hunter
      </NuxtLink>
    </div>

    <!-- Search Bar -->
    <div class="relative mb-6">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm select-none">🔍</span>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari nama hunter..."
        class="w-full bg-card border border-line rounded-2xl pl-10 pr-4 py-3 text-sm font-body focus:outline-none focus:border-accent shadow-sm transition-colors"
      />
      <span v-if="searchQuery" @click="searchQuery = ''" class="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text cursor-pointer text-xs">✕</span>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="bg-card rounded-3xl p-5 animate-pulse">
        <div class="w-14 h-14 rounded-full bg-line mx-auto mb-3"></div>
        <div class="h-3 bg-line rounded-full mx-auto mb-2 w-20"></div>
        <div class="h-2.5 bg-line rounded-full mx-auto w-12"></div>
      </div>
    </div>

    <!-- Empty Search Result -->
    <div v-else-if="!hunters?.length" class="flex flex-col items-center justify-center py-20 text-muted">
      <span class="text-5xl mb-3 opacity-40">🔎</span>
      <p class="font-heading font-bold text-sm">Tidak ada hunter ditemukan</p>
      <p class="text-xs mt-1">Coba nama yang lain</p>
    </div>

    <!-- Hunter Grid -->
    <div v-else>
      <p class="text-xs text-muted mb-4">
        {{ searchQuery ? `${hunters.length} hasil untuk "${searchQuery}"` : 'Menampilkan hunter secara acak' }}
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <NuxtLink
          v-for="hunter in hunters"
          :key="hunter.id"
          :to="`/profile/${hunter.id}`"
          class="bg-card rounded-3xl p-5 text-center group hover:-translate-y-1 transition-all duration-200 shadow-sm hover:shadow-md border border-transparent hover:border-accent/20 cursor-pointer"
        >
          <!-- Avatar -->
          <div class="relative mx-auto mb-3 w-fit">
            <div class="w-16 h-16 rounded-full bg-bg flex items-center justify-center overflow-hidden ring-2 ring-line group-hover:ring-accent/40 transition-all">
              <img v-if="hunter.avatar_url" :src="hunter.avatar_url" class="w-full h-full object-cover rounded-full" />
              <span v-else class="font-heading text-2xl font-extrabold text-muted">{{ hunter.nickname?.[0] }}</span>
            </div>
            <!-- Rank Badge -->
            <span class="absolute -bottom-1 -right-1 text-[9px] font-heading font-extrabold px-1.5 py-0.5 rounded-md shadow-sm"
              :class="rankColor(hunter.rank)">
              {{ hunter.rank }}
            </span>
          </div>

          <!-- Name -->
          <p class="font-heading font-extrabold text-sm truncate mb-1 group-hover:text-accent transition-colors">
            {{ hunter.nickname }}
          </p>

          <!-- XP -->
          <p class="text-[10px] text-muted font-medium">{{ hunter.total_xp?.toLocaleString('id-ID') }} XP</p>

          <!-- Bio preview -->
          <p v-if="hunter.bio" class="text-[9px] text-muted mt-2 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
            {{ hunter.bio }}
          </p>

          <!-- View Profile hint -->
          <p class="text-[9px] font-bold text-accent mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Lihat Profil →
          </p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
