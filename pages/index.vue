<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { user, authHeader } = useAuth()

// Optimized API fetching with Promise.all
const [ { data: summary, pending }, { data: unread } ] = await Promise.all([
  useFetch('/api/dashboard/summary', { headers: authHeader() }),
  useFetch('/api/notifications', { headers: authHeader(), query: { unread: 'true' } })
])

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
})

function parseLog(actionType: string) {
  const prefix = actionType?.split(':')[0] || ''
  const map: Record<string, { label: string; icon: string; color: string }> = {
    quest_xp: { label: 'XP dari quest', icon: '巻', color: 'text-cyan bg-cyan/10' },
    quest_gold: { label: 'Gold dari quest', icon: '帯', color: 'text-gold bg-gold/10' },
    quest_gcp: { label: 'GCP dari quest', icon: '位', color: 'text-purple bg-purple/10' },
    quiz_xp: { label: 'XP dari kuis', icon: '学', color: 'text-cyan bg-cyan/10' },
    quiz_gold: { label: 'Gold dari kuis', icon: '学', color: 'text-gold bg-gold/10' },
    redeem: { label: 'Tukar Gold Sink', icon: '品', color: 'text-accent bg-accent/10' },
  }
  return map[prefix] || { label: 'Aktivitas', icon: '報', color: 'text-muted bg-line' }
}

const categoryIcon: Record<string, string> = { event: '祭', regular: '巻', quiz: '問' }
</script>

