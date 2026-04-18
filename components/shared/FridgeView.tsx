'use client'

import { cn } from '@/lib/utils'
import type { Ingredient } from '@/types'

// ─── 食材名 → 絵文字 ─────────────────────────────────────────────────────────

const EMOJI_MAP: [string, string][] = [
  // 肉類
  ['豚バラ', '🥓'], ['豚こま', '🥩'], ['豚', '🥩'], ['鶏もも', '🍗'], ['鶏むね', '🍗'], ['鶏', '🍗'],
  ['牛', '🥩'], ['ひき肉', '🫙'], ['挽き肉', '🫙'], ['ソーセージ', '🌭'], ['ベーコン', '🥓'],
  // 魚介
  ['鮭', '🐟'], ['サーモン', '🐟'], ['まぐろ', '🐠'], ['たこ', '🐙'], ['えび', '🦐'],
  ['いか', '🦑'], ['あじ', '🐟'], ['さば', '🐟'], ['たら', '🐟'], ['魚', '🐟'],
  // 野菜
  ['玉ねぎ', '🧅'], ['にんじん', '🥕'], ['じゃがいも', '🥔'], ['さつまいも', '🍠'],
  ['キャベツ', '🥬'], ['ほうれん草', '🥬'], ['小松菜', '🥬'], ['レタス', '🥬'],
  ['ブロッコリー', '🥦'], ['トマト', '🍅'], ['ミニトマト', '🍅'], ['ピーマン', '🫑'],
  ['なす', '🍆'], ['きのこ', '🍄'], ['しめじ', '🍄'], ['えのき', '🍄'], ['まいたけ', '🍄'],
  ['にんにく', '🧄'], ['しょうが', '🫚'], ['生姜', '🫚'], ['ねぎ', '🌿'], ['長ねぎ', '🌿'],
  ['大根', '🫛'], ['れんこん', '🫛'], ['ごぼう', '🌿'], ['もやし', '🌱'], ['きゅうり', '🥒'],
  ['アボカド', '🥑'], ['コーン', '🌽'], ['枝豆', '🫛'],
  // 卵・乳製品・豆腐
  ['卵', '🥚'], ['たまご', '🥚'], ['牛乳', '🥛'], ['バター', '🧈'], ['チーズ', '🧀'],
  ['ヨーグルト', '🫙'], ['豆腐', '⬜'], ['油揚げ', '🟨'], ['納豆', '🫘'],
  // 主食
  ['米', '🍚'], ['ご飯', '🍚'], ['パン', '🍞'], ['食パン', '🍞'],
  ['うどん', '🍜'], ['そば', '🍜'], ['そうめん', '🍜'], ['パスタ', '🍝'], ['ラーメン', '🍜'],
  // 缶詰・レトルト
  ['ツナ缶', '🥫'], ['さば缶', '🥫'], ['トマト缶', '🥫'], ['缶', '🥫'],
  ['カレー', '🍛'], ['レトルト', '📦'],
  // 調味料
  ['醤油', '🫗'], ['みりん', '🫗'], ['酒', '🫗'], ['料理酒', '🫗'],
  ['砂糖', '🫙'], ['塩', '🫙'], ['こしょう', '🫙'], ['胡椒', '🫙'],
  ['油', '🫗'], ['ごま油', '🫗'], ['オリーブ油', '🫗'], ['サラダ油', '🫗'],
  ['味噌', '🫙'], ['酢', '🫗'], ['ケチャップ', '🫙'], ['マヨネーズ', '🫙'],
  ['ソース', '🫙'], ['めんつゆ', '🫗'], ['だし', '🫙'], ['鶏がらスープ', '🫙'],
  ['片栗粉', '🫙'], ['小麦粉', '🫙'], ['薄力粉', '🫙'], ['強力粉', '🫙'],
  ['ごま', '🫙'], ['ラー油', '🫗'], ['豆板醤', '🫙'], ['オイスター', '🫙'],
]

function getEmoji(name: string): string {
  for (const [key, emoji] of EMOJI_MAP) {
    if (name.includes(key) || key.includes(name)) return emoji
  }
  return '🍱'
}

// ─── 食材タグ ─────────────────────────────────────────────────────────────────

function IngredientTag({ ingredient, colorClass }: { ingredient: Ingredient; colorClass: string }) {
  const expired = ingredient.expires_at && new Date(ingredient.expires_at) < new Date()
  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium border transition-all',
      colorClass,
      expired && 'opacity-50 line-through',
    )}>
      <span className="text-sm leading-none">{getEmoji(ingredient.name)}</span>
      <span className="leading-none truncate max-w-[4.5rem]">{ingredient.name}</span>
      {ingredient.quantity > 0 && (
        <span className="text-[10px] opacity-60 leading-none flex-shrink-0">{ingredient.quantity}</span>
      )}
    </div>
  )
}

