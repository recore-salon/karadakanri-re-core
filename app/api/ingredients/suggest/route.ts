import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const all = searchParams.get('all') === '1'

  if (all) {
    const { data } = await supabase
      .from('common_ingredients')
      .select('name, category, unit')
      .order('sort_order')
      .limit(500)
    return NextResponse.json({ suggestions: data ?? [] })
  }

  if (!q || q.length < 1) {
    // クエリなし → よく使うトップ20
    const { data } = await supabase
      .from('common_ingredients')
      .select('name, category, unit')
      .order('sort_order')
      .limit(20)
    return NextResponse.json({ suggestions: data ?? [] })
  }

  const { data } = await supabase
    .from('common_ingredients')
    .select('name, category, unit')
    .ilike('name', `%${q}%`)
    .order('sort_order')
    .limit(10)

  return NextResponse.json({ suggestions: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const { name, category, unit } = body
  if (!name || !category || !unit) {
    return NextResponse.json({ error: 'name, category, unit は必須です' }, { status: 400 })
  }

  // 既に存在する場合はスキップ
  const { data: existing } = await supabase
    .from('common_ingredients')
    .select('name')
    .eq('name', name)
    .single()

  if (!existing) {
    const { error } = await supabase
      .from('common_ingredients')
      .insert({ name, category, unit, sort_order: 9999 })
    if (error) {
      console.error('[common_ingredients insert error]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
