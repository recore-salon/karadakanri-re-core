'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Beer, Package, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { MealPlan, MealType, UserSettings } from '@/types'
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS, PORTION_LABELS } from '@/types'

interface Props {
  todayPlans: MealPlan[]
  stockSummary: { fridge: number; freezer: number; pantry: number; seasoning: number; total: number }
  settings: UserSettings
  todayLabel: string
  todayStr: string
  expiryAlerts?: string[]
}

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner']

export default function HomeClient({ todayPlans, stockSummary, settings, todayLabel, todayStr, expiryAlerts = [] }: Props) {
  const router = useRouter()
  const [plans, setPlans] = useState<MealPlan[]>(todayPlans)
  const [cookingId, setCookingId] = useState<string | null>(null)

  const getPlanForMeal = (mealType: MealType) =>
    plans.find(p => p.meal_type === mealType)

  async function handleCook(plan: MealPlan) {
    if (plan.is_cooked) return
    setCookingId(plan.id)
    try {
      const res = await fetch(`/api/meal-plans/${plan.id}/cook`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_cooked: true } : p))

      toast.success(`「${plan.dish_name}」を作りました！`, {
        description: '在庫を更新しました',
        action: {
          label: '取り消す',
          onClick: () => handleUndo(data.transaction_group_id, plan.id),
        },
        duration: 6000,
      })
    } catch (err) {
      toast.error('エラーが発生しました')
    } finally {
      setCookingId(null)
    }
  }

  async function handleUndo(transactionGroupId: string, planId: string) {
    const res = await fetch('/api/stock/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_group_id: transactionGroupId }),
    })
    if (res.ok) {
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, is_cooked: false } : p))
      toast.info('取り消しました')
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'おはようございます' : hour < 17 ? 'こんにちは' : 'こんばんは'

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="bg-white border-b border-[#E8E0D8] px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs text-[#9B8B7A] font-medium tracking-widest uppercase">Re:Core</span>
            </div>
            <h1 className="text-lg font-bold text-[#3A3A3A]">Re:Stock</h1>
          </div>
          <Link href="/settings" className="w-9 h-9 rounded-full bg-[#F8F6F2] flex items-center justify-center text-sm font-bold text-[#9B8B7A] hover:bg-[#E8E0D8]">
            設
          </Link>
        </div>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* 期限アラートバナー */}
        {expiryAlerts.length > 0 && (
          <Link href="/ingredients">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-start gap-2">
              <AlertTriangle size={15} className="text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-orange-700">期限に注意が必要な食材があります</p>
                <p className="text-xs text-orange-500 mt-0.5">{expiryAlerts.join('、')}</p>
              </div>
            </div>
          </Link>
        )}

        {/* 挨拶 */}
        <div>
          <p className="text-sm text-[#9B8B7A]">{greeting} · {todayLabel}</p>
          <p className="text-base font-medium text-[#3A3A3A] mt-0.5">
            {stockSummary.total > 0
              ? `家に${stockSummary.total}品あります。今日の献立を考えましょう！`
              : '食材を登録して献立提案を始めましょう'}
          </p>
        </div>

        {/* 今日の献立カード */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#3A3A3A]">今日の献立</h2>
            <Link href="/meal-plans" className="text-xs text-[#E07B5A] font-medium">
              すべて見る
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E0D8] overflow-hidden divide-y divide-[#F0EDE8]">
            {MEAL_ORDER.map(mealType => {
              const plan = getPlanForMeal(mealType)
              return (
                <MealRow
                  key={mealType}
                  mealType={mealType}
                  plan={plan}
                  onCook={handleCook}
                  isCooking={cookingId === plan?.id}
                  todayStr={todayStr}
                  settings={settings}
                />
              )
            })}
          </div>
        </section>

        {/* クイックアクション */}
        <section className="grid grid-cols-2 gap-3">
          <Link href="/ingredients">
            <div className="bg-white rounded-2xl p-4 border border-[#E8E0D8] hover:border-[#E07B5A] transition-colors flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF1EC] flex items-center justify-center">
                <Package size={18} className="text-[#E07B5A]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#3A3A3A]">食材の在庫確認</p>
                <p className="text-xs text-[#9B8B7A]">あるもので献立</p>
              </div>
            </div>
          </Link>

          <Link href="/snack">
            <div className="bg-white rounded-2xl p-4 border border-[#E8E0D8] hover:border-[#7BC4A8] transition-colors flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EDF7F4] flex items-center justify-center">
                <Beer size={18} className="text-[#7BC4A8]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#3A3A3A]">おつまみ</p>
                <p className="text-xs text-[#9B8B7A]">一品サクッと</p>
              </div>
            </div>
          </Link>
        </section>

        {/* 在庫サマリー */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#3A3A3A]">在庫状況</h2>
            <Link href="/ingredients" className="text-xs text-[#E07B5A] font-medium flex items-center gap-0.5">
              一覧を見る <ChevronRight size={12} />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E0D8] p-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: '冷蔵', count: stockSummary.fridge, color: 'text-blue-500' },
                { label: '冷凍', count: stockSummary.freezer, color: 'text-indigo-400' },
                { label: '常温', count: stockSummary.pantry, color: 'text-amber-500' },
                { label: '調味料', count: stockSummary.seasoning, color: 'text-rose-400' },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <p className={cn('text-xl font-bold', color)}>{count}</p>
                  <p className="text-xs text-[#9B8B7A] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

interface MealCardProps {
  mealType: MealType
  plan: MealPlan | undefined
  onCook: (plan: MealPlan) => void
  isCooking: boolean
  todayStr: string
  settings: UserSettings
}

function MealRow({ mealType, plan, onCook, isCooking, todayStr }: MealCardProps) {
  const router = useRouter()

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      {/* ラベル */}
      <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
        <span className="text-base">{MEAL_TYPE_ICONS[mealType]}</span>
        <span className="text-xs font-medium text-[#9B8B7A]">{MEAL_TYPE_LABELS[mealType]}</span>
      </div>

      {plan ? (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#3A3A3A] truncate">{plan.dish_name}</p>
            {plan.plan_type === 'need_shopping' && !plan.is_cooked && (
              <p className="text-xs text-[#E07B5A] mt-0.5">買い足しあり</p>
            )}
          </div>
          {plan.is_cooked ? (
            <span className="text-xs text-[#7BC4A8] font-medium flex-shrink-0">✓ 完了</span>
          ) : (
            <Button
              size="sm"
              onClick={() => onCook(plan)}
              disabled={isCooking}
              className="flex-shrink-0 bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-lg h-7 px-3 text-xs"
            >
              {isCooking ? '...' : '作った'}
            </Button>
          )}
        </>
      ) : (
        <button
          onClick={() => router.push(`/meal-plans?date=${todayStr}&type=${mealType}`)}
          className="flex-1 flex items-center justify-between text-sm hover:text-[#E07B5A] transition-colors group"
        >
          <span className="text-[#C4B5A8] group-hover:text-[#E07B5A]">タップして提案</span>
          <ChevronRight size={14} className="text-[#C4B5A8] group-hover:text-[#E07B5A]" />
        </button>
      )}
    </div>
  )
}