// ─── FridgeView ───────────────────────────────────────────────────────────────

interface FridgeViewProps {
  ingredients: Ingredient[]
}

export default function FridgeView({ ingredients }: FridgeViewProps) {
  const fridge   = ingredients.filter(i => i.category === 'fridge')
  const freezer  = ingredients.filter(i => i.category === 'freezer')
  const pantry   = ingredients.filter(i => i.category === 'pantry')
  const seasoning = ingredients.filter(i => i.category === 'seasoning')

  return (
    <div className="space-y-5 pb-4">

      {/* ── 冷蔵庫 ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-lg">🧊</span>
          <span className="text-sm font-bold text-[#3A3A3A]">冷蔵庫</span>
          <span className="text-xs text-[#9B8B7A]">{fridge.length + freezer.length}品</span>
        </div>

        {/* 冷蔵庫ボディ */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#EEF3F8] to-[#E0EAF4] border-2 border-[#C8D8E8] shadow-inner overflow-hidden">
          {/* ハンドル */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-14 bg-[#B0C4D4] rounded-full z-10" />

          {/* 冷蔵室 */}
          <div className="p-4 pr-8 min-h-[120px]">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">冷蔵</span>
            </div>
            {fridge.length === 0 ? (
              <p className="text-xs text-[#9B8B7A] text-center py-4">食材が登録されていません</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {fridge.map(i => (
                  <IngredientTag key={i.id} ingredient={i} colorClass="bg-white/80 text-blue-800 border-blue-200" />
                ))}
              </div>
            )}
          </div>

          {/* 区切り線 */}
          <div className="mx-3 border-t-2 border-dashed border-[#B8CCE0]" />

          {/* 冷凍室 */}
          <div className="p-4 pr-8 min-h-[80px] bg-gradient-to-b from-[#D8E8F4]/60 to-[#C8D8EC]/60">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">冷凍</span>
            </div>
            {freezer.length === 0 ? (
              <p className="text-xs text-[#9B8B7A] text-center py-2">食材が登録されていません</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {freezer.map(i => (
                  <IngredientTag key={i.id} ingredient={i} colorClass="bg-white/80 text-indigo-800 border-indigo-200" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── キッチン棚（常温） ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-lg">🪵</span>
          <span className="text-sm font-bold text-[#3A3A3A]">キッチン棚</span>
          <span className="text-xs text-[#9B8B7A]">{pantry.length}品</span>
        </div>

        <div className="relative">
          {/* 棚板（背景） */}
          <div className="absolute -bottom-2 left-0 right-0 h-4 bg-[#C8A882] rounded-b-lg shadow-md" />
          <div className="relative bg-gradient-to-b from-[#FFF8EE] to-[#FEF3E2] border-2 border-[#DFC4A0] rounded-2xl rounded-bl-none rounded-br-none p-4 min-h-[90px] shadow-inner">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">常温保存</span>
            </div>
            {pantry.length === 0 ? (
              <p className="text-xs text-[#9B8B7A] text-center py-4">食材が登録されていません</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {pantry.map(i => (
                  <IngredientTag key={i.id} ingredient={i} colorClass="bg-white/90 text-amber-800 border-amber-200" />
                ))}
              </div>
            )}
          </div>
          <div className="h-4" /> {/* 棚板の高さ分 */}
        </div>
      </div>

      {/* ── 調味料ラック ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-lg">🫙</span>
          <span className="text-sm font-bold text-[#3A3A3A]">調味料ラック</span>
          <span className="text-xs text-[#9B8B7A]">{seasoning.length}品</span>
        </div>

        {/* ラック背景 */}
        <div className="bg-gradient-to-b from-[#F5F0EC] to-[#EDE5DC] border-2 border-[#D4C4B4] rounded-2xl p-4 min-h-[80px] shadow-inner">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">調味料</span>
          </div>
          {seasoning.length === 0 ? (
            <p className="text-xs text-[#9B8B7A] text-center py-4">調味料が登録されていません</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {seasoning.map(i => (
                <IngredientTag key={i.id} ingredient={i} colorClass="bg-white/90 text-rose-800 border-rose-200" />
              ))}
            </div>
          )}
          {/* ラック底板 */}
          <div className="mt-3 border-t-2 border-[#C4B4A4]" />
        </div>
      </div>

      {ingredients.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">🏠</p>
          <p className="text-sm text-[#9B8B7A]">食材が登録されていません</p>
          <p className="text-xs text-[#C4B5A8]">在庫を追加すると冷蔵庫に表示されます</p>
        </div>
      )}
    </div>
  )
}
