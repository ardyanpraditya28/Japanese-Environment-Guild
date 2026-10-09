<script setup lang="ts">
const { user, authHeader, logout } = useAuth()
const route = useRoute()

// Ambil data profile sederhana untuk dapet rank di sidebar
const { data: profile } = await useFetch(`/api/profile/${user.value?.id}`, { 
  headers: authHeader(),
  lazy: true
})

const navItems = computed(() => {
  const base = [
    { to: '/', label: 'Beranda', icon: '屋' },
    { to: `/profile/${user.value?.id}`, label: 'Hunter Card', icon: '灯' },
    { to: '/quests', label: 'Quest', icon: '巻' },
    { to: '/academy', label: 'Academy', icon: '学' },
    { to: '/hunters', label: 'Hunter', icon: '探' },
    { to: '/leaderboard', label: 'Leaderboard', icon: '位' },
    { to: '/shop', label: 'Shop', icon: '品' },
    { to: '/notifications', label: 'Notification', icon: '鈴' },
  ]
  
  // Note: user requested "9. Hunters (tempat admin mengelola hunter )masukan ke menu Hunter"
  // We'll put it here in the sidebar, and also add a button in the Hunter page.
  if (user.value?.role === 'admin') {
    base.push({ to: '/admin/hunters', label: 'Kelola Hunter', icon: '加' })
    base.push({ to: '/admin/seasons/close', label: 'End Season', icon: '終' })
  }
  return base
})

const bgImage = computed(() => {
  const path = route.path
  
  if (path === '/') return '/image/Genshin-Impact-Character-PNG-Cutout.png'
  if (path.startsWith('/profile')) return '/image/Genshin-Impact-Character-PNG-Image.png'
  if (path.startsWith('/quests')) return '/image/Genshin-Impact-Character-PNG-Images-HD.png'
  if (path.startsWith('/academy')) return '/image/Genshin-Impact-Character-PNG-Pic.png'
  if (path === '/hunters') return '/image/image (1).png'
  if (path.startsWith('/leaderboard')) return '/image/image (2).png'
  if (path.startsWith('/shop')) return '/image/image (3).png'
  if (path.startsWith('/notifications')) return '/image/image (4).png'
  if (path.startsWith('/admin')) return '/image/image (5).png'
  
  return '/image/image.png' // Default fallback
})
</script>

<template>
  <div class="min-h-screen bg-bg font-body text-text flex flex-col md:flex-row relative z-0">
    <!-- Route-Specific Background Layer -->
    <div 
      v-if="bgImage" 
      class="fixed inset-0 pointer-events-none opacity-40 -z-10 responsive-bg"
      :style="{
        '--bg-img': route.path === '/admin/seasons/close' ? `url('/image/image (1).png'), url('/image/image (5).png')` : `url('${bgImage}')`,
        '--bg-size': route.path === '/admin/seasons/close' ? 'auto 100vh, auto 100vh' : 'auto 100vh',
        '--bg-pos-desktop': route.path === '/admin/seasons/close' ? '5% bottom, 95% bottom' :
                            route.path.startsWith('/notifications') ? '120% bottom' : 
                            route.path.startsWith('/shop') ? '10% bottom' :
                            route.path.startsWith('/profile') ? '60% bottom' :
                            route.path.startsWith('/quests') ? '100% bottom' : 'center bottom',
        '--bg-repeat': route.path === '/admin/seasons/close' ? 'no-repeat, no-repeat' : 'no-repeat'
      }"
    ></div>

    <!-- Sidebar (desktop) -->
    <aside class="w-60 shrink-0 m-4 rounded-3xl bg-card/90 backdrop-blur-md p-5 hidden md:flex flex-col fixed h-[calc(100vh-2rem)] overflow-y-auto">
      <div class="flex items-center gap-2 mb-8">
        <div class="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center font-heading font-extrabold text-accent">鬼</div>
        <div>
          <p class="font-heading font-extrabold text-sm leading-none">Japan Guild</p>
          <p class="text-[10px] text-muted">SPBA · Divisi Jepang</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="route.path === item.to ? 'bg-bg text-text text-accent font-bold' : 'text-muted hover:bg-bg hover:text-text'">
          <span class="w-7 h-7 rounded-lg flex items-center justify-center font-heading text-xs shrink-0"
            :class="route.path === item.to ? 'bg-accent/10 text-accent' : 'bg-bg'">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="rounded-2xl p-4 text-center mt-6" style="background: linear-gradient(160deg, #FF7FA6, #FFC857)">
        <p class="font-heading font-extrabold text-sm text-white mb-1">Rank {{ profile?.rank || '...' }}</p>
        <p class="text-[11px] text-white/85 mb-3">Terus kumpulin XP buat naik rank!</p>
        <NuxtLink :to="`/profile/${user?.id}`" class="block bg-white/90 text-accent font-heading font-bold text-xs rounded-xl py-2">
          Lihat progres
        </NuxtLink>
      </div>

      <button @click="logout" class="mt-4 w-full bg-accent/10 hover:bg-accent text-accent hover:text-white text-xs font-heading font-bold py-2.5 rounded-xl transition-all">Keluar</button>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 min-w-0 md:ml-[17rem] pb-24 md:pb-0">
      <NuxtPage />
    </main>

    <!-- Bottom Navigation (Mobile) -->
    <nav class="md:hidden fixed bottom-0 left-0 w-full bg-card/90 backdrop-blur-md border-t border-line flex justify-between px-2 py-2 pb-safe z-50 rounded-t-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.03)] overflow-x-auto gap-2">
      <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
        class="flex flex-col items-center justify-center shrink-0 w-14 gap-1 p-1 rounded-xl transition-all"
        :class="route.path === item.to ? 'text-accent' : 'text-muted'">
        <span class="w-8 h-8 rounded-full flex items-center justify-center font-heading text-sm"
          :class="route.path === item.to ? 'bg-accent/10' : 'bg-bg'">{{ item.icon }}</span>
        <span class="text-[9px] font-bold truncate w-full text-center">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
/* Support for iOS safe area at bottom */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0.5rem);
}

/* Hide scrollbar for mobile nav */
nav::-webkit-scrollbar {
  display: none;
}
nav {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

/* Custom slim scrollbar for desktop sidebar */
aside::-webkit-scrollbar {
  width: 5px;
}
aside::-webkit-scrollbar-track {
  background: transparent; 
}
aside::-webkit-scrollbar-thumb {
  background: rgba(150, 150, 150, 0.3); 
  border-radius: 10px;
}
aside::-webkit-scrollbar-thumb:hover {
  background: rgba(150, 150, 150, 0.5); 
}
aside {
  scrollbar-width: thin;
  scrollbar-color: rgba(150, 150, 150, 0.3) transparent;
}

/* Responsive Background Logic */
.responsive-bg {
  background-image: var(--bg-img);
  background-size: var(--bg-size);
  background-repeat: var(--bg-repeat);
  /* Default untuk HP (Mobile): selalu di tengah */
  background-position: center bottom;
}
/* Layar Tablet & Desktop (min-width: 768px setara 'md' Tailwind) */
@media (min-width: 768px) {
  .responsive-bg {
    background-position: var(--bg-pos-desktop);
  }
}
</style>
