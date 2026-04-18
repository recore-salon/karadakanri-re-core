import { createClient } from '@/lib/supabase/server'
import { getRecipe } from '@/lib/gemini/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { dish_name } = await request.json()
  if (!dish_name) return NextResponse.json({ error: '料理名が必要です' }, { status: 400 })

  const reqId = `recipe-${Date.now()}`
  console.log('[Gemini req]', { reqId, dish_name, time: new Date().toISOString() })

  try {
    const recipe = await getRecipe(dish_name)
    console.log('[Gemini ok]', { reqId })
    return NextResponse.json(recipe)
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 429) {
      const anyErr = err as {
        message?: string
        errorDetails?: { '@type': string; retryDelay?: string; violations?: { quotaMetric?: string }[] }[]
      }
      const retryInfo = anyErr.errorDetails?.find(d => d['@type']?.includes('RetryInfo'))
      const retryDelay = retryInfo?.retryDelay ?? '60s'
      const rawSeconds = parseInt(retryDelay.replace('s', ''))
      const seconds = !isNaN(rawSeconds) && rawSeconds > 0 ? rawSeconds : 60
      const errMsg = anyErr.message ?? ''
      const quotaViolation = anyErr.errorDetails
        ?.find(d => d['@type']?.includes('QuotaFailure'))
        ?.violations?.[0]?.quotaMetric ?? ''
      const isDaily = errMsg.includes('day') || quotaViolation.includes('day') || quotaViolation.includes('1d')
      const reason = isDaily ? 'daily_limit' : 'per_minute'
      console.error('[Gemini 429]', { reqId, message: errMsg, retryDelay, seconds, reason, quotaViolation })
      return NextResponse.json({ error: 'rate_limit', retry_after: seconds, reason }, { status: 429 })
    }
    console.error('[Gemini error]', { reqId, err })
    return NextResponse.json({ error: 'レシピの取得に失敗しました' }, { status: 503 })
  }
}
