import { createClient } from '@/lib/supabase/server'
import { getMealSuggestions } from '@/lib/gemini/client' // Gemini 2.5 Flash 無料枠: 5 RPM / 20 RPD
import { NextResponse } from 'next/server'
import { z } from 'zod'

const SuggestSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  people: z.number().int().min(1).max(10),
  portion: z.enum(['light', 'standard', 'large']),
  date: z.string().optional(),
  recent_dishes: z.array(z.string()).optional(),
  focus_near_possible: z.boolean().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const parsed = SuggestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 })
  }

  const { meal_type, people, portion, recent_dishes = [], focus_near_possible = false } = parsed.data

  // 在庫を取得（お弁当用食材も含む → Gemini側でフィルタ）
  const { data: ingredients, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('user_id', user.id)
    .gt('quantity', 0)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reqId = `${meal_type}-${Date.now()}`
  console.log('[Gemini req]', { reqId, meal_type, people, portion, focus_near_possible, ingredientCount: ingredients?.length ?? 0, time: new Date().toISOString() })

  try {
    const suggestions = await getMealSuggestions({
      mealType: meal_type,
      people,
      portion,
      ingredients: ingredients ?? [],
      recentDishes: recent_dishes,
      isSnack: meal_type === 'snack',
      focusNearPossible: focus_near_possible,
    })
    console.log('[Gemini ok]', { reqId, count: suggestions.length })
    return NextResponse.json({ suggestions })
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 429) {
      const anyErr = err as {
        message?: string
        errorDetails?: { '@type': string; retryDelay?: string; violations?: { quotaMetric?: string }[] }[]
      }

      // retryDelay を取得（0s の場合も正しく処理）
      const retryInfo = anyErr.errorDetails?.find(d => d['@type']?.includes('RetryInfo'))
      const retryDelay = retryInfo?.retryDelay ?? '60s'
      const rawSeconds = parseInt(retryDelay.replace('s', ''))
      const seconds = !isNaN(rawSeconds) && rawSeconds > 0 ? rawSeconds : 60

      // 原因を判別（日次上限 or 分間上限）
      const errMsg = anyErr.message ?? ''
      const quotaViolation = anyErr.errorDetails
        ?.find(d => d['@type']?.includes('QuotaFailure'))
        ?.violations?.[0]?.quotaMetric ?? ''
      const isDaily = errMsg.includes('day') || quotaViolation.includes('day') || quotaViolation.includes('1d')
      const reason = isDaily ? 'daily_limit' : 'per_minute'

      console.error('[Gemini 429]', { message: errMsg, retryDelay, seconds, reason, quotaViolation })

      return NextResponse.json({ error: 'rate_limit', retry_after: seconds, reason }, { status: 429 })
    }

    console.error('[Gemini error]', err)
    return NextResponse.json(
      { error: '献立の提案に失敗しました。しばらく待ってから再試行してください。' },
      { status: 503 }
    )
  }
}
