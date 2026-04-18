import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateUUID } from '@/lib/utils'

const UndoSchema = z.object({
  transaction_group_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const parsed = UndoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 })
  }

  const { transaction_group_id } = parsed.data

  // 対象トランザクションを取得
  const { data: transactions, error } = await supabase
    .from('stock_transactions')
    .select('*')
    .eq('transaction_group_id', transaction_group_id)
    .eq('user_id', user.id)
    .not('note', 'eq', '取り消し')  // 取り消し済みは除外

  if (error || !transactions || transactions.length === 0) {
    return NextResponse.json({ error: '取り消し対象が見つかりません' }, { status: 404 })
  }

  const undoGroupId = generateUUID()
  const mealPlanId = transactions[0]?.meal_plan_id ?? null

  for (const tx of transactions) {
    if (!tx.ingredient_id) continue

    const { data: ingredient } = await supabase
      .from('ingredients')
      .select('quantity')
      .eq('id', tx.ingredient_id)
      .eq('user_id', user.id)
      .single()

    if (!ingredient) continue

    // delta の逆算（マイナスだった分を戻す）
    const restoredQuantity = ingredient.quantity + Math.abs(tx.delta)

    await supabase
      .from('ingredients')
      .update({ quantity: restoredQuantity })
      .eq('id', tx.ingredient_id)

    // 取り消しレコードを挿入
    await supabase.from('stock_transactions').insert({
      user_id: user.id,
      ingredient_id: tx.ingredient_id,
      ingredient_name: tx.ingredient_name,
      meal_plan_id: tx.meal_plan_id,
      transaction_group_id: undoGroupId,
      delta: Math.abs(tx.delta),
      unit: tx.unit,
      note: '取り消し',
    })
  }

  // 関連する献立を未調理に戻す
  if (mealPlanId) {
    await supabase
      .from('meal_plans')
      .update({ is_cooked: false, cooked_at: null })
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ success: true })
}
