<script setup lang="ts">
defineProps<{ rows?: number }>()
</script>

<template>
  <div class="space-y-3">
    <div v-for="i in rows || 3" :key="i" class="bg-card rounded-2xl h-16 relative overflow-hidden">
      <div class="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
        style="background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)"></div>
    </div>
  </div>
</template>

<style>
@keyframes shimmer {
  100% { transform: translateX(100%); }
}
</style>
