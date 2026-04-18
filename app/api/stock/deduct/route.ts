import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { calcDeductQuantity, generateUUID } from '@/lib/utils'
import type { Portion } from '@/types'

const DeductSchema = z.object({
  items: z.array(z.object({
    ingredient_id: z.string(),
    delta: z.number().positive(),
  })).min(1),
  people: z.number().int().min(1).max(10).default(1),
  portion: z.enum(['light', 'standard', 'large']).default('standard'),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const parsed = DeductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 })
  }

  const { items, people, portion } = parsed.data
  const transactionGroupId = generateUUID()
  const updatedIngredients: { id: string; name: string; new_quantity: number }[] = []
  const transactions: object[] = []

  for (const item of items) {
    const { data: ingredient } = await supabase
      .from('ingredients')
      .select('id, name, quantity, unit')
      .eq('id', item.ingredient_id)
      .eq('user_id', user.id)
      .single()

    if (!ingredient) continue

    const deductQty = calcDeductQuantity(item.delta, people, portion as Portion)
    const newQuantity = Math.max(0, ingredient.quantity - deductQty)

    await supabase
      .from('ingredients')
      .update({ quantity: newQuantity })
      .eq('id', ingredient.id)

    updatedIngredients.push({ id: ingredient.id, name: ingredient.name, new_quantity: newQuantity })
    transactions.push({
      user_id: user.id,
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      transaction_group_id: transactionGroupId,
      delta: -deductQty,
      unit: ingredient.unit,
      note: '手動',
    })
  }

  if (transactions.length > 0) {
    await supabase.from('stock_transactions').insert(transactions)
  }

  return NextResponse.json({
    success: true,
    transaction_group_id: transactionGroupId,
    updated_ingredients: updatedIngredients,
  })
}
