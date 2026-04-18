'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Ingredient, Category, Unit } from '@/types'
import { CATEGORY_LABELS, UNIT_LABELS, UNITS, CATEGORIES } from '@/types'

const schema = z.object({
  name: z.string().min(1, '食材名を入力してください').max(50),
  category: z.enum(['fridge', 'freezer', 'pantry', 'seasoning']),
  quantity: z.preprocess(v => Number(v), z.number().min(0, '0以上で入力してください').max(99999)),
  unit: z.enum(['piece', 'g', 'kg', 'ml', 'L', 'bottle', 'bag', 'pack', 'can']),
  is_bento: z.boolean(),
  expires_at: z.string().optional(),
  memo: z.string().max(200).optional(),
})

type FormValues = {
  name: string
  category: 'fridge' | 'freezer' | 'pantry' | 'seasoning'
  quantity: number
  unit: 'piece' | 'g' | 'kg' | 'ml' | 'L' | 'bottle' | 'bag' | 'pack' | 'can'
  is_bento: boolean
  expires_at?: string
  memo?: string
}

interface Props {
  mode: 'create' | 'edit'
  ingredient?: Ingredient
}

const CATEGORY_COLORS: Record<Category, string> = {
  fridge: 'bg-blue-50 border-blue-200 text-blue-700 data-[selected=true]:bg-blue-500 data-[selected=true]:text-white',
  freezer: 'bg-indigo-50 border-indigo-200 text-indigo-700 data-[selected=true]:bg-indigo-500 data-[selected=true]:text-white',
  pantry: 'bg-amber-50 border-amber-200 text-amber-700 data-[selected=true]:bg-amber-500 data-[selected=true]:text-white',
  seasoning: 'bg-rose-50 border-rose-200 text-rose-700 data-[selected=true]:bg-rose-500 data-[selected=true]:text-white',
}

export default function IngredientForm({ mode, ingredient }: Props) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<{ name: string; category: Category; unit: Unit }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues, any, FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: ingredient?.name ?? '',
      category: ingredient?.category ?? 'fridge',
      quantity: ingredient?.quantity ?? 1,
      unit: ingredient?.unit ?? 'piece',
      is_bento: ingredient?.is_bento ?? false,
      expires_at: ingredient?.expires_at ?? '',
      memo: ingredient?.memo ?? '',
    },
  })

  const name = watch('name')
  const category = watch('category')
  const unit = watch('unit')
  const isBento = watch('is_bento')

  useEffect(() => {
    if (!name || name.length < 1) {
      setSuggestions([])
      return
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/ingredients/suggest?q=${encodeURIComponent(name)}`)
      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
      setShowSuggestions(true)
    }, 200)
    return () => clearTimeout(t)
  }, [name])

  function applySuggestion(s: { name: string; category: Category; unit: Unit }) {
    setValue('name', s.name)
    setValue('category', s.category)
    setValue('unit', s.unit)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const payload = {
      ...values,
      expires_at: values.expires_at || null,
      memo: values.memo || null,
    }

    let res: Response
    if (mode === 'create') {
      res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      res = await fetch(`/api/ingredients/${ingredient!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    if (res.ok) {
      toast.success(mode === 'create' ? '食材を登録しました' : '食材を更新しました')
      router.push('/ingredients')
      router.refresh()
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'エラーが発生しました')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* 食材名 */}
      <div className="space-y-1.5 relative">
        <Label className="text-sm text-[#3A3A3A] font-medium">食材名 <span className="text-red-400">*</span></Label>
        <Input
          {...register('name')}
          ref={e => {
            register('name').ref(e)
            nameRef.current = e
          }}
          placeholder="例：鶏むね肉"
          autoComplete="off"
          className="rounded-xl border-[#E8E0D8] bg-white h-11"
          onFocus={() => name && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}

        {/* サジェスト */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-[#E8E0D8] rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
            {suggestions.map(s => (
              <button
                key={s.name}
                type="button"
                onMouseDown={() => applySuggestion(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-[#F8F6F2] flex items-center justify-between text-sm"
              >
                <span className="text-[#3A3A3A]">{s.name}</span>
                <span className="text-xs text-[#9B8B7A]">{CATEGORY_LABELS[s.category]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 保管場所 */}
      <div className="space-y-1.5">
        <Label className="text-sm text-[#3A3A3A] font-medium">保管場所 <span className="text-red-400">*</span></Label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              data-selected={category === cat}
              onClick={() => setValue('category', cat)}
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

      {/* 数量・単位 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm text-[#3A3A3A] font-medium">数量 <span className="text-red-400">*</span></Label>
          <Input
            {...register('quantity')}
            type="number"
            min="0"
            step="0.1"
            className="rounded-xl border-[#E8E0D8] bg-white h-11 text-center text-lg font-bold"
          />
          {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm text-[#3A3A3A] font-medium">単位</Label>
          <div className="flex flex-wrap gap-1.5">
            {UNITS.map(u => (
              <button
                key={u}
                type="button"
                onClick={() => setValue('unit', u)}
                className={cn(
                  'px-2.5 py-1 rounded-lg border text-xs font-medium transition-all',
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
      </div>

      {/* お弁当用タグ */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E8E0D8] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[#3A3A3A]">お弁当用タグ</p>
          <p className="text-xs text-[#9B8B7A]">通常の献立提案では使いません</p>
        </div>
        <button
          type="button"
          onClick={() => setValue('is_bento', !isBento)}
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

      {/* 消費期限（任意） */}
      <div className="space-y-1.5">
        <Label className="text-sm text-[#3A3A3A] font-medium">
          消費期限 <span className="text-xs text-[#9B8B7A] font-normal">（任意）</span>
        </Label>
        <Input
          {...register('expires_at')}
          type="date"
          className="rounded-xl border-[#E8E0D8] bg-white h-11"
        />
      </div>

      {/* メモ（任意） */}
      <div className="space-y-1.5">
        <Label className="text-sm text-[#3A3A3A] font-medium">
          メモ <span className="text-xs text-[#9B8B7A] font-normal">（任意）</span>
        </Label>
        <Textarea
          {...register('memo')}
          placeholder="メモ（200文字以内）"
          rows={2}
          className="rounded-xl border-[#E8E0D8] bg-white resize-none text-sm"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-xl h-12 text-base font-medium mt-2"
      >
        {isSubmitting ? '保存中...' : mode === 'create' ? '食材を登録する' : '変更を保存する'}
      </Button>
    </form>
  )
}
