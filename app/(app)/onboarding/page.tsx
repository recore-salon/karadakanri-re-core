'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Category, Unit } from '@/types'
import { CATEGORY_LABELS, UNIT_LABELS } from '@/types'

interface CommonItem {
  name: string
  category: Category
  unit: Unit
  defaultQty: number
}

interface SubGroup {
  label: string
  items: CommonItem[]
}

interface CategoryGroup {
  category: Category
  subGroups: SubGroup[]
}

const ONBOARDING_ITEMS: CategoryGroup[] = [
  {
    category: 'fridge',
    subGroups: [
      {
        label: '肉類',
        items: [
          { name: '鶏むね肉', category: 'fridge', unit: 'g', defaultQty: 300 },
          { name: '鶏もも肉', category: 'fridge', unit: 'g', defaultQty: 300 },
          { name: '豚バラ肉', category: 'fridge', unit: 'g', defaultQty: 200 },
          { name: '豚こま切れ肉', category: 'fridge', unit: 'g', defaultQty: 200 },
          { name: 'ひき肉（豚）', category: 'fridge', unit: 'g', defaultQty: 200 },
          { name: 'ひき肉（合挽）', category: 'fridge', unit: 'g', defaultQty: 200 },
          { name: '牛こま切れ肉', category: 'fridge', unit: 'g', defaultQty: 200 },
          { name: '牛ステーキ肉', category: 'fridge', unit: 'g', defaultQty: 200 },
          { name: 'ベーコン', category: 'fridge', unit: 'pack', defaultQty: 1 },
          { name: 'ウインナー', category: 'fridge', unit: 'bag', defaultQty: 1 },
        ],
      },
      {
        label: '魚介類',
        items: [
          { name: 'サーモン', category: 'fridge', unit: 'g', defaultQty: 200 },
          { name: '鮭', category: 'fridge', unit: 'g', defaultQty: 200 },
          { name: 'ぶり', category: 'fridge', unit: 'g', defaultQty: 200 },
          { name: 'アジ', category: 'fridge', unit: 'piece', defaultQty: 2 },
          { name: 'エビ', category: 'fridge', unit: 'g', defaultQty: 150 },
          { name: 'ちくわ', category: 'fridge', unit: 'pack', defaultQty: 1 },
          { name: 'かまぼこ', category: 'fridge', unit: 'piece', defaultQty: 1 },
        ],
      },
      {
        label: '野菜',
        items: [
          { name: 'キャベツ', category: 'fridge', unit: 'piece', defaultQty: 1 },
          { name: '玉ねぎ', category: 'fridge', unit: 'piece', defaultQty: 3 },
          { name: 'にんじん', category: 'fridge', unit: 'piece', defaultQty: 2 },
          { name: 'じゃがいも', category: 'fridge', unit: 'piece', defaultQty: 3 },
          { name: '大根', category: 'fridge', unit: 'piece', defaultQty: 1 },
          { name: 'ほうれん草', category: 'fridge', unit: 'bag', defaultQty: 1 },
          { name: 'もやし', category: 'fridge', unit: 'bag', defaultQty: 1 },
          { name: '小松菜', category: 'fridge', unit: 'bag', defaultQty: 1 },
          { name: '長ねぎ', category: 'fridge', unit: 'piece', defaultQty: 1 },
          { name: 'にんにく', category: 'fridge', unit: 'piece', defaultQty: 3 },
          { name: '生姜', category: 'fridge', unit: 'piece', defaultQty: 1 },
          { name: 'ブロッコリー', category: 'fridge', unit: 'piece', defaultQty: 1 },
          { name: 'トマト', category: 'fridge', unit: 'piece', defaultQty: 3 },
          { name: 'きゅうり', category: 'fridge', unit: 'piece', defaultQty: 3 },
          { name: 'なす', category: 'fridge', unit: 'piece', defaultQty: 2 },
          { name: 'ピーマン', category: 'fridge', unit: 'piece', defaultQty: 4 },
          { name: 'レタス', category: 'fridge', unit: 'piece', defaultQty: 1 },
          { name: 'もやし', category: 'fridge', unit: 'bag', defaultQty: 1 },
        ],
      },
      {
        label: '卵・乳製品・豆腐',
        items: [
          { name: '卵', category: 'fridge', unit: 'piece', defaultQty: 6 },
          { name: '牛乳', category: 'fridge', unit: 'ml', defaultQty: 500 },
          { name: '豆腐', category: 'fridge', unit: 'piece', defaultQty: 1 },
          { name: '納豆', category: 'fridge', unit: 'pack', defaultQty: 3 },
          { name: 'ヨーグルト', category: 'fridge', unit: 'g', defaultQty: 400 },
          { name: 'チーズ（スライス）', category: 'fridge', unit: 'pack', defaultQty: 1 },
          { name: 'バター', category: 'fridge', unit: 'g', defaultQty: 100 },
          { name: '油揚げ', category: 'fridge', unit: 'piece', defaultQty: 2 },
        ],
      },
      {
        label: 'その他',
        items: [
          { name: 'キムチ', category: 'fridge', unit: 'g', defaultQty: 200 },
          { name: '梅干し', category: 'fridge', unit: 'piece', defaultQty: 5 },
          { name: '漬物', category: 'fridge', unit: 'g', defaultQty: 100 },
        ],
      },
    ],
  },
  {
    category: 'freezer',
    subGroups: [
      {
        label: '肉・魚',
        items: [
          { name: '鶏むね肉（冷凍）', category: 'freezer', unit: 'g', defaultQty: 300 },
          { name: '豚こま（冷凍）', category: 'freezer', unit: 'g', defaultQty: 200 },
          { name: 'エビ（冷凍）', category: 'freezer', unit: 'g', defaultQty: 150 },
          { name: '鮭（冷凍）', category: 'freezer', unit: 'g', defaultQty: 200 },
        ],
      },
      {
        label: '野菜',
        items: [
          { name: '冷凍枝豆', category: 'freezer', unit: 'g', defaultQty: 200 },
          { name: '冷凍ブロッコリー', category: 'freezer', unit: 'g', defaultQty: 200 },
          { name: '冷凍ほうれん草', category: 'freezer', unit: 'g', defaultQty: 200 },
          { name: '冷凍コーン', category: 'freezer', unit: 'g', defaultQty: 200 },
          { name: '冷凍ミックスベジタブル', category: 'freezer', unit: 'g', defaultQty: 200 },
        ],
      },
      {
        label: '麺・ご飯',
        items: [
          { name: '冷凍うどん', category: 'freezer', unit: 'bag', defaultQty: 3 },
          { name: '冷凍ご飯', category: 'freezer', unit: 'piece', defaultQty: 4 },
          { name: '冷凍餃子', category: 'freezer', unit: 'piece', defaultQty: 12 },
        ],
      },
    ],
  },
  {
    category: 'pantry',
    subGroups: [
      {
        label: '主食',
        items: [
          { name: '米', category: 'pantry', unit: 'kg', defaultQty: 5 },
          { name: '食パン', category: 'pantry', unit: 'bag', defaultQty: 1 },
          { name: 'パスタ', category: 'pantry', unit: 'g', defaultQty: 300 },
          { name: 'そうめん', category: 'pantry', unit: 'bag', defaultQty: 1 },
          { name: 'インスタントラーメン', category: 'pantry', unit: 'piece', defaultQty: 3 },
          { name: 'カップ麺', category: 'pantry', unit: 'piece', defaultQty: 3 },
        ],
      },
      {
        label: '缶詰・レトルト',
        items: [
          { name: '缶詰（ツナ）', category: 'pantry', unit: 'can', defaultQty: 2 },
          { name: '缶詰（サバ）', category: 'pantry', unit: 'can', defaultQty: 2 },
          { name: '缶詰（トマト）', category: 'pantry', unit: 'can', defaultQty: 2 },
          { name: 'レトルトカレー', category: 'pantry', unit: 'piece', defaultQty: 2 },
        ],
      },
      {
        label: 'その他',
        items: [
          { name: '乾燥わかめ', category: 'pantry', unit: 'bag', defaultQty: 1 },
          { name: '天かす', category: 'pantry', unit: 'bag', defaultQty: 1 },
          { name: 'ごま', category: 'pantry', unit: 'bag', defaultQty: 1 },
          { name: '乾燥ひじき', category: 'pantry', unit: 'bag', defaultQty: 1 },
          { name: '切り干し大根', category: 'pantry', unit: 'bag', defaultQty: 1 },
        ],
      },
    ],
  },
  {
    category: 'seasoning',
    subGroups: [
      {
        label: '基本調味料',
        items: [
          { name: '醤油', category: 'seasoning', unit: 'ml', defaultQty: 400 },
          { name: 'みりん', category: 'seasoning', unit: 'ml', defaultQty: 400 },
          { name: '料理酒', category: 'seasoning', unit: 'ml', defaultQty: 400 },
          { name: '砂糖', category: 'seasoning', unit: 'g', defaultQty: 200 },
          { name: '塩', category: 'seasoning', unit: 'g', defaultQty: 100 },
          { name: '酢', category: 'seasoning', unit: 'ml', defaultQty: 200 },
        ],
      },
      {
        label: '味噌・だし',
        items: [
          { name: '味噌', category: 'seasoning', unit: 'g', defaultQty: 400 },
          { name: 'めんつゆ', category: 'seasoning', unit: 'ml', defaultQty: 400 },
          { name: '白だし', category: 'seasoning', unit: 'ml', defaultQty: 200 },
          { name: 'だしの素', category: 'seasoning', unit: 'bag', defaultQty: 1 },
          { name: 'コンソメ', category: 'seasoning', unit: 'piece', defaultQty: 10 },
          { name: '鶏がらスープの素', category: 'seasoning', unit: 'g', defaultQty: 100 },
        ],
      },
      {
        label: '油',
        items: [
          { name: 'サラダ油', category: 'seasoning', unit: 'ml', defaultQty: 400 },
          { name: 'ごま油', category: 'seasoning', unit: 'ml', defaultQty: 100 },
          { name: 'オリーブオイル', category: 'seasoning', unit: 'ml', defaultQty: 200 },
        ],
      },
      {
        label: 'ソース・たれ',
        items: [
          { name: 'マヨネーズ', category: 'seasoning', unit: 'g', defaultQty: 300 },
          { name: 'ケチャップ', category: 'seasoning', unit: 'g', defaultQty: 200 },
          { name: 'ソース', category: 'seasoning', unit: 'ml', defaultQty: 200 },
          { name: 'ポン酢', category: 'seasoning', unit: 'ml', defaultQty: 200 },
          { name: 'オイスターソース', category: 'seasoning', unit: 'ml', defaultQty: 100 },
          { name: '豆板醤', category: 'seasoning', unit: 'g', defaultQty: 50 },
        ],
      },
      {
        label: '粉類',
        items: [
          { name: '片栗粉', category: 'seasoning', unit: 'g', defaultQty: 100 },
          { name: '小麦粉', category: 'seasoning', unit: 'g', defaultQty: 200 },
          { name: 'パン粉', category: 'seasoning', unit: 'g', defaultQty: 100 },
        ],
      },
    ],
  },
]

