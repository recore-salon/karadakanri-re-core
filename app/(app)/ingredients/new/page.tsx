'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Search, PenLine, Plus, Minus } from 'lucide-react'
import type { Category, Unit } from '@/types'
import { CATEGORY_LABELS, UNIT_LABELS, UNITS, CATEGORIES } from '@/types'

type CommonItem = { name: string; category: Category; unit: Unit }

const CATEGORY_TABS = [
  { value: 'all', label: '全て' },
  { value: 'fridge', label: '冷蔵' },
  { value: 'freezer', label: '冷凍' },
  { value: 'pantry', label: '常温' },
  { value: 'seasoning', label: '調味料' },
] as const

type CategoryTab = 'all' | Category

const CATEGORY_COLORS: Record<Category, string> = {
  fridge: 'bg-blue-50 border-blue-200 text-blue-700 data-[selected=true]:bg-blue-500 data-[selected=true]:text-white',
  freezer: 'bg-indigo-50 border-indigo-200 text-indigo-700 data-[selected=true]:bg-indigo-500 data-[selected=true]:text-white',
  pantry: 'bg-amber-50 border-amber-200 text-amber-700 data-[selected=true]:bg-amber-500 data-[selected=true]:text-white',
  seasoning: 'bg-rose-50 border-rose-200 text-rose-700 data-[selected=true]:bg-rose-500 data-[selected=true]:text-white',
}

function getStep(unit: Unit): number {
  if (unit === 'g' || unit === 'ml') return 50
  if (unit === 'kg' || unit === 'L') return 0.1
  return 1
}

