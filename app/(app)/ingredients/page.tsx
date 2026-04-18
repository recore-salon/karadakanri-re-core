'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Package, RefreshCw, Minus, AlertTriangle, Refrigerator, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import PageHeader from '@/components/shared/PageHeader'
import FridgeView from '@/components/shared/FridgeView'
import { toast } from 'sonner'
import { cn, getExpiryStatus, generateUUID } from '@/lib/utils'
import type { Ingredient, Category } from '@/types'
import { CATEGORY_LABELS, UNIT_LABELS, CATEGORIES } from '@/types'

const TABS: { value: 'all' | Category; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'fridge', label: '冷蔵' },
  { value: 'freezer', label: '冷凍' },
  { value: 'pantry', label: '常温' },
  { value: 'seasoning', label: '調味料' },
]

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [activeTab, setActiveTab] = useState<'all' | Category>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [useSheet, setUseSheet] = useState<Ingredient | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'fridge'>('list')

  const fetchIngredients = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    // 冷蔵庫ビューは全件取得、リストビューはフィルター適用
    if (viewMode === 'list') {
      if (activeTab !== 'all') params.set('category', activeTab)
      if (search) params.set('search', search)
    }
    const res = await fetch(`/api/ingredients?${params}`)
    const data = await res.json()
    setIngredients(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [activeTab, search, viewMode])

  useEffect(() => {
    const t = setTimeout(fetchIngredients, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchIngredients, search])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return
    const res = await fetch(`/api/ingredients/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setIngredients(prev => prev.filter(i => i.id !== id))
      toast.success(`「${name}」を削除しました`)
    } else {
      toast.error('削除に失敗しました')
    }
  }

  // +/- クイック数量変更
  async function handleQuickQty(ingredient: Ingredient, delta: number) {
    const newQty = Math.max(0, ingredient.quantity + delta)
    const res = await fetch(`/api/ingredients/${ingredient.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty }),
    })
    if (res.ok) {
      setIngredients(prev =>
        prev.map(i => i.id === ingredient.id ? { ...i, quantity: newQty } : i)
      )
    }
  }

  // 「使った」シートから減算
  async function handleUse(ingredient: Ingredient, amount: number) {
    const groupId = generateUUID()
    const res = await fetch('/api/stock/deduct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ ingredient_id: ingredient.id, delta: amount }],
        people: 1,
        portion: 'standard',
      }),
    })
    const data = await res.json()
    if (res.ok) {
      const updated = data.updated_ingredients.find((u: { id: string; new_quantity: number }) => u.id === ingredient.id)
      if (updated) {
        setIngredients(prev =>
          prev.map(i => i.id === ingredient.id ? { ...i, quantity: updated.new_quantity } : i)
        )
      }
      setUseSheet(null)
      toast.success(`「${ingredient.name}」を使いました`, {
        action: {
          label: '取り消す',
          onClick: async () => {
            const r = await fetch('/api/stock/undo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transaction_group_id: data.transaction_group_id }),
            })
            if (r.ok) {
              setIngredients(prev =>
                prev.map(i => i.id === ingredient.id ? { ...i, quantity: ingredient.quantity } : i)
              )
              toast.info('取り消しました')
            }
          },
        },
        duration: 6000,
      })
    } else {
      toast.error('操作に失敗しました')
    }
  }

  // 期限切れ・期限間近の食材
  const expiryAlerts = ingredients.filter(i => {
    const s = getExpiryStatus(i.expires_at)
    return s === 'expired' || s === 'soon'
  })

  return (
    <div>
      <PageHeader
        title="在庫一覧"
        backHref="/home"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(v => v === 'list' ? 'fridge' : 'list')}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
                viewMode === 'fridge'
                  ? 'bg-[#E07B5A] text-white'
                  : 'bg-[#F8F6F2] text-[#9B8B7A] hover:bg-[#E8E0D8]'
              )}
              title={viewMode === 'fridge' ? 'リスト表示' : '冷蔵庫表示'}
            >
              {viewMode === 'fridge' ? <List size={15} /> : <Refrigerator size={15} />}
            </button>
            <Link href="/ingredients/new">
              <Button size="sm" className="bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-xl h-8 px-3 text-xs">
                <Plus size={14} className="mr-1" /> 追加
              </Button>
            </Link>
          </div>
        }
      />

      <div className="px-4 py-3 space-y-3">
        {/* 期限アラートバナー */}
        {!loading && expiryAlerts.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-orange-700">期限に注意が必要な食材があります</p>
              <p className="text-xs text-orange-600 mt-0.5">
                {expiryAlerts.map(i => i.name).join('、')}
              </p>
            </div>
          </div>
        )}

        {/* 冷蔵庫ビュー */}
        {viewMode === 'fridge' && (
          loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw size={20} className="text-[#9B8B7A] animate-spin" />
            </div>
          ) : (
            <FridgeView ingredients={ingredients} />
          )
        )}

        {/* リストビュー */}
        {viewMode === 'list' && (<>
        {/* 検索 */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B8B7A]" />
          <Input
            placeholder="食材を検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-[#E8E0D8] bg-white text-sm h-10"
          />
        </div>

        {/* タブ */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
          <TabsList className="w-full bg-white border border-[#E8E0D8] rounded-xl h-9 p-0.5">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 text-xs rounded-lg data-[state=active]:bg-[#E07B5A] data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <p className="text-xs text-[#9B8B7A]">
          {loading ? '読み込み中...' : `${ingredients.length}品`}
        </p>

        {/* 食材リスト */}
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw size={20} className="text-[#9B8B7A] animate-spin" />
          </div>
        ) : ingredients.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package size={36} className="mx-auto text-[#C4B5A8]" />
            <p className="text-sm text-[#9B8B7A]">
              {search ? '食材が見つかりません' : 'まだ食材が登録されていません'}
            </p>
            {!search && (
              <Link href="/ingredients/new">
                <Button className="mt-2 bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-xl text-sm">
                  最初の食材を登録する
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {ingredients.map(ingredient => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                onDelete={handleDelete}
                onQuickQty={handleQuickQty}
                onUse={() => setUseSheet(ingredient)}
              />
            ))}
          </div>
        )}
        </>)}
      </div>

      {/* 「使った」シート */}
      <UseSheet
        ingredient={useSheet}
        onClose={() => setUseSheet(null)}
        onUse={handleUse}
      />
    </div>
  )
}

