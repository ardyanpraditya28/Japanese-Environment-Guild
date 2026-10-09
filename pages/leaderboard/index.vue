<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { authHeader } = useAuth()

const { data: board, pending } = await useFetch('/api/leaderboard', { headers: authHeader() })
const { data: hof } = await useFetch('/api/leaderboard/hall-of-fame', { headers: authHeader() })

const podium = computed(() => board.value?.ranking?.slice(0, 3) || [])
const rest   = computed(() => board.value?.ranking?.slice(3)  || [])

// Gold / Silver / Bronze — sesuai tema dark website
const podiumColors = [
  { ring: '#FFC53D', bg: 'rgba(255,197,61,0.12)'  },  // 1st – gold
  { ring: '#9EA1B8', bg: 'rgba(158,161,184,0.12)' },  // 2nd – silver (muted)
  { ring: '#FF3B57', bg: 'rgba(255,59,87,0.12)'   },  // 3rd – accent red
]

// podium display order: 2nd · 1st · 3rd
const podiumOrder = computed(() => [podium.value[1], podium.value[0], podium.value[2]])
</script>

<template>
  <div class="lb-page font-body">

    <!-- ── Header ── -->
    <div class="lb-header">
      <NuxtLink to="/" class="lb-back font-heading">‹</NuxtLink>
      <div class="text-center">
        <p class="text-[10px] text-muted uppercase tracking-widest mb-0.5">Season Berjalan</p>
        <h1 class="lb-title font-heading">Leaderboard</h1>
      </div>
      <div style="width:32px" />
    </div>

    <UiLoading v-if="pending" :rows="5" />

    <template v-else>

      <!-- ── Podium Top 3 ── -->
      <div v-if="podium.length" class="lb-podium">
        <div
          v-for="(p, i) in podiumOrder"
          :key="p?.user_id || i"
          class="lb-podium-slot"
          :class="i === 1 ? 'lb-podium-slot--center' : 'lb-podium-slot--side'"
        >
          <template v-if="p">
            <!-- crown -->
            <span class="lb-crown" :style="{ color: podiumColors[p.rank - 1].ring }">♛</span>

            <!-- avatar ring -->
            <div
              class="lb-avatar-ring"
              :style="{
                width:  p.rank === 1 ? '84px' : '66px',
                height: p.rank === 1 ? '84px' : '66px',
                border: `3px solid ${podiumColors[p.rank - 1].ring}`,
                background: podiumColors[p.rank - 1].bg,
              }"
            >
              <img v-if="p.avatar_url" :src="p.avatar_url" class="w-full h-full object-cover rounded-full" />
              <span
                v-else
                class="lb-avatar-letter font-heading"
                :style="{ fontSize: p.rank === 1 ? '30px' : '22px', color: podiumColors[p.rank - 1].ring }"
              >{{ p.nickname?.[0]?.toUpperCase() }}</span>

              <!-- rank number badge -->
              <span class="lb-rank-badge" :style="{ background: podiumColors[p.rank - 1].ring }">{{ p.rank }}</span>
            </div>

            <p class="lb-podium-name">{{ p.nickname }}</p>
            <p class="lb-podium-pts font-heading" :style="{ color: podiumColors[p.rank - 1].ring }">
              {{ p.gcp.toLocaleString() }}
              <span class="lb-trend-up">▲</span>
            </p>
          </template>
        </div>
      </div>

      <!-- ── List rank 4+ ── -->
      <div class="lb-list">
        <p class="lb-list-heading font-heading">Ranking Lengkap</p>

        <div v-for="r in rest" :key="r.user_id" class="lb-row">
          <span class="lb-row-rank font-heading">{{ r.rank }}</span>
          <span class="lb-row-trend" style="color:#31D8FF">▲</span>
          <div class="lb-row-avatar font-heading">
            <img v-if="r.avatar_url" :src="r.avatar_url" class="w-full h-full object-cover rounded-full" />
            <span v-else>{{ r.nickname?.[0]?.toUpperCase() }}</span>
          </div>
          <span class="lb-row-name">{{ r.nickname }}</span>
          <span class="lb-row-pts font-heading">{{ r.gcp.toLocaleString() }} GCP</span>
        </div>

        <UiEmpty
          v-if="!board?.ranking?.length"
          icon="位"
          title="Belum ada hunter di ranking"
          subtitle="Selesaikan quest buat mulai kumpulin GCP."
        />
      </div>

      <!-- ── Hall of Fame ── -->
      <div class="lb-hof" v-if="hof?.length">
        <div class="lb-hof-header">
          <span class="lb-hof-icon">🏆</span>
          <p class="lb-hof-title font-heading">Hall of Fame</p>
          <p class="lb-hof-sub">Top hunter dari season-season sebelumnya</p>
        </div>

        <!-- Per-season block -->
        <div v-for="season in hof" :key="season.season_name" class="lb-hof-season">
          <p class="lb-hof-season-name font-heading">{{ season.season_name }}</p>
          <div class="lb-hof-list">
            <div v-for="(h, idx) in season.top3" :key="h.id" class="lb-hof-card">
              <!-- Rank badge -->
              <div class="lb-hof-rank font-heading" :style="{ color: ['#FFC53D','#9EA1B8','#FF3B57'][idx] }">
                {{ ['🥇','🥈','🥉'][idx] }}
              </div>
              <!-- Avatar -->
              <div class="lb-hof-card-avatar font-heading"
                :style="{ borderColor: ['#FFC53D55','#9EA1B855','#FF3B5755'][idx],
                           background: ['rgba(255,197,61,.15)','rgba(158,161,184,.15)','rgba(255,59,87,.15)'][idx] }">
                <img v-if="h.avatar_url" :src="h.avatar_url" class="w-full h-full object-cover rounded-full" />
                <span v-else :style="{ color: ['#FFC53D','#9EA1B8','#FF3B57'][idx] }">{{ h.nickname?.[0]?.toUpperCase() }}</span>
              </div>
              <!-- Info -->
              <div class="lb-hof-card-info">
                <p class="lb-hof-card-name font-heading">{{ h.nickname }}</p>
                <p class="lb-hof-card-pts-sub">{{ h.final_gcp?.toLocaleString() }} GCP</p>
              </div>
              <span class="lb-hof-card-pts font-heading" :style="{ color: ['#FFC53D','#9EA1B8','#FF3B57'][idx] }">
                #{{ h.rank_at_time }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="lb-hof-empty-wrap">
        <p class="lb-hof-empty">Belum ada season yang ditutup.</p>
      </div>


    </template>

    <!-- ── Sticky: posisi saya ── -->
    <div v-if="board?.my_position" class="lb-my-rank">
      <span class="lb-my-rank-num font-heading">{{ board.my_position.rank }}</span>
      <span class="lb-my-rank-trend">▲</span>
      <div class="lb-my-rank-avatar font-heading">
        <img v-if="board.my_position.avatar_url" :src="board.my_position.avatar_url" class="w-full h-full object-cover rounded-full" />
        <span v-else>Me</span>
      </div>
      <span class="lb-my-rank-label">Your current rank</span>
      <span class="lb-my-rank-pts font-heading">{{ board.my_position.gcp.toLocaleString() }} GCP</span>
    </div>

  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────
   Tokens (sesuai tailwind.config.ts project)
   bg:#0A0A12 | card:#1D1E2C | line:#2A2B3D
   accent:#FF3B57 | cyan:#31D8FF | gold:#FFC53D
   text:#F4F5FA | muted:#9EA1B8
