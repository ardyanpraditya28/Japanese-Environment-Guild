import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

export function signToken(payload: { id: string; role: string }) {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret as string, { expiresIn: '7d' })
}

export function verifyToken(token: string): { id: string; role: string } | null {
  const config = useRuntimeConfig()
  try {
    return jwt.verify(token, config.jwtSecret as string) as { id: string; role: string }
  } catch {
    return null
  }
}

// Password awal yang dibuat admin — 8 karakter, hindari karakter yang gampang ketuker (0/O, 1/l/I)
export function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

// Ambil & verifikasi user yang login dari header Authorization, dipakai di tiap endpoint yang butuh auth
export function requireAuth(event: any) {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '')
  const decoded = token ? verifyToken(token) : null
  if (!decoded) {
    throw createError({ statusCode: 401, statusMessage: 'Belum login atau token tidak valid' })
  }
  return decoded
}

export function requireRole(event: any, roles: string[]) {
  const decoded = requireAuth(event)
  if (!roles.includes(decoded.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak punya akses untuk aksi ini' })
  }
  return decoded
}
