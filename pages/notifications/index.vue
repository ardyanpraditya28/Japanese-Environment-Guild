<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { authHeader } = useAuth()

const { data: notifs, pending, refresh } = await useFetch('/api/notifications', { headers: authHeader() })

async function markRead(id: string) {
  await $fetch(`/api/notifications/${id}/read`, { method: 'PATCH', headers: authHeader() })
  await refresh()
}

const typeIcon: Record<string, string> = {
  quest_approved: '✓',
  quest_rejected: '✕',
  redemption: '品',
}
const typeColor: Record<string, string> = {
  quest_approved: 'text-cyan bg-cyan/10',
  quest_rejected: 'text-accent bg-accent/10',
  redemption: 'text-gold bg-gold/10',
}
</script>

<template>
  <div class="min-h-screen font-body text-text p-6 md:p-10">
    <div class="flex justify-between items-end mb-8">
      <h1 class="font-heading font-extrabold text-xl">Notifikasi</h1>
      <NuxtLink to="/" class="text-xs text-muted underline">← Kembali</NuxtLink>
    </div>

    <UiLoading v-if="pending" :rows="4" />

    <div v-else class="max-w-lg space-y-3">
      <transition-group name="list">
        <div v-for="n in notifs" :key="n.id"
          class="bg-card rounded-2xl p-4 flex gap-3 items-start transition-all hover:-translate-y-0.5"
          :class="{ 'opacity-50': n.is_read }">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-heading font-bold shrink-0"
            :class="typeColor[n.type] || 'text-muted bg-line'">
            {{ typeIcon[n.type] || '報' }}
          </div>
          <div class="flex-1">
            <p class="text-sm font-heading font-bold mb-1">{{ n.title }}</p>
            <p class="text-xs text-muted">{{ n.content }}</p>
            <p class="text-[10px] text-muted mt-1">{{ new Date(n.created_at).toLocaleString('id-ID') }}</p>
          </div>
          <button v-if="!n.is_read" @click="markRead(n.id)" class="text-[10px] text-cyan font-heading font-bold shrink-0">
            Tandai dibaca
          </button>
        </div>
      </transition-group>

      <UiEmpty v-if="!notifs?.length" icon="鈴" title="Belum ada notifikasi" subtitle="Selesaikan quest biar mulai kebanjiran kabar baik." />
    </div>
  </div>
</template>

<style>
.list-enter-active { transition: all 0.25s ease; }
.list-enter-from { opacity: 0; transform: translateY(-6px); }
</style>
