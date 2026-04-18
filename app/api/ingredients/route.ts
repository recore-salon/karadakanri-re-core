import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const IngredientSchema = z.object({
  name: z.string().min(1).max(50),
  category: z.enum(['fridge', 'freezer', 'pantry', 'seasoning']),
  quantity: z.number().min(0).max(99999),
  unit: z.enum(['piece', 'g', 'kg', 'ml', 'L', 'bottle', 'bag', 'pack', 'can']),
  is_bento: z.boolean().default(false),
  expires_at: z.string().nullable().optional(),
  memo: z.string().max(200).nullable().optional(),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const bento = searchParams.get('bento')

  let query = supabase
    .from('ingredients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (category && category !== 'all') query = query.eq('category', category)
  if (bento === 'true') query = query.eq('is_bento', true)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const parsed = IngredientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ingredients')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
