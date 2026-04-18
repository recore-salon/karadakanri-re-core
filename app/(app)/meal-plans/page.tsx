'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  RefreshCw, ChefHat, ShoppingCart, Check, Beer, Sparkles,
  Bookmark, BookmarkCheck, Clock, Users, X,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import PageHeader from '@/components/shared/PageHeader'
import { toast } from 'sonner'
import { cn, getTodayStr } from '@/lib/utils'
import type { MealPlan, MealSuggestion, MealType, Portion, UserSettings } from '@/types'
import type { Recipe } from '@/lib/gemini/client'
import NutritionRadarChart, { type NutritionData } from '@/components/shared/NutritionRadarChart'
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS, PORTION_LABELS, UNIT_LABELS } from '@/types'
import { Suspense } from 'react'

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner']
const SAVED_KEY = 'restock_saved_dishes'

// ─── レシピキャッシュ（localStorage・7日間有効） ──────────────────────────────
const RECIPE_CACHE_KEY = 'restock_recipe_cache'
const RECIPE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000

function getRecipeFromCache(dishName: string): Recipe | null {
  try {
    const raw = localStorage.getItem(RECIPE_CACHE_KEY)
    if (!raw) return null
    const cache: Record<string, { recipe: Recipe; at: number }> = JSON.parse(raw)
    const entry = cache[dishName]
    if (!entry || Date.now() - entry.at > RECIPE_CACHE_TTL) return null
    return entry.recipe
  } catch { return null }
}

function saveRecipeToCache(dishName: string, recipe: Recipe) {
  try {
    const raw = localStorage.getItem(RECIPE_CACHE_KEY)
    const cache: Record<string, { recipe: Recipe; at: number }> = raw ? JSON.parse(raw) : {}
    cache[dishName] = { recipe, at: Date.now() }
    localStorage.setItem(RECIPE_CACHE_KEY, JSON.stringify(cache))
  } catch { /* ignore */ }
}

// ─── 提案キャッシュ（localStorage・当日限り） ────────────────────────────────
const SUGGEST_CACHE_KEY = 'restock_suggest_cache'

type SuggestCacheEntry = { suggestions: MealSuggestion[]; date: string }
type SuggestCache = Record<string, SuggestCacheEntry>

function getSuggestFromCache(key: string, today: string): MealSuggestion[] | null {
  try {
    const raw = localStorage.getItem(SUGGEST_CACHE_KEY)
    if (!raw) return null
    const cache: SuggestCache = JSON.parse(raw)
    const entry = cache[key]
    if (!entry || entry.date !== today) return null
    return entry.suggestions
  } catch { return null }
}

function saveSuggestToCache(key: string, today: string, suggestions: MealSuggestion[]) {
  try {
    const raw = localStorage.getItem(SUGGEST_CACHE_KEY)
    const cache: SuggestCache = raw ? JSON.parse(raw) : {}
    cache[key] = { suggestions, date: today }
    localStorage.setItem(SUGGEST_CACHE_KEY, JSON.stringify(cache))
  } catch { /* ignore */ }
}

// ─── 保存データ型 ─────────────────────────────────────────────────────────────

interface SavedDish {
  dish_name: string
  description?: string
  missing_ingredients?: { name: string; quantity: number; unit: string }[]
  saved_at: string
}

function loadSaved(): SavedDish[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') } catch { return [] }
}
function persistSaved(dishes: SavedDish[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(dishes))
}

// ─── メインコンポーネント ───────────────────────────────────────────────────────

function MealPlansContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const today = getTodayStr()

  const initType = (searchParams.get('type') as MealType) || null
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [activeMeal, setActiveMeal] = useState<MealType | null>(initType)
  const [people, setPeople] = useState(2)
  const [portion, setPortion] = useState<Portion>('standard')
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([])
  const [suggesting, setSuggesting] = useState(false)
  const [cookingId, setCookingId] = useState<string | null>(null)
  const [recentDishes, setRecentDishes] = useState<string[]>([])
  const [retryAfter, setRetryAfter] = useState<number>(0)
  const [retryReason, setRetryReason] = useState<'daily_limit' | 'per_minute' | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [nearPossible, setNearPossible] = useState<MealSuggestion[]>([])
  const [loadingNearPossible, setLoadingNearPossible] = useState(false)

  // 二重送信防止用フラグ
  const suggestingRef = useRef(false)
  const nearPossibleRef = useRef(false)
  const recipeLoadingRef = useRef(false)

  // レシピシート
  const [recipeDish, setRecipeDish] = useState<string | null>(null)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loadingRecipe, setLoadingRecipe] = useState(false)

  // 保存済み献立
  const [savedDishes, setSavedDishes] = useState<SavedDish[]>([])

  useEffect(() => {
    setSavedDishes(loadSaved())
    fetch('/api/user/settings').then(r => r.ok ? r.json() : null).then(data => {
      if (!data) return
      setSettings(data)
      setPeople(data.default_people ?? 2)
      setPortion(data.default_portion ?? 'standard')
    })
    fetchPlans()
  }, [])

  async function fetchPlans() {
    const res = await fetch(`/api/meal-plans?date=${today}`)
    const data = await res.json()
    setPlans(Array.isArray(data) ? data : [])
  }

  function stopRetryTimer() {
    if (retryTimerRef.current) { clearInterval(retryTimerRef.current); retryTimerRef.current = null }
    setRetryAfter(0)
    setRetryReason(null)
  }

  // ─── レシピ表示 ──────────────────────────────────────────────────────────────

  async function openRecipe(dishName: string) {
    if (recipeLoadingRef.current) return  // 二重送信防止
    recipeLoadingRef.current = true
    setRecipeDish(dishName)
    setRecipe(null)
    setLoadingRecipe(true)

    // キャッシュ確認（Gemini呼び出し節約）
    const cached = getRecipeFromCache(dishName)
    if (cached) {
      setRecipe(cached)
      setLoadingRecipe(false)
      recipeLoadingRef.current = false
      return
    }

    try {
      const res = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish_name: dishName }),
      })
      if (res.status === 429) { toast.error('少し待ってから再度お試しください'); return }
      const data = await res.json()
      if (res.ok) {
        setRecipe(data)
        saveRecipeToCache(dishName, data)  // 次回以降はキャッシュを使用
      } else {
        toast.error('レシピの取得に失敗しました')
      }
    } catch {
      toast.error('エラーが発生しました')
    } finally {
      setLoadingRecipe(false)
      recipeLoadingRef.current = false
    }
  }

  // ─── 保存トグル ──────────────────────────────────────────────────────────────

  function toggleSave(suggestion: Pick<MealSuggestion, 'dish_name' | 'description' | 'missing_ingredients'>) {
    setSavedDishes(prev => {
      const exists = prev.some(d => d.dish_name === suggestion.dish_name)
      const next = exists
        ? prev.filter(d => d.dish_name !== suggestion.dish_name)
        : [...prev, { dish_name: suggestion.dish_name, description: suggestion.description, missing_ingredients: suggestion.missing_ingredients, saved_at: new Date().toISOString() }]
      persistSaved(next)
      toast.success(exists ? '保存を解除しました' : '献立を保存しました')
      return next
    })
  }

  function isSaved(dishName: string) {
    return savedDishes.some(d => d.dish_name === dishName)
  }

  // ─── 追加可能セット ──────────────────────────────────────────────────────────

  async function handleNearPossible(force = false) {
    if (nearPossibleRef.current) return  // 二重送信防止

    // キャッシュ確認（当日・強制更新なし）
    if (!force) {
      const cached = getSuggestFromCache('near_possible', today)
      if (cached) { setNearPossible(cached); return }
    }

    nearPossibleRef.current = true
    setNearPossible([])
    setLoadingNearPossible(true)
    try {
      const res = await fetch('/api/meal-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_type: 'dinner', people, portion, date: today, recent_dishes: recentDishes, focus_near_possible: true }),
      })
      const data = await res.json()
      if (res.ok) {
        setNearPossible(data.suggestions)
        saveSuggestToCache('near_possible', today, data.suggestions)
      } else toast.error('提案の取得に失敗しました')
    } catch {
      toast.error('エラーが発生しました')
    } finally {
      setLoadingNearPossible(false)
      nearPossibleRef.current = false
    }
  }

  // ─── 献立提案 ────────────────────────────────────────────────────────────────

  async function handleSuggest(mealType: MealType, force = false) {
    if (suggestingRef.current) return  // 二重送信防止

    // キャッシュ確認（当日・強制更新なし）
    if (!force) {
      const cached = getSuggestFromCache(mealType, today)
      if (cached) {
        setActiveMeal(mealType)
        setSuggestions(cached)
        return
      }
    }

    suggestingRef.current = true
    stopRetryTimer()
    setActiveMeal(mealType)
    setSuggestions([])
    setSuggesting(true)
    try {
      const res = await fetch('/api/meal-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_type: mealType, people, portion, date: today, recent_dishes: recentDishes }),
      })
      const data = await res.json()
      if (res.status === 429) {
        const reason = data.reason ?? 'per_minute'
        setRetryReason(reason)
        if (reason === 'daily_limit') {
          setRetryAfter(-1) // -1 = permanent (daily limit)
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
      saveSuggestToCache(mealType, today, data.suggestions)
    } catch {
      toast.error('献立の提案に失敗しました。再試行してください。')
    } finally {
      setSuggesting(false)
      suggestingRef.current = false
    }
  }

  async function handleSelectSuggestion(suggestion: MealSuggestion) {
    if (!activeMeal) return
    const res = await fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_date: today,
        meal_type: activeMeal,
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
      setPlans(prev => [...prev.filter(p => p.meal_type !== activeMeal), data])
      setRecentDishes(prev => [...prev, suggestion.dish_name])
      setSuggestions([])
      setActiveMeal(null)
      toast.success(`「${suggestion.dish_name}」を今日の${MEAL_TYPE_LABELS[activeMeal]}に設定しました`)
    } else {
      toast.error(data.error)
    }
  }

  async function handleCook(plan: MealPlan) {
    if (plan.is_cooked) return
    setCookingId(plan.id)
    try {
      const res = await fetch(`/api/meal-plans/${plan.id}/cook`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_cooked: true } : p))
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
              setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_cooked: false } : p))
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

  async function handleRemovePlan(plan: MealPlan) {
    if (!confirm(`「${plan.dish_name}」を削除しますか？`)) return
    const res = await fetch(`/api/meal-plans/${plan.id}`, { method: 'DELETE' })
    if (res.ok) {
      setPlans(prev => prev.filter(p => p.id !== plan.id))
      toast.info(`「${plan.dish_name}」を削除しました`)
    } else {
      toast.error('削除に失敗しました')
    }
  }

  const getPlan = (mealType: MealType) => plans.find(p => p.meal_type === mealType)

  return (
    <div>
      <PageHeader title="今日の献立" />

      <div className="px-4 py-4 space-y-4">
        {/* 人数・量設定 */}
        <div className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-3 space-y-3">
          <p className="text-xs font-bold text-[#9B8B7A] uppercase tracking-wide">献立設定</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#3A3A3A] font-medium">人数</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPeople(Math.max(1, people - 1))} className="w-7 h-7 rounded-lg bg-[#F8F6F2] text-[#3A3A3A] font-bold text-sm flex items-center justify-center">−</button>
                <span className="text-lg font-bold text-[#3A3A3A] w-6 text-center">{people}</span>
                <button onClick={() => setPeople(Math.min(10, people + 1))} className="w-7 h-7 rounded-lg bg-[#F8F6F2] text-[#3A3A3A] font-bold text-sm flex items-center justify-center">+</button>
              </div>
            </div>
            <div className="flex gap-1.5 flex-1 justify-end">
              {(['light', 'standard', 'large'] as Portion[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPortion(p)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border text-xs font-medium transition-all',
                    portion === p ? 'bg-[#E07B5A] border-[#E07B5A] text-white' : 'bg-[#F8F6F2] border-[#E8E0D8] text-[#9B8B7A]'
                  )}
                >
                  {PORTION_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 保存済み献立 */}
        {savedDishes.length > 0 && (
          <SavedDishesSection dishes={savedDishes} onRecipe={openRecipe} onRemove={name => toggleSave({ dish_name: name, description: '', missing_ingredients: [] })} />
        )}

        {/* 追加可能セット */}
        <section className="space-y-2">
          <button
            onClick={handleNearPossible}
            disabled={loadingNearPossible}
            className="w-full bg-gradient-to-r from-[#FFF8F0] to-[#FFF1EC] rounded-2xl border border-[#F0D0C0] hover:border-[#E07B5A] transition-colors px-4 py-3 flex items-center gap-3 disabled:opacity-60"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              {loadingNearPossible ? <RefreshCw size={16} className="text-[#E07B5A] animate-spin" /> : <Sparkles size={16} className="text-[#E07B5A]" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-[#3A3A3A]">追加可能セットを確認</p>
              <p className="text-xs text-[#9B8B7A]">あと1〜2品で作れる献立を提案</p>
            </div>
            {!loadingNearPossible && <span className="text-xs text-[#E07B5A]">確認 →</span>}
          </button>

          {nearPossible.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-[#9B8B7A] px-1">あと少しで作れる献立</p>
              {nearPossible.map((s, i) => (
                <NearPossibleCard
                  key={i}
                  suggestion={s}
                  saved={isSaved(s.dish_name)}
                  onRecipe={() => openRecipe(s.dish_name)}
                  onSave={() => toggleSave(s)}
                />
              ))}
              <button onClick={() => handleNearPossible(true)} className="w-full py-2 text-xs text-[#E07B5A] flex items-center justify-center gap-1">
                <RefreshCw size={12} /> 別の提案を見る（AI再生成）
              </button>
            </div>
          )}
        </section>

        {/* 朝・昼・晩セクション */}
        {MEAL_ORDER.map(mealType => {
          const plan = getPlan(mealType)
          const isActive = activeMeal === mealType

          return (
            <section key={mealType} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{MEAL_TYPE_ICONS[mealType]}</span>
                <h2 className="text-sm font-bold text-[#3A3A3A]">{MEAL_TYPE_LABELS[mealType]}</h2>
              </div>

              {plan ? (
                <SavedPlanCard plan={plan} onCook={handleCook} isCooking={cookingId === plan.id} onRecipe={() => openRecipe(plan.dish_name)} />
              ) : isActive && retryAfter !== 0 ? (
                <div className="w-full bg-white rounded-2xl border-2 border-dashed border-[#E8E0D8] p-4 text-center">
                  {retryReason === 'daily_limit' ? (
                    <>
                      <p className="text-sm font-bold text-[#E07B5A] mb-1">本日のAI利用上限に達しました</p>
                      <p className="text-xs text-[#9B8B7A]">明日またお試しください</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[#9B8B7A] mb-1">AIが混み合っています</p>
                      <p className="text-2xl font-bold text-[#E07B5A] mb-1">{retryAfter}<span className="text-sm font-normal">秒</span></p>
                      <p className="text-xs text-[#9B8B7A]">経過したらもう一度タップしてください</p>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleSuggest(mealType)}
                  disabled={suggesting && isActive}
                  className="w-full bg-white rounded-2xl border-2 border-dashed border-[#E8E0D8] hover:border-[#E07B5A] transition-colors p-4 flex items-center justify-center gap-2 text-sm text-[#9B8B7A] hover:text-[#E07B5A] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {suggesting && isActive
                    ? <><RefreshCw size={14} className="animate-spin" /> 提案を考え中...</>
                    : <><ChefHat size={14} /> タップして献立を提案</>
                  }
                </button>
              )}

              {/* 提案一覧 */}
              {isActive && suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[#9B8B7A] px-1">提案から選んでください</p>
                  {suggestions.map((s, i) => (
                    <SuggestionCard
                      key={i}
                      suggestion={s}
                      saved={isSaved(s.dish_name)}
                      onSelect={() => handleSelectSuggestion(s)}
                      onRecipe={() => openRecipe(s.dish_name)}
                      onSave={() => toggleSave(s)}
                    />
                  ))}
                  <button onClick={() => handleSuggest(mealType, true)} className="w-full py-2 text-xs text-[#E07B5A] flex items-center justify-center gap-1">
                    <RefreshCw size={12} /> 別の提案を見る（AI再生成）
                  </button>
                </div>
              )}
            </section>
          )
        })}

        {/* おつまみ */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍺</span>
            <h2 className="text-sm font-bold text-[#3A3A3A]">おつまみ</h2>
          </div>
          <Link href="/snack">
            <div className="w-full bg-white rounded-2xl border border-[#E8E0D8] hover:border-[#7BC4A8] transition-colors p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EDF7F4] flex items-center justify-center flex-shrink-0">
                <Beer size={18} className="text-[#7BC4A8]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#3A3A3A]">おつまみを提案する</p>
                <p className="text-xs text-[#9B8B7A]">15分以内・一品サクッと</p>
              </div>
              <span className="text-xs text-[#7BC4A8] ml-auto">→</span>
            </div>
          </Link>
        </section>
      </div>

      {/* レシピシート */}
      <RecipeSheet
        dishName={recipeDish}
        recipe={recipe}
        loading={loadingRecipe}
        onClose={() => { setRecipeDish(null); setRecipe(null) }}
      />
    </div>
  )
}

// ─── SavedDishesSection ───────────────────────────────────────────────────────

function SavedDishesSection({ dishes, onRecipe, onRemove }: {
  dishes: SavedDish[]
  onRecipe: (name: string) => void
  onRemove: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className="space-y-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-1"
      >
        <div className="flex items-center gap-1.5">
          <BookmarkCheck size={14} className="text-[#E07B5A]" />
          <span className="text-sm font-bold text-[#3A3A3A]">保存した献立</span>
          <Badge className="text-xs bg-[#FFF1EC] text-[#E07B5A] border-[#F0D0C0] px-1.5 py-0">{dishes.length}</Badge>
        </div>
        <span className="text-xs text-[#9B8B7A]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="space-y-2">
          {dishes.map((d, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-3 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#3A3A3A] truncate">{d.dish_name}</p>
                {d.description && <p className="text-xs text-[#9B8B7A] truncate">{d.description}</p>}
              </div>
              <button
                onClick={() => onRecipe(d.dish_name)}
                className="text-xs text-[#E07B5A] font-medium flex-shrink-0 px-2 py-1 rounded-lg bg-[#FFF1EC]"
              >
                レシピ
              </button>
              <button onClick={() => onRemove(d.dish_name)} className="text-[#C4B5A8] hover:text-red-400 flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── SavedPlanCard ────────────────────────────────────────────────────────────

function SavedPlanCard({ plan, onCook, isCooking, onRecipe }: {
  plan: MealPlan
  onCook: (p: MealPlan) => void
  isCooking: boolean
  onRecipe: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const availableIngs = plan.meal_plan_ingredients?.filter(i => i.is_available) ?? []
  const missingIngs = plan.meal_plan_ingredients?.filter(i => !i.is_available) ?? []

  return (
    <div className={cn('bg-white rounded-2xl border px-4 py-3 transition-all', plan.is_cooked ? 'border-[#7BC4A8] bg-[#EDF7F4]' : 'border-[#E8E0D8]')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-[#3A3A3A]">{plan.dish_name}</h3>
            {plan.plan_type === 'need_shopping' && <Badge className="text-xs bg-[#FFF8F0] text-[#E07B5A] border-[#F0D0C0] px-1.5 py-0">買い足し</Badge>}
            {plan.is_cooked && <Badge className="text-xs bg-[#EDF7F4] text-[#7BC4A8] border-[#B8E4D8] px-1.5 py-0">✓ 作りました</Badge>}
          </div>
          {plan.description && <p className="text-xs text-[#9B8B7A] mt-0.5">{plan.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onRecipe} className="text-xs text-[#9B8B7A] hover:text-[#E07B5A] px-2 py-1 rounded-lg bg-[#F8F6F2]">
            レシピ
          </button>
          {!plan.is_cooked && (
            <Button size="sm" onClick={() => onCook(plan)} disabled={isCooking} className="bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-xl h-8 px-3 text-xs">
              {isCooking ? '...' : '作った'}
            </Button>
          )}
        </div>
      </div>

      {plan.meal_plan_ingredients && plan.meal_plan_ingredients.length > 0 && (
        <button onClick={() => setExpanded(!expanded)} className="mt-2 text-xs text-[#9B8B7A] hover:text-[#3A3A3A]">
          {expanded ? '▲ 食材を閉じる' : `▼ 食材を見る（${plan.meal_plan_ingredients.length}品）`}
        </button>
      )}

      {expanded && (
        <div className="mt-2 space-y-1">
          {availableIngs.map(ing => (
            <div key={ing.id} className="flex items-center gap-1.5 text-xs text-[#3A3A3A]">
              <Check size={12} className="text-[#7BC4A8]" />
              {ing.ingredient_name} {ing.required_quantity}{UNIT_LABELS[ing.unit]}
            </div>
          ))}
          {missingIngs.map(ing => (
            <div key={ing.id} className="flex items-center gap-1.5 text-xs text-[#E07B5A]">
              <ShoppingCart size={12} />
              {ing.ingredient_name} {ing.required_quantity}{UNIT_LABELS[ing.unit]}（買い足し）
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SuggestionCard ───────────────────────────────────────────────────────────

function SuggestionCard({ suggestion, saved, onSelect, onRecipe, onSave }: {
  suggestion: MealSuggestion
  saved: boolean
  onSelect: () => void
  onRecipe: () => void
  onSave: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#3A3A3A]">{suggestion.dish_name}</span>
            {suggestion.plan_type === 'need_shopping' && (
              <Badge className="text-xs bg-[#FFF8F0] text-[#E07B5A] border-[#F0D0C0] px-1.5 py-0">
                <ShoppingCart size={10} className="mr-0.5" />買い足し{suggestion.missing_ingredients.length}品
              </Badge>
            )}
            {suggestion.plan_type === 'available' && (
              <Badge className="text-xs bg-[#EDF7F4] text-[#7BC4A8] border-[#B8E4D8] px-1.5 py-0">家にある材料で作れる</Badge>
            )}
          </div>
          {suggestion.description && <p className="text-xs text-[#9B8B7A] mt-0.5">{suggestion.description}</p>}
          {suggestion.missing_ingredients.length > 0 && (
            <p className="text-xs text-[#E07B5A] mt-1">買い足し：{suggestion.missing_ingredients.map(i => i.name).join('、')}</p>
          )}
        </div>
        <button onClick={onSave} className={cn('flex-shrink-0 p-1', saved ? 'text-[#E07B5A]' : 'text-[#C4B5A8] hover:text-[#E07B5A]')}>
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0EDE8]">
        <button onClick={onRecipe} className="text-xs text-[#9B8B7A] hover:text-[#3A3A3A] flex items-center gap-1">
          レシピを見る →
        </button>
        <button onClick={onSelect} className="text-xs text-[#E07B5A] font-bold flex items-center gap-0.5">
          この献立に決める →
        </button>
      </div>
    </div>
  )
}

// ─── NearPossibleCard ─────────────────────────────────────────────────────────

function NearPossibleCard({ suggestion, saved, onRecipe, onSave }: {
  suggestion: MealSuggestion
  saved: boolean
  onRecipe: () => void
  onSave: () => void
}) {
  const missing = suggestion.missing_ingredients ?? []
  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#3A3A3A]">{suggestion.dish_name}</p>
          {suggestion.description && <p className="text-xs text-[#9B8B7A] mt-0.5">{suggestion.description}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge className="text-xs bg-[#FFF8F0] text-[#E07B5A] border-[#F0D0C0] px-1.5 py-0">あと{missing.length}品</Badge>
          <button onClick={onSave} className={cn('p-1', saved ? 'text-[#E07B5A]' : 'text-[#C4B5A8] hover:text-[#E07B5A]')}>
            {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>
      </div>
      {missing.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {missing.map((m, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-[#FFF1EC] text-[#E07B5A] text-xs font-medium px-2.5 py-1 rounded-full border border-[#F0D0C0]">
              <ShoppingCart size={10} />{m.name}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 pt-2 border-t border-[#F0EDE8]">
        <button onClick={onRecipe} className="text-xs text-[#9B8B7A] hover:text-[#3A3A3A]">
          レシピを見る →
        </button>
      </div>
    </div>
  )
}

// ─── 理想値（1食分の目安） ────────────────────────────────────────────────────

const IDEAL_NUTRITION: NutritionData = {
  calories: 667,  // 2000kcal ÷ 3食
  protein:  17,   // 50g ÷ 3
  fiber:     7,   // 21g ÷ 3
  fat:      22,   // 65g ÷ 3
  salt:      2,   // 6g ÷ 3
  carbs:    67,   // 200g ÷ 3
}

// ─── RecipeSheet ──────────────────────────────────────────────────────────────

function RecipeSheet({ dishName, recipe, loading, onClose }: {
  dishName: string | null
  recipe: Recipe | null
  loading: boolean
  onClose: () => void
}) {
  return (
    <Sheet open={!!dishName} onOpenChange={open => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl bg-white max-h-[90vh] overflow-y-auto pb-10">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base font-bold text-[#3A3A3A]">
            {recipe?.dish_name ?? dishName}
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <RefreshCw size={24} className="text-[#E07B5A] animate-spin" />
            <p className="text-sm text-[#9B8B7A]">レシピを生成中...</p>
          </div>
        )}

        {!loading && recipe && (
          <div className="space-y-5">
            {/* メタ情報 */}
            <div className="flex items-center gap-4 text-sm text-[#9B8B7A]">
              <span className="flex items-center gap-1"><Clock size={14} />{recipe.time}</span>
              <span className="flex items-center gap-1"><Users size={14} />{recipe.servings}</span>
            </div>

            {/* 材料 */}
            <div>
              <p className="text-xs font-bold text-[#9B8B7A] uppercase tracking-wide mb-2">材料</p>
              <div className="bg-[#F8F6F2] rounded-xl p-3 space-y-1.5">
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#3A3A3A]">{ing.name}</span>
                    <span className="text-[#9B8B7A]">{ing.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 手順 */}
            <div>
              <p className="text-xs font-bold text-[#9B8B7A] uppercase tracking-wide mb-2">作り方</p>
              <div className="space-y-3">
                {recipe.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#E07B5A] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-[#3A3A3A] leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* コツ */}
            {recipe.tips && (
              <div className="bg-[#FFF8F0] border border-[#F0D0C0] rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-[#E07B5A] mb-1">ひとことコツ</p>
                <p className="text-sm text-[#3A3A3A]">{recipe.tips}</p>
              </div>
            )}

            {/* 栄養バランスチャート */}
            {recipe.nutrition && (
              <div>
                <p className="text-xs font-bold text-[#9B8B7A] uppercase tracking-wide mb-3">栄養バランス</p>
                <NutritionRadarChart
                  ideal={IDEAL_NUTRITION}
                  recipe={recipe.nutrition}
                />
              </div>
            )}
          </div>
        )}

        {!loading && !recipe && dishName && (
          <p className="text-sm text-center text-[#9B8B7A] py-8">レシピを取得できませんでした</p>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── ページエントリ ───────────────────────────────────────────────────────────

export default function MealPlansPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin text-[#9B8B7A]" /></div>}>
      <MealPlansContent />
    </Suspense>
  )
}
