// Rank threshold — belum ditentukan lengkap di PRD (cuma F, E, D, SSS),
// angka C/B/A/S/SS di bawah ini asumsi kurva naik bertahap. Gampang diubah,
// tinggal edit array ini, tidak ada tempat lain yang hardcode angka rank.
export const RANK_THRESHOLDS = [
  { rank: 'F', xp: 0 },
  { rank: 'E', xp: 500 },
  { rank: 'D', xp: 1500 },
  { rank: 'C', xp: 3500 },
  { rank: 'B', xp: 7500 },
  { rank: 'A', xp: 15000 },
  { rank: 'S', xp: 25000 },
  { rank: 'SS', xp: 35000 },
  { rank: 'SSS', xp: 50000 },
] as const

export function calculateRank(totalXp: number): string {
  let current: string = RANK_THRESHOLDS[0].rank
  for (const t of RANK_THRESHOLDS) {
    if (totalXp >= t.xp) current = t.rank
    else break
  }
  return current
}

// Dipakai buat progress bar di Hunter Card: rank sekarang, rank berikutnya,
// dan berapa persen sudah ke sana.
export function nextRankInfo(totalXp: number) {
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (totalXp < RANK_THRESHOLDS[i].xp) {
      const prev = RANK_THRESHOLDS[i - 1]
      const next = RANK_THRESHOLDS[i]
      return {
        currentRank: prev.rank,
        nextRank: next.rank as string | null,
        nextThreshold: next.xp as number | null,
        progressPercent: Math.round(((totalXp - prev.xp) / (next.xp - prev.xp)) * 100),
      }
    }
  }
  const last = RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1]
  return { currentRank: last.rank, nextRank: null, nextThreshold: null, progressPercent: 100 }
}