<template>
  <div class="p-4 md:p-6 min-w-0 max-w-5xl mx-auto">
    <!-- Topbar -->
    <div class="flex justify-between items-center mb-6 gap-3">
      <div class="min-w-0">
        <p class="text-xs text-muted">Overview</p>
        <p class="font-heading font-extrabold text-lg truncate">Dashboard</p>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <NuxtLink to="/notifications" class="relative w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center">
          🔔
          <span v-if="unread?.length" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] flex items-center justify-center font-bold">
            {{ unread.length }}
          </span>
        </NuxtLink>
        <NuxtLink :to="`/profile/${user?.id}`" class="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center font-heading text-sm font-bold text-accent">
          {{ user?.nickname?.[0] }}
        </NuxtLink>
      </div>
    </div>

    <UiLoading v-if="pending" :rows="4" />

    <template v-else>
      <!-- Hero & Player Card -->
      <div class="rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
        style="background: linear-gradient(120deg, #4ECDC4 0%, #6FE0D8 60%, #B7F2ED 100%)">
        <div class="flex-1">
          <p class="font-heading font-extrabold text-xl md:text-2xl text-white mb-1">
            {{ greeting }}, {{ user?.nickname }}! ⛩️
          </p>
          <p class="text-white/90 text-sm mb-5 max-w-md">
            Ada quest baru nunggu buat diselesaikan. Yuk kumpulin XP, Gold, sama GCP hari ini!
          </p>
          <NuxtLink to="/quests" class="inline-block bg-white text-cyan font-heading font-bold text-sm rounded-xl px-5 py-2.5 shadow-sm hover:scale-105 transition-transform">
            Lihat Quest Board →
          </NuxtLink>
        </div>
        
        <!-- Rank Progress Card -->
        <div class="w-full md:w-72 bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30 text-white shadow-sm shrink-0">
          <div class="flex justify-between items-end mb-3">
            <div>
              <p class="text-[10px] uppercase font-bold text-white/80 tracking-wider">Rank Saat Ini</p>
              <p class="font-heading font-extrabold text-3xl">{{ summary?.rank_progress?.currentRank || summary?.profile?.rank || '?' }}</p>
            </div>
            <div class="text-right" v-if="summary?.rank_progress?.nextRank">
              <p class="text-[10px] text-white/80">Next: Rank {{ summary?.rank_progress?.nextRank }}</p>
              <p class="font-heading font-bold text-sm">{{ summary?.profile?.total_xp }} / {{ summary?.rank_progress?.nextThreshold }} XP</p>
            </div>
            <div class="text-right" v-else>
              <p class="text-[10px] text-white/80">Rank Maksimal</p>
              <p class="font-heading font-bold text-sm">MAX XP</p>
            </div>
          </div>
          <!-- Progress Bar -->
          <div class="w-full h-2 bg-black/10 rounded-full overflow-hidden">
            <div class="h-full bg-white rounded-full transition-all duration-1000" 
                 :style="{ width: (summary?.rank_progress?.progressPercent || 0) + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Stat row -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-card rounded-2xl p-4 shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan font-heading text-sm mb-3">巻</div>
          <p class="font-heading font-extrabold text-xl">{{ summary?.completed_count || 0 }}</p>
          <p class="text-[11px] text-muted">Misi Selesai</p>
        </div>
        <div class="bg-card rounded-2xl p-4 shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-heading text-sm mb-3">位</div>
          <p class="font-heading font-extrabold text-xl">{{ summary?.profile?.gcp || 0 }}</p>
          <p class="text-[11px] text-muted">GCP Musim Ini</p>
        </div>
        <div class="bg-card rounded-2xl p-4 shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-heading text-sm mb-3">帯</div>
          <p class="font-heading font-extrabold text-xl">{{ summary?.profile?.gold || 0 }}</p>
          <p class="text-[11px] text-muted">Gold Tersedia</p>
        </div>
      </div>

      <!-- Chart row removed, replaced by Rank Progress in Hero -->

      <!-- Bottom row -->
      <div class="grid md:grid-cols-2 gap-5">
        <div class="bg-card rounded-3xl p-6 shadow-sm">
          <p class="font-heading font-bold text-sm mb-4">Aktivitas Terbaru</p>
          <div v-for="(log, i) in summary?.recent_logs" :key="i" class="flex items-center gap-3 py-2.5 border-b border-line last:border-none">
            <span class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-heading font-bold shrink-0" :class="parseLog(log.action_type).color">
              {{ parseLog(log.action_type).icon }}
            </span>
            <div class="flex-1">
              <p class="text-xs font-semibold">{{ parseLog(log.action_type).label }}</p>
              <p class="text-[10px] text-muted">{{ new Date(log.created_at).toLocaleDateString('id-ID') }}</p>
            </div>
            <span class="font-heading text-xs font-bold" :class="log.points_delta < 0 ? 'text-accent' : 'text-cyan'">
              {{ log.points_delta > 0 ? '+' : '' }}{{ log.points_delta }}
            </span>
          </div>
          <UiEmpty v-if="!summary?.recent_logs?.length" icon="報" title="Belum ada aktivitas" />
        </div>

        <div class="bg-card rounded-3xl p-6 shadow-sm">
          <p class="font-heading font-bold text-sm mb-4">Quest Rekomendasi</p>
          <template v-if="summary?.recommended_quest">
            <span class="inline-flex items-center gap-1.5 text-[10px] font-heading font-bold uppercase px-3 py-1 rounded-lg bg-cyan/10 text-cyan mb-3">
              {{ categoryIcon[summary.recommended_quest.category] }} {{ summary.recommended_quest.category }}
            </span>
            <p class="font-heading font-bold text-base mb-3">{{ summary.recommended_quest.title }}</p>
            <div class="flex gap-3 font-heading text-xs font-bold mb-4">
              <span class="text-muted">{{ summary.recommended_quest.reward_xp }} XP</span>
              <span class="text-cyan">{{ summary.recommended_quest.reward_gcp }} GCP</span>
              <span class="text-gold">{{ summary.recommended_quest.reward_gold }} Gold</span>
            </div>
            <NuxtLink to="/quests" class="block text-center bg-accent hover:bg-accent/90 transition-colors text-white font-heading font-bold text-xs rounded-xl py-2.5">
              Kerjakan sekarang
            </NuxtLink>
          </template>
          <UiEmpty v-else icon="✓" title="Semua quest udah kamu ambil!" subtitle="Mantap, cek lagi nanti kalau ada quest baru." />
        </div>
      </div>
    </template>
  </div>
</template>