───────────────────────────────────────── */

/* ── Page shell ── */
.lb-page {
  min-height: 100svh;
  color: #F4F5FA;
  padding-bottom: 112px;
  position: relative;
  overflow-x: hidden;
}

/* subtle radial glow behind podium area */
.lb-page::before {
  content: '';
  position: absolute;
  top: 0; left: 50%;
  transform: translateX(-50%);
  width: 480px; height: 320px;
  background: radial-gradient(ellipse at top, rgba(255,197,61,.08) 0%, transparent 70%);
  pointer-events: none;
}

/* ── Header ── */
.lb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 14px;
}
.lb-back {
  font-size: 26px;
  color: #9EA1B8;
  text-decoration: none;
  line-height: 1;
  width: 32px;
  display: block;
  transition: color .2s;
}
.lb-back:hover { color: #F4F5FA; }
.lb-title {
  font-size: 18px;
  font-weight: 700;
  color: #F4F5FA;
}

/* ── Podium ── */
.lb-podium {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 16px;
  padding: 8px 20px 32px;
  position: relative;
}
.lb-podium-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.lb-podium-slot--center { order: 2; margin-bottom: 0; }
.lb-podium-slot--side   { order: 1; margin-bottom: 20px; }
.lb-podium-slot:last-child { order: 3; }

.lb-crown {
  font-size: 22px;
  display: block;
  margin-bottom: 4px;
  filter: drop-shadow(0 0 8px currentColor);
}

.lb-avatar-ring {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 10px;
  box-shadow: 0 0 20px rgba(0,0,0,.4);
  transition: transform .2s;
  cursor: default;
}
.lb-avatar-ring:hover { transform: scale(1.07); }

.lb-avatar-letter {
  font-weight: 800;
  line-height: 1;
  user-select: none;
}

.lb-rank-badge {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  color: #0A0A12;
  font-size: 11px;
  font-weight: 800;
  width: 20px; height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #0A0A12;
}

.lb-podium-name {
  font-size: 12px;
  font-weight: 600;
  color: #F4F5FA;
  max-width: 84px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lb-podium-pts {
  font-size: 13px;
  font-weight: 800;
  margin-top: 3px;
}
.lb-trend-up {
  font-size: 9px;
  color: #31D8FF;
  margin-left: 2px;
}

/* ── List ── */
.lb-list {
  background: #1D1E2C;
  border-radius: 28px 28px 0 0;
  padding: 20px 20px 12px;
  box-shadow: 0 -2px 24px rgba(0,0,0,.3);
  min-height: 200px;
}
.lb-list-heading {
  font-size: 11px;
  font-weight: 700;
  color: #9EA1B8;
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: 12px;
}
.lb-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 6px;
  border-bottom: 1px solid #2A2B3D;
  border-radius: 12px;
  transition: background .15s;
}
.lb-row:last-child { border-bottom: none; }
.lb-row:hover { background: rgba(255,255,255,.04); }

.lb-row-rank {
  font-size: 14px;
  font-weight: 800;
  color: #9EA1B8;
  width: 22px;
  text-align: right;
  flex-shrink: 0;
}
.lb-row-trend {
  font-size: 9px;
  flex-shrink: 0;
  width: 10px;
}
.lb-row-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2A2B3D, #3D3E54);
  border: 2px solid #2A2B3D;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  color: #31D8FF;
  flex-shrink: 0;
}
.lb-row-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #F4F5FA;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lb-row-pts {
  font-size: 13px;
  font-weight: 700;
  color: #FFC53D;
  flex-shrink: 0;
}

