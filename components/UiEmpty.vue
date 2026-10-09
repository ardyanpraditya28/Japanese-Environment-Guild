<script setup lang="ts">
defineProps<{ icon?: string; title: string; subtitle?: string }>()
</script>

<template>
  <div class="text-center py-14">
    <div class="w-14 h-14 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4 font-heading text-xl text-muted">
      {{ icon || '巻' }}
    </div>
    <p class="font-heading font-bold text-sm text-text mb-1">{{ title }}</p>
    <p v-if="subtitle" class="text-xs text-muted">{{ subtitle }}</p>
  </div>
</template>