// ─── IngredientRow ───────────────────────────────────────────────────────────

function IngredientRow({
  ingredient,
  onDelete,
  onQuickQty,
  onUse,
}: {
  ingredient: Ingredient
  onDelete: (id: string, name: string) => void
  onQuickQty: (ingredient: Ingredient, delta: number) => void
  onUse: () => void
}) {
  const expiryStatus = getExpiryStatus(ingredient.expires_at)

  return (
    <div className={cn(
      'bg-white rounded-2xl border px-3 py-3 flex items-center gap-2',
      expiryStatus === 'expired' ? 'border-red-200 bg-red-50/40' :
      expiryStatus === 'soon'    ? 'border-orange-200 bg-orange-50/30' :
                                   'border-[#E8E0D8]'
    )}>
      {/* カテゴリカラーバー */}
      <div className={cn('w-1 h-10 rounded-full flex-shrink-0', {
        'bg-blue-400':   ingredient.category === 'fridge',
        'bg-indigo-400': ingredient.category === 'freezer',
        'bg-amber-400':  ingredient.category === 'pantry',
        'bg-rose-400':   ingredient.category === 'seasoning',
      })} />

      {/* 食材情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold text-[#3A3A3A] truncate">{ingredient.name}</span>
          {ingredient.is_bento && (
            <Badge className="text-xs bg-[#FFF1EC] text-[#E07B5A] border-[#F0D0C0] px-1.5 py-0">弁当</Badge>
          )}
          {expiryStatus === 'expired' && (
            <Badge className="text-xs bg-red-50 text-red-500 border-red-200 px-1.5 py-0">期限切れ</Badge>
          )}
          {expiryStatus === 'soon' && (
            <Badge className="text-xs bg-orange-50 text-orange-500 border-orange-200 px-1.5 py-0">期限間近</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[#9B8B7A]">{CATEGORY_LABELS[ingredient.category]}</span>
          {ingredient.expires_at && (
            <span className="text-xs text-[#C4B5A8]">{ingredient.expires_at.replace(/-/g, '/')}まで</span>
          )}
        </div>
      </div>

      {/* 数量 +/- */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onQuickQty(ingredient, -1)}
          disabled={ingredient.quantity <= 0}
          className="w-7 h-7 rounded-lg bg-[#F8F6F2] disabled:opacity-30 flex items-center justify-center"
        >
          <Minus size={12} className="text-[#3A3A3A]" />
        </button>
        <span className="text-sm font-bold text-[#3A3A3A] w-12 text-center tabular-nums">
          {ingredient.quantity}{UNIT_LABELS[ingredient.unit]}
        </span>
        <button
          onClick={() => onQuickQty(ingredient, 1)}
          className="w-7 h-7 rounded-lg bg-[#F8F6F2] flex items-center justify-center"
        >
          <Plus size={12} className="text-[#3A3A3A]" />
        </button>
      </div>

      {/* アクションメニュー */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={onUse}
          className="bg-[#E07B5A] text-white text-xs font-medium rounded-lg px-2.5 py-1.5 hover:bg-[#C96A4A] transition-colors"
        >
          使った
        </button>
        <div className="flex gap-1">
          <Link href={`/ingredients/${ingredient.id}/edit`}>
            <button className="text-xs text-[#9B8B7A] hover:text-[#3A3A3A] px-1.5 py-0.5">編集</button>
          </Link>
          <button
            className="text-xs text-red-400 hover:text-red-500 px-1.5 py-0.5"
            onClick={() => onDelete(ingredient.id, ingredient.name)}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── UseSheet ────────────────────────────────────────────────────────────────

function UseSheet({
  ingredient,
  onClose,
  onUse,
}: {
  ingredient: Ingredient | null
  onClose: () => void
  onUse: (ingredient: Ingredient, amount: number) => void
}) {
  const [amount, setAmount] = useState(1)

  useEffect(() => {
    if (ingredient) setAmount(1)
  }, [ingredient])

  if (!ingredient) return null

  const presets = ingredient.unit === 'piece'
    ? [1, 2, 3]
    : ingredient.unit === 'g' || ingredient.unit === 'ml'
    ? [50, 100, 200]
    : [1, 2, 3]

  return (
    <Sheet open={!!ingredient} onOpenChange={open => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl bg-white pb-8 px-5">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base font-bold text-[#3A3A3A]">
            「{ingredient.name}」を使いました
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <p className="text-xs text-[#9B8B7A]">
            現在の在庫：{ingredient.quantity}{UNIT_LABELS[ingredient.unit]}
          </p>

          {/* プリセットボタン */}
          <div>
            <p className="text-xs font-medium text-[#9B8B7A] mb-2">使った量</p>
            <div className="flex gap-2 mb-3">
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => setAmount(p)}
                  className={cn(
                    'flex-1 h-10 rounded-xl border-2 text-sm font-bold transition-all',
                    amount === p
                      ? 'bg-[#E07B5A] border-[#E07B5A] text-white'
                      : 'bg-white border-[#E8E0D8] text-[#3A3A3A]'
                  )}
                >
                  {p}{UNIT_LABELS[ingredient.unit]}
                </button>
              ))}
            </div>

            {/* 数値直接入力 */}
            <div className="flex items-center gap-3 bg-[#F8F6F2] rounded-xl px-4 py-3">
              <button
                onClick={() => setAmount(v => Math.max(0.5, v - (ingredient.unit === 'g' || ingredient.unit === 'ml' ? 10 : 0.5)))}
                className="w-8 h-8 rounded-lg bg-white border border-[#E8E0D8] font-bold flex items-center justify-center"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-[#3A3A3A]">{amount}</span>
                <span className="text-sm text-[#9B8B7A] ml-1">{UNIT_LABELS[ingredient.unit]}</span>
              </div>
              <button
                onClick={() => setAmount(v => v + (ingredient.unit === 'g' || ingredient.unit === 'ml' ? 10 : 1))}
                className="w-8 h-8 rounded-lg bg-white border border-[#E8E0D8] font-bold flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* 使い切りボタン */}
          <button
            onClick={() => setAmount(ingredient.quantity)}
            className="w-full py-2 text-xs text-[#9B8B7A] hover:text-[#E07B5A] border border-dashed border-[#E8E0D8] rounded-xl"
          >
            使い切り（{ingredient.quantity}{UNIT_LABELS[ingredient.unit]}）
          </button>

          <Button
            onClick={() => onUse(ingredient, amount)}
            disabled={amount <= 0}
            className="w-full bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-xl h-12 text-base font-medium"
          >
            {amount}{UNIT_LABELS[ingredient.unit]} 使ったことを記録
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
