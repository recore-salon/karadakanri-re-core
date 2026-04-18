import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Supabase 無料プランは7日間アクセスがないと自動停止します。
 * Vercel Cron で毎日呼び出すことで停止を防ぎます。
 *
 * vercel.json の crons 設定から呼び出されます。
 * CRON_SECRET 環境変数で不正アクセスを防いでいます。
 */
export async function GET(request: Request) {
  // 不正アクセス防止（Vercel Cron からのリクエストのみ許可）
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // サービスロールキーが設定されている場合はそちらを使用
    // なければ anon キーで common_ingredients を読み取るだけ
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase
      .from('common_ingredients')
      .select('id')
      .limit(1)

    if (error) throw error

    const now = new Date().toISOString()
    console.log(`[keep-alive] Supabase ping OK at ${now}`)

    return NextResponse.json({ ok: true, timestamp: now })
  } catch (err) {
    console.error('[keep-alive] Error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
