import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Portion } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 人数・量設定を反映した減算量を計算 */
export function calcDeductQuantity(
  baseQuantity: number,
  people: number,
  portion: Portion,
  basePeople = 2
): number {
  const portionMultipliers: Record<Portion, number> = {
    light: 0.8,
    standard: 1.0,
    large: 1.3,
  }
  const result = baseQuantity * (people / basePeople) * portionMultipliers[portion]
  return Math.round(result * 100) / 100
}

/** 期限切れ・期限間近を判定 */
export function getExpiryStatus(expiresAt: string | null): 'expired' | 'soon' | 'ok' | null {
  if (!expiresAt) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiresAt)
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 3) return 'soon'
  return 'ok'
}

/** 日付を日本語形式に変換 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
}

/** 今日の日付をYYYY-MM-DD形式で返す */
export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

/** UUIDを生成 */
export function generateUUID(): string {
  return crypto.randomUUID()
}
