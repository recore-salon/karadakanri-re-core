'use client'

import { useState, useRef, useEffect } from 'react'
import { RefreshCw, Beer, ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/shared/PageHeader'
import { toast } from 'sonner'
import { cn, getTodayStr } from '@/lib/utils'

// ─── 提案キャッシュ（当日限り） ───────────────────────────────────────────────
const SUGGEST_CACHE_KEY = 'restock_suggest_cache'
function getSnackCache(date: string): MealSuggestion[] | null {
  try {
    const raw = localStorage.getItem(SUGGEST_CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw)
    const entry = cache['snack']
    if (!entry || entry.date !== date) return null
    return entry.suggestions
  } catch { return null }
}
function saveSnackCache(date: string, suggestions: MealSuggestion[]) {
  try {
    const raw = localStorage.getItem(SUGGEST_CACHE_KEY)
    const cache = raw ? JSON.parse(raw) : {}
    cache['snack'] = { suggestions, date }
    localStorage.setItem(SUGGEST_CACHE_KEY, JSON.stringify(cache))
  } catch { /* ignore */ }
}
import type { MealSuggestion, MealPlan, Portion } from '@/types'
import { PORTION_LABELS, UNIT_LABELS } from '@/types'

export default function SnackPage() {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([])
  const [suggesting, setSuggesting] = useState(false)
  const [savedPlan, setSavedPlan] = useState<MealPlan | null>(null)
  const [cookingId, setCookingId] = useState<string | null>(null)
  const [people, setPeople] = useState(2)
  const [portion, setPortion] = useState<Portion>('standard')
  const [recentDishes, setRecentDishes] = useState<string[]>([])
  const [retryAfter, setRetryAfter] = useState<number>(0)
  const [retryReason, setRetryReason] = useState<'daily_limit' | 'per_minute' | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const suggestingRef = useRef(false)

  useEffect(() => {
    return () => { if (retryTimerRef.current) clearInterval(retryTimerRef.current) }
  }, [])

  function stopRetryTimer() {
    if (retryTimerRef.current) { clearInterval(retryTimerRef.current); retryTimerRef.current = null }
    setRetryAfter(0)
    setRetryReason(null)
  }

  async function handleSuggest(force = false) {
    if (suggestingRef.current) return  // 二重送信防止

    // キャッシュ確認（当日・強制更新なし）
    if (!force) {
      const cached = getSnackCache(getTodayStr())
      if (cached) { setSuggestions(cached); return }
    }

    suggestingRef.current = true
    setSuggestions([])
    setSuggesting(true)
    stopRetryTimer()
    try {
      const res = await fetch('/api/meal-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_type: 'snack',
          people,
          portion,
          date: getTodayStr(),
          recent_dishes: recentDishes,
        }),
      })
      const data = await res.json()
      if (res.status === 429) {
        const reason = data.reason ?? 'per_minute'
        setRetryReason(reason)
        if (reason === 'daily_limit') {
          setRetryAfter(-1)
        } else {
          const seconds = data.retry_after ?? 60
          setRetryAfter(seconds)
          let remaining = seconds
          retryTimerRef.current = setInterval(() => {
            remaining -= 1
            setRetryAfter(remaining)
            if (remaining <= 0) stopRetryTimer()
          }, 1000)
        }
        return
      }
      if (!res.ok) throw new Error(data.error)
      setSuggestions(data.suggestions)
      saveSnackCache(getTodayStr(), data.suggestions)
    } catch {
      toast.error('提案に失敗しました。再試行してください。')
    } finally {
      setSuggesting(false)
      suggestingRef.current = false
    }
  }

  async function handleSelect(suggestion: MealSuggestion) {
    const res = await fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_date: getTodayStr(),
        meal_type: 'snack',
        dish_name: suggestion.dish_name,
        description: suggestion.description,
        people,
        portion,
        plan_type: suggestion.plan_type,
        ingredients: suggestion.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id ?? null,
          ingredient_name: ing.name,
          required_quantity: ing.quantity,
          unit: ing.unit,
          is_available: ing.is_available,
        })),
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setSavedPlan(data)
      setSuggestions([])
      setRecentDishes(prev => [...prev, suggestion.dish_name])
      toast.success(`「${suggestion.dish_name}」を今夜のつまみに設定しました`)
    }
  }

  async function handleCook(plan: MealPlan) {
    setCookingId(plan.id)
    try {
      const res = await fetch(`/api/meal-plans/${plan.id}/cook`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSavedPlan(prev => prev ? { ...prev, is_cooked: true } : prev)
      toast.success(`「${plan.dish_name}」を作りました！`, {
        action: {
          label: '取り消す',
          onClick: async () => {
            const r = await fetch('/api/stock/undo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transaction_group_id: data.transaction_group_id }),
            })
            if (r.ok) {
              setSavedPlan(prev => prev ? { ...prev, is_cooked: false } : prev)
              toast.info('取り消しました')
            }
          },
        },
        duration: 6000,
      })
    } catch {
      toast.error('エラーが発生しました')
    } finally {
      setCookingId(null)
    }
  }

  return (
    <div>
      <PageHeader title="おつまみモード" />

      <div className="px-4 py-5 space-y-5">
        {/* ヘッダー説明 */}
        <div className="bg-gradient-to-br from-[#EDF7F4] to-[#F0F8F5] rounded-2xl p-4 text-center space-y-1">
          <div className="text-3xl">🍺</div>
          <p className="text-sm font-bold text-[#3A3A3A]">今夜の一品をサクッと決める</p>
          <p className="text-xs text-[#9B8B7A]">15分以内・一品・洗い物少なめ</p>
        </div>

        {/* 人数・量設定 */}
        <div className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-3 space-y-3">
          <p className="text-xs font-bold text-[#9B8B7A] uppercase tracking-wide">設定</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#3A3A3A] font-medium">人数</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPeople(Math.max(1, people - 1))} className="w-7 h-7 rounded-lg bg-[#F8F6F2] text-[#3A3A3A] font-bold flex items-center justify-center">−</button>
                <span className="text-lg font-bold text-[#3A3A3A] w-6 text-center">{people}</span>
                <button onClick={() => setPeople(Math.min(10, people + 1))} className="w-7 h-7 rounded-lg bg-[#F8F6F2] text-[#3A3A3A] font-bold flex items-center justify-center">+</button>
              </div>
            </div>
            <div className="flex gap-1.5">
              {(['light', 'standard', 'large'] as Portion[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPortion(p)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border text-xs font-medium transition-all',
                    portion === p ? 'bg-[#7BC4A8] border-[#7BC4A8] text-white' : 'bg-[#F8F6F2] border-[#E8E0D8] text-[#9B8B7A]'
                  )}
                >
                  {PORTION_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 保存済みプラン */}
        {savedPlan && (
          <div className={cn(
            'bg-white rounded-2xl border px-4 py-4',
            savedPlan.is_cooked ? 'border-[#7BC4A8] bg-[#EDF7F4]' : 'border-[#E8E0D8]'
          )}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#3A3A3A]">{savedPlan.dish_name}</p>
                  {savedPlan.is_cooked && (
                    <Badge className="text-xs bg-[#EDF7F4] text-[#7BC4A8] border-[#B8E4D8]">✓ 作りました</Badge>
                  )}
                </div>
                {savedPlan.description && (
                  <p className="text-xs text-[#9B8B7A] mt-0.5">{savedPlan.description}</p>
                )}
              </div>
              {!savedPlan.is_cooked && (
                <Button
                  size="sm"
                  onClick={() => handleCook(savedPlan)}
                  disabled={cookingId === savedPlan.id}
                  className="bg-[#7BC4A8] hover:bg-[#5CA B93] text-white rounded-xl h-8 px-3 text-xs"
                >
                  {cookingId === savedPlan.id ? '...' : '作った'}
                </Button>
              )}
            </div>
            <button
              onClick={() => setSavedPlan(null)}
              className="mt-2 text-xs text-[#9B8B7A] hover:text-red-400"
            >
              ✕ 別の提案を見る
            </button>
          </div>
        )}

        {/* レート制限メッセージ */}
        {retryAfter !== 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-[#E8E0D8] p-4 text-center">
            {retryReason === 'daily_limit' ? (
              <>
                <p className="text-sm font-bold text-[#E07B5A] mb-1">本日のAI利用上限に達しました</p>
                <p className="text-xs text-[#9B8B7A]">明日またお試しください</p>
              </>
            ) : (
              <>
                <p className="text-sm text-[#9B8B7A] mb-1">AIが混み合っています</p>
                <p className="text-2xl font-bold text-[#7BC4A8] mb-1">{retryAfter}<span className="text-sm font-normal">秒</span></p>
                <p className="text-xs text-[#9B8B7A]">経過したらもう一度タップしてください</p>
              </>
            )}
          </div>
        )}

        {/* 提案ボタン */}
        {!savedPlan && retryAfter === 0 && (
          <Button
            onClick={handleSuggest}
            disabled={suggesting}
            className="w-full bg-[#7BC4A8] hover:bg-[#5CAB93] text-white rounded-2xl h-14 text-base font-medium"
          >
            {suggesting ? (
              <><RefreshCw size={16} className="animate-spin mr-2" /> 考え中...</>
            ) : (
              <><Beer size={18} className="mr-2" /> おつまみを提案してもらう</>
            )}
          </Button>
        )}

        {/* 提案一覧 */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-[#9B8B7A]">提案から選んでください</p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSelect(s)}
                className="w-full bg-white rounded-2xl border border-[#E8E0D8] hover:border-[#7BC4A8] transition-all px-4 py-3 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#3A3A3A]">{s.dish_name}</span>
                      {s.plan_type === 'available' && (
                        <Badge className="text-xs bg-[#EDF7F4] text-[#7BC4A8] border-[#B8E4D8] px-1.5 py-0">家にある材料で</Badge>
                      )}
                      {s.plan_type === 'need_shopping' && (
                        <Badge className="text-xs bg-[#FFF8F0] text-[#E07B5A] border-[#F0D0C0] px-1.5 py-0">
                          <ShoppingCart size={10} className="mr-0.5" />{s.missing_ingredients.length}品買い足し
                        </Badge>
                      )}
                    </div>
                    {s.description && <p className="text-xs text-[#9B8B7A] mt-0.5">{s.description}</p>}
                    {s.missing_ingredients.length > 0 && (
                      <p className="text-xs text-[#E07B5A] mt-1">
                        買い足し：{s.missing_ingredients.map(i => i.name).join('、')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-[#7BC4A8] font-medium">選ぶ →</span>
                </div>
              </button>
            ))}
            <button
              onClick={() => handleSuggest(true)}
              className="w-full py-2 text-xs text-[#7BC4A8] flex items-center justify-center gap-1"
            >
              <RefreshCw size={12} /> 別の提案を見る（AI再生成）
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
