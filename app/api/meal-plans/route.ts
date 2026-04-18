import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const SavePlanSchema = z.object({
  plan_date: z.string(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  dish_name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  people: z.number().int().min(1).max(10),
  portion: z.enum(['light', 'standard', 'large']),
  plan_type: z.enum(['available', 'need_shopping']),
  ingredients: z.array(z.object({
    ingredient_id: z.string().nullable().optional(),
    ingredient_name: z.string(),
    required_quantity: z.number().min(0),
    unit: z.enum(['piece', 'g', 'kg', 'ml', 'L', 'bottle', 'bag', 'pack', 'can']),
    is_available: z.boolean(),
  })),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  let query = supabase
    .from('meal_plans')
    .select('*, meal_plan_ingredients(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (date) query = query.eq('plan_date', date)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const parsed = SavePlanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です', details: parsed.error.flatten() }, { status: 400 })
  }

  const { ingredients, ...planData } = parsed.data

  // meal_plan を作成
  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .insert({ ...planData, user_id: user.id })
    .select()
    .single()

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 })

  // meal_plan_ingredients を一括挿入
  if (ingredients.length > 0) {
    const { error: ingError } = await supabase
      .from('meal_plan_ingredients')
      .insert(
        ingredients.map(ing => ({
          meal_plan_id: plan.id,
          ingredient_id: ing.ingredient_id ?? null,
          ingredient_name: ing.ingredient_name,
          required_quantity: ing.required_quantity,
          unit: ing.unit,
          is_available: ing.is_available,
        }))
      )
    if (ingError) return NextResponse.json({ error: ingError.message }, { status: 500 })
  }

  const { data: fullPlan } = await supabase
    .from('meal_plans')
    .select('*, meal_plan_ingredients(*)')
    .eq('id', plan.id)
    .single()

  return NextResponse.json(fullPlan, { status: 201 })
}