export default function NewIngredientPage() {
  const router = useRouter()
  const [step, setStep] = useState<'pick' | 'detail'>('pick')
  const [allItems, setAllItems] = useState<CommonItem[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<CategoryTab>('all')
  const [loadingList, setLoadingList] = useState(true)
  const [isManual, setIsManual] = useState(false)

  // Detail form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('fridge')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState<Unit>('piece')
  const [isBento, setIsBento] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/ingredients/suggest?all=1')
      .then(r => r.json())
      .then(d => setAllItems(d.suggestions ?? []))
      .finally(() => setLoadingList(false))
  }, [])

  const filtered = useMemo(() => {
    let items = allItems
    if (activeTab !== 'all') items = items.filter(i => i.category === activeTab)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter(i => i.name.toLowerCase().includes(q))
    }
    return items
  }, [allItems, activeTab, search])

  function selectItem(item: CommonItem) {
    setName(item.name)
    setCategory(item.category)
    setUnit(item.unit)
    setQuantity(getStep(item.unit))
    setIsManual(false)
    setStep('detail')
  }

  function openManual() {
    setName('')
    setCategory('fridge')
    setUnit('piece')
    setQuantity(1)
    setIsManual(true)
    setStep('detail')
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error('食材名を入力してください')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          quantity,
          unit,
          is_bento: isBento,
          expires_at: expiresAt || null,
          memo: memo || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'エラーが発生しました')
        return
      }
      // 手入力の場合、次回から候補に表示されるよう common_ingredients に追加
      if (isManual) {
        await fetch('/api/ingredients/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), category, unit }),
        })
      }
      toast.success('食材を登録しました')
      router.push('/ingredients')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  // ── Step 1: Pick ──────────────────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <div className="min-h-screen bg-[#FAF7F4]">
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#E8E0D8]">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => router.push('/ingredients')} className="text-[#9B8B7A]">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-[#3A3A3A] flex-1">食材を追加</h1>
          </div>
          {/* 検索バー */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8B7A]" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="食材名で検索..."
                className="pl-9 rounded-xl border-[#E8E0D8] bg-[#F8F6F2] h-10"
              />
            </div>
          </div>
          {/* カテゴリタブ */}
          <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as CategoryTab)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  activeTab === tab.value
                    ? 'bg-[#E07B5A] text-white border-[#E07B5A]'
                    : 'bg-white text-[#9B8B7A] border-[#E8E0D8]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* リスト */}
        <div className="px-4 py-4 pb-28">
          {loadingList ? (
            <p className="text-center text-sm text-[#9B8B7A] py-12">読み込み中...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-[#9B8B7A] py-12">
              {search ? `「${search}」に一致する食材はありません` : '食材がありません'}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filtered.map(item => (
                <button
                  key={item.name}
                  onClick={() => selectItem(item)}
                  className="bg-white rounded-2xl border border-[#E8E0D8] p-3 text-left active:scale-95 transition-transform shadow-sm"
                >
                  <p className="text-sm font-medium text-[#3A3A3A] leading-tight">{item.name}</p>
                  <p className="text-[10px] text-[#9B8B7A] mt-1">{CATEGORY_LABELS[item.category]}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 手入力ボタン */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-[#E8E0D8]">
          <button
            onClick={openManual}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-[#E8E0D8] text-[#9B8B7A] text-sm font-medium hover:border-[#E07B5A] hover:text-[#E07B5A] transition-colors"
          >
            <PenLine className="w-4 h-4" />
            リストにない食材を手入力
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Detail ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF7F4]">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E8E0D8]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => setStep('pick')} className="text-[#9B8B7A]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-[#3A3A3A] flex-1">
            {isManual ? '食材を手入力' : '在庫を登録'}
          </h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5 pb-28">
        {/* 食材名 */}
        <div className="space-y-1.5">
          <Label className="text-sm text-[#3A3A3A] font-medium">
            食材名 <span className="text-red-400">*</span>
          </Label>
          {isManual ? (
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：鶏むね肉"
              autoFocus
              className="rounded-xl border-[#E8E0D8] bg-white h-11"
            />
          ) : (
            <div className="rounded-xl border border-[#E8E0D8] bg-[#F8F6F2] h-11 px-4 flex items-center text-[#3A3A3A] font-medium">
              {name}
            </div>
          )}
        </div>

        {/* 保管場所 */}
        <div className="space-y-1.5">
          <Label className="text-sm text-[#3A3A3A] font-medium">
            保管場所 <span className="text-red-400">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                data-selected={category === cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'h-11 rounded-xl border-2 text-sm font-medium transition-all',
                  CATEGORY_COLORS[cat],
                  category === cat && 'border-transparent'
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* 数量 */}
        <div className="space-y-1.5">
          <Label className="text-sm text-[#3A3A3A] font-medium">
            数量 <span className="text-red-400">*</span>
          </Label>
          <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E8E0D8] p-2">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(0, parseFloat((q - getStep(unit)).toFixed(3))))}
              className="w-10 h-10 rounded-lg bg-[#F8F6F2] flex items-center justify-center text-[#9B8B7A] active:bg-[#E8E0D8]"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={quantity}
              min={0}
              onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
              className="flex-1 text-center text-xl font-bold text-[#3A3A3A] bg-transparent outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity(q => parseFloat((q + getStep(unit)).toFixed(3)))}
              className="w-10 h-10 rounded-lg bg-[#F8F6F2] flex items-center justify-center text-[#9B8B7A] active:bg-[#E8E0D8]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 単位 */}
        <div className="space-y-1.5">
          <Label className="text-sm text-[#3A3A3A] font-medium">単位</Label>
          <div className="flex flex-wrap gap-1.5">
            {UNITS.map(u => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all',
                  unit === u
                    ? 'bg-[#E07B5A] border-[#E07B5A] text-white'
                    : 'bg-white border-[#E8E0D8] text-[#9B8B7A] hover:border-[#E07B5A]'
                )}
              >
                {UNIT_LABELS[u]}
              </button>
            ))}
          </div>
        </div>

        {/* お弁当用タグ */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E8E0D8] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#3A3A3A]">お弁当用タグ</p>
            <p className="text-xs text-[#9B8B7A]">通常の献立提案では使いません</p>
          </div>
          <button
            type="button"
            onClick={() => setIsBento(b => !b)}
            className={cn(
              'w-12 h-6 rounded-full transition-all duration-200 relative',
              isBento ? 'bg-[#E07B5A]' : 'bg-[#E8E0D8]'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200',
              isBento ? 'left-6' : 'left-0.5'
            )} />
          </button>
        </div>

        {/* 消費期限 */}
        <div className="space-y-1.5">
          <Label className="text-sm text-[#3A3A3A] font-medium">
            消費期限 <span className="text-xs text-[#9B8B7A] font-normal">（任意）</span>
          </Label>
          <Input
            type="date"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            className="rounded-xl border-[#E8E0D8] bg-white h-11"
          />
        </div>

        {/* メモ */}
        <div className="space-y-1.5">
          <Label className="text-sm text-[#3A3A3A] font-medium">
            メモ <span className="text-xs text-[#9B8B7A] font-normal">（任意）</span>
          </Label>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="メモ（200文字以内）"
            maxLength={200}
            rows={2}
            className="w-full rounded-xl border border-[#E8E0D8] bg-white resize-none text-sm px-3 py-2.5 outline-none focus:border-[#E07B5A] transition-colors"
          />
        </div>
      </div>

      {/* 登録ボタン */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-[#E8E0D8]">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-xl h-12 text-base font-medium"
        >
          {submitting ? '保存中...' : '食材を登録する'}
        </Button>
      </div>
    </div>
  )
}