/* ── Hall of Fame ── */
.lb-hof {
  background: #1D1E2C;
  margin: 0;
  padding: 24px 20px 20px;
  border-top: 1px solid #2A2B3D;
}
.lb-hof-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.lb-hof-icon { font-size: 22px; }
.lb-hof-title {
  font-size: 16px;
  font-weight: 800;
  color: #FFC53D;
  flex-shrink: 0;
}
.lb-hof-sub {
  font-size: 11px;
  color: #9EA1B8;
  width: 100%;
  margin-top: -8px;
  padding-left: 2px;
}
.lb-hof-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lb-hof-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,197,61,.06);
  border: 1px solid rgba(255,197,61,.15);
  border-radius: 16px;
  padding: 12px 14px;
  transition: background .2s;
}
.lb-hof-card:hover { background: rgba(255,197,61,.10); }
.lb-hof-card-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFC53D33, #FFC53D55);
  border: 2px solid #FFC53D55;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 800;
  color: #FFC53D;
  flex-shrink: 0;
}
.lb-hof-card-info { flex: 1; min-width: 0; }
.lb-hof-card-name {
  font-size: 14px; font-weight: 700;
  color: #F4F5FA;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.lb-hof-card-season {
  font-size: 11px;
  color: #9EA1B8;
  margin-top: 1px;
}
.lb-hof-card-pts {
  font-size: 13px;
  font-weight: 800;
  color: #FFC53D;
  flex-shrink: 0;
}
.lb-hof-empty-wrap { padding: 16px 20px; }
.lb-hof-empty { font-size: 12px; color: #9EA1B8; text-align: center; }

.lb-hof-season { margin-bottom: 20px; }
.lb-hof-season:last-child { margin-bottom: 0; }
.lb-hof-season-name {
  font-size: 11px;
  font-weight: 700;
  color: #9EA1B8;
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: 8px;
  padding-left: 2px;
}
.lb-hof-rank {
  font-size: 20px;
  flex-shrink: 0;
  width: 28px;
  text-align: center;
}
.lb-hof-card-pts-sub {
  font-size: 11px;
  color: #9EA1B8;
  margin-top: 1px;
}


/* ── Sticky my-rank ── */
.lb-my-rank {
  position: fixed;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  width: min(480px, calc(100% - 32px));
  background: #1D1E2C;
  border-radius: 20px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
  border: 1.5px solid #FF3B57;
  z-index: 50;
}
.lb-my-rank-num {
  font-size: 16px;
  font-weight: 800;
  color: #F4F5FA;
  flex-shrink: 0;
}
.lb-my-rank-trend {
  font-size: 9px;
  color: #31D8FF;
}
.lb-my-rank-avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF3B57, #cc2040);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; color: #fff;
  flex-shrink: 0;
}
.lb-my-rank-label {
  font-size: 14px;
  font-weight: 600;
  color: #F4F5FA;
}
.lb-my-rank-pts {
  font-size: 13px;
  font-weight: 700;
  color: #FFC53D;
  flex-shrink: 0;
}
</style>
