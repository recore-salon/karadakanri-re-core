import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calcDeductQuantity, generateUUID } from '@/lib/utils'
import type { Portion } from '@/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { id } = await params

  // 献立プランと食材を取得
  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .select('*, meal_plan_ingredients(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (planError || !plan) {
    return NextResponse.json({ error: '献立が見つかりません' }, { status: 404 })
  }
  if (plan.is_cooked) {
    return NextResponse.json({ error: 'すでに「作った」済みです' }, { status: 400 })
  }

  const transactionGroupId = generateUUID()
  const updatedIngredients: { id: string; name: string; new_quantity: number }[] = []
  const transactions: object[] = []

  // 在庫のある食材のみ減算
  const availableIngredients = (plan.meal_plan_ingredients ?? []).filter(
    (ing: { is_available: boolean; ingredient_id: string | null }) => ing.is_available && ing.ingredient_id
  )

  for (const ing of availableIngredients) {
    const deductQty = calcDeductQuantity(
      ing.required_quantity,
      plan.people,
      plan.portion as Portion
    )

    // 現在の在庫を取得
    const { data: ingredient } = await supabase
      .from('ingredients')
      .select('id, name, quantity')
      .eq('id', ing.ingredient_id)
      .eq('user_id', user.id)
      .single()

    if (!ingredient) continue

    const newQuantity = Math.max(0, ingredient.quantity - deductQty)

    // 在庫を更新
    await supabase
      .from('ingredients')
      .update({ quantity: newQuantity })
      .eq('id', ingredient.id)
      .eq('user_id', user.id)

    updatedIngredients.push({ id: ingredient.id, name: ingredient.name, new_quantity: newQuantity })

    transactions.push({
      user_id: user.id,
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      meal_plan_id: plan.id,
      transaction_group_id: transactionGroupId,
      delta: -deductQty,
      unit: ing.unit,
      note: '献立から',
    })
  }

  // トランザクション履歴を保存
  if (transactions.length > 0) {
    await supabase.from('stock_transactions').insert(transactions)
  }

  // 献立を「作った」にマーク
  await supabase
    .from('meal_plans')
    .update({ is_cooked: true, cooked_at: new Date().toISOString() })
    .eq('id', plan.id)

  return NextResponse.json({
    success: true,
    transaction_group_id: transactionGroupId,
    updated_ingredients: updatedIngredients,
  })
}