const CATEGORY_COLORS: Record<Category, { badge: string; header: string }> = {
  fridge:    { badge: 'bg-blue-50 border-blue-100 text-blue-700', header: 'bg-blue-50 text-blue-700' },
  freezer:   { badge: 'bg-indigo-50 border-indigo-100 text-indigo-700', header: 'bg-indigo-50 text-indigo-700' },
  pantry:    { badge: 'bg-amber-50 border-amber-100 text-amber-700', header: 'bg-amber-50 text-amber-700' },
  seasoning: { badge: 'bg-rose-50 border-rose-100 text-rose-700', header: 'bg-rose-50 text-rose-700' },
}

function getStep(unit: Unit): number {
  if (unit === 'g' || unit === 'ml') return 50
  if (unit === 'kg') return 1
  return 1
}

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'select' | 'done'>('select')
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const allItems = ONBOARDING_ITEMS.flatMap(g => g.subGroups.flatMap(sg => sg.items))

  function toggle(item: CommonItem) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(item.name)) {
        next.delete(item.name)
      } else {
        next.add(item.name)
        setQuantities(q => ({ ...q, [item.name]: item.defaultQty }))
      }
      return next
    })
  }

  function updateQty(name: string, unit: Unit, delta: number) {
    const step = getStep(unit)
    setQuantities(prev => ({
      ...prev,
      [name]: Math.max(step, (prev[name] ?? 1) + delta * step),
    }))
  }

  function toggleGroup(key: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectAll() {
    const next = new Set(allItems.map(i => i.name))
    setSelected(next)
    const q: Record<string, number> = {}
    allItems.forEach(i => { q[i.name] = i.defaultQty })
    setQuantities(q)
  }

  function clearAll() {
    setSelected(new Set())
    setQuantities({})
  }

  async function handleSave() {
    if (selected.size === 0) {
      router.push('/home')
      return
    }
    setSaving(true)
    const items = allItems.filter(i => selected.has(i.name))
    let success = 0
    for (const item of items) {
      const qty = quantities[item.name] ?? item.defaultQty
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          category: item.category,
          quantity: qty,
          unit: item.unit,
          is_bento: false,
        }),
      })
      if (res.ok) success++
    }
    setSaving(false)
    if (success > 0) {
      setStep('done')
    } else {
      toast.error('登録に失敗しました')
    }
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-bold text-[#3A3A3A]">{selected.size}品を登録しました！</h2>
          <p className="text-sm text-[#9B8B7A] leading-relaxed">
            食材の登録ありがとうございます。<br />
            さっそく今日の献立を提案してもらいましょう。
          </p>
          <Button
            onClick={() => router.push('/home')}
            className="w-full bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-xl h-12 text-base font-medium mt-4"
          >
            献立を提案してもらう
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      {/* ヘッダー */}
      <div className="bg-white border-b border-[#E8E0D8] px-4 py-4 sticky top-0 z-10">
        <p className="text-xs text-[#9B8B7A] font-medium">Re:Stock へようこそ</p>
        <h1 className="text-lg font-bold text-[#3A3A3A] mt-0.5">今ある食材を選んでください</h1>
        <p className="text-xs text-[#9B8B7A] mt-1">カテゴリーを開いて選ぶだけ。あとから変えられます。</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-bold text-[#E07B5A]">{selected.size}品 選択中</span>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-[#9B8B7A] hover:text-[#3A3A3A] underline">全選択</button>
            <button onClick={clearAll} className="text-xs text-[#9B8B7A] hover:text-[#3A3A3A] underline">クリア</button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-40">
        {ONBOARDING_ITEMS.map(({ category, subGroups }) => {
          const colors = CATEGORY_COLORS[category]
          const categorySelectedCount = subGroups.flatMap(sg => sg.items).filter(i => selected.has(i.name)).length
          return (
            <section key={category} className="bg-white rounded-2xl border border-[#E8E0D8] overflow-hidden">
              {/* カテゴリヘッダー */}
              <div className="px-4 py-3 border-b border-[#E8E0D8] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border', colors.badge)}>
                    {CATEGORY_LABELS[category]}
                  </span>
                  {categorySelectedCount > 0 && (
                    <span className="text-xs text-[#E07B5A] font-bold">{categorySelectedCount}品選択中</span>
                  )}
                </div>
              </div>

              {/* サブグループ一覧 */}
              <div className="divide-y divide-[#F0EDE8]">
                {subGroups.map(sg => {
                  const key = `${category}-${sg.label}`
                  const isOpen = openGroups.has(key)
                  const subSelected = sg.items.filter(i => selected.has(i.name)).length
                  return (
                    <div key={key}>
                      {/* サブグループヘッダー（タップで開閉） */}
                      <button
                        onClick={() => toggleGroup(key)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#F8F6F2] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#3A3A3A]">{sg.label}</span>
                          {subSelected > 0 && (
                            <span className="text-xs bg-[#FFF1EC] text-[#E07B5A] font-bold px-1.5 py-0.5 rounded-full">
                              {subSelected}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          size={16}
                          className={cn('text-[#9B8B7A] transition-transform', isOpen && 'rotate-180')}
                        />
                      </button>

                      {/* アイテム一覧 */}
                      {isOpen && (
                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                          {sg.items.map(item => {
                            const isSelected = selected.has(item.name)
                            const qty = quantities[item.name] ?? item.defaultQty
                            const unitLabel = UNIT_LABELS[item.unit] ?? item.unit
                            return isSelected ? (
                              /* 選択済み：個数調整UI */
                              <div
                                key={item.name}
                                className="rounded-xl border-2 border-[#E07B5A] bg-[#FFF1EC] px-3 py-2.5"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-bold text-[#3A3A3A] leading-tight flex-1 mr-1 truncate">{item.name}</p>
                                  <button
                                    onClick={() => toggle(item)}
                                    className="w-5 h-5 bg-[#E07B5A] rounded-full flex items-center justify-center flex-shrink-0"
                                  >
                                    <Check size={9} className="text-white" strokeWidth={3} />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => updateQty(item.name, item.unit, -1)}
                                    className="w-7 h-7 rounded-lg bg-white border border-[#E8E0D8] font-bold text-sm flex items-center justify-center text-[#3A3A3A]"
                                  >−</button>
                                  <span className="flex-1 text-center text-xs font-bold text-[#E07B5A] tabular-nums">
                                    {qty}{unitLabel}
                                  </span>
                                  <button
                                    onClick={() => updateQty(item.name, item.unit, 1)}
                                    className="w-7 h-7 rounded-lg bg-white border border-[#E8E0D8] font-bold text-sm flex items-center justify-center text-[#3A3A3A]"
                                  >+</button>
                                </div>
                              </div>
                            ) : (
                              /* 未選択：タップで選択 */
                              <button
                                key={item.name}
                                onClick={() => toggle(item)}
                                className="rounded-xl border-2 border-[#E8E0D8] bg-white px-3 py-2.5 text-left hover:border-[#E07B5A]/50 transition-all"
                              >
                                <p className="text-sm font-bold text-[#3A3A3A] leading-tight">{item.name}</p>
                                <p className="text-xs text-[#C4B5A8] mt-0.5">{item.defaultQty}{unitLabel}</p>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* 固定フッター */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-[#E8E0D8] px-4 py-4">
        <div className="max-w-md mx-auto space-y-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-xl h-12 text-base font-medium"
          >
            {saving
              ? '登録中...'
              : selected.size > 0
              ? `${selected.size}品を登録してはじめる`
              : 'スキップしてはじめる'}
            {!saving && <ChevronRight size={18} className="ml-1" />}
          </Button>
          {selected.size === 0 && (
            <p className="text-xs text-center text-[#9B8B7A]">食材は在庫一覧からあとで追加できます</p>
          )}
        </div>
      </div>
    </div>
  )
}
