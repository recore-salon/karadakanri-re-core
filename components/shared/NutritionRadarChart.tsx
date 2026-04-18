'use client'

import { useMemo } from 'react'

// ─── 型定義 ───────────────────────────────────────────────────────────────────

export type NutritionData = {
  calories: number  // kcal
  protein: number   // g
  fiber: number     // g
  fat: number       // g
  salt: number      // g
  carbs: number     // g
}

// ─── 軸定義（上から時計回り） ─────────────────────────────────────────────────

const AXES = [
  { key: 'calories' as const, label: 'カロリー',   unit: 'kcal', max: 800 },
  { key: 'protein'  as const, label: 'たんぱく質', unit: 'g',    max: 40  },
  { key: 'fiber'    as const, label: '食物繊維',   unit: 'g',    max: 15  },
  { key: 'fat'      as const, label: '脂質',       unit: 'g',    max: 40  },
  { key: 'salt'     as const, label: '食塩相当量', unit: 'g',    max: 3   },
  { key: 'carbs'    as const, label: '糖質',       unit: 'g',    max: 100 },
] as const

const N = 6
const LEVELS = [0.25, 0.5, 0.75, 1.0]

// ─── SVG ユーティリティ ───────────────────────────────────────────────────────

function axisAngle(i: number): number {
  return (2 * Math.PI * i) / N - Math.PI / 2
}

function toXY(i: number, radius: number, cx: number, cy: number): [number, number] {
  return [
    cx + radius * Math.cos(axisAngle(i)),
    cy + radius * Math.sin(axisAngle(i)),
  ]
}

function toPolygonPts(ratios: number[], cx: number, cy: number, r: number): string {
  return ratios.map((v, i) => {
    const [x, y] = toXY(i, r * Math.min(v, 1.2), cx, cy)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function toHexPts(level: number, cx: number, cy: number, r: number): string {
  return Array.from({ length: N }, (_, i) => {
    const [x, y] = toXY(i, r * level, cx, cy)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

// ─── コンポーネント ───────────────────────────────────────────────────────────

interface Props {
  ideal: NutritionData
  recipe: NutritionData
}

export default function NutritionRadarChart({ ideal, recipe }: Props) {
  const W = 320
  const H = 305
  const cx = 160
  const cy = 150
  const r = 87
  const labelR = r + 24

  const idealRatios  = useMemo(() => AXES.map(a => ideal[a.key]  / a.max), [ideal])
  const recipeRatios = useMemo(() => AXES.map(a => recipe[a.key] / a.max), [recipe])

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[320px]"
      >
        {/* 外枠塗り */}
        <polygon points={toHexPts(1, cx, cy, r)} fill="#F8F6F2" />

        {/* グリッド六角形 */}
        {LEVELS.map(lv => (
          <polygon
            key={lv}
            points={toHexPts(lv, cx, cy, r)}
            fill="none"
            stroke={lv === 1.0 ? '#D4C8BC' : '#E8E0D8'}
            strokeWidth={lv === 1.0 ? 1.5 : 1}
          />
        ))}

        {/* 軸線 */}
        {AXES.map((_, i) => {
          const [x, y] = toXY(i, r, cx, cy)
          return (
            <line key={i} x1={cx} y1={cy} x2={x} y2={y}
              stroke="#DDD5CC" strokeWidth="1" />
          )
        })}

        {/* グリッドレベルラベル（50%・100%） */}
        {[0.5, 1.0].map(lv => {
          // 右上軸（i=1）の内側に表示
          const [gx, gy] = toXY(1, r * lv - 4, cx, cy)
          return (
            <text key={lv} x={gx} y={gy + 1} fontSize="7" fill="#C4B5A8" textAnchor="start">
              {Math.round(lv * 100)}%
            </text>
          )
        })}

        {/* 理想値ポリゴン（青・破線） */}
        <polygon
          points={toPolygonPts(idealRatios, cx, cy, r)}
          fill="rgba(99,179,237,0.14)"
          stroke="#63B3ED"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          strokeLinejoin="round"
        />

        {/* レシピポリゴン（オレンジ・実線） */}
        <polygon
          points={toPolygonPts(recipeRatios, cx, cy, r)}
          fill="rgba(224,123,90,0.2)"
          stroke="#E07B5A"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* レシピ頂点ドット */}
        {recipeRatios.map((v, i) => {
          const [x, y] = toXY(i, r * Math.min(v, 1.2), cx, cy)
          return <circle key={i} cx={x} cy={y} r="3" fill="#E07B5A" />
        })}

        {/* 軸ラベル（食材名 + 実測値） */}
        {AXES.map((axis, i) => {
          const [lx, ly] = toXY(i, labelR, cx, cy)
          const cosA = Math.cos(axisAngle(i))
          const sinA = Math.sin(axisAngle(i))
          const anchor = cosA > 0.25 ? 'start' : cosA < -0.25 ? 'end' : 'middle'
          const dy = sinA < -0.4 ? -5 : sinA > 0.4 ? 5 : 0
          const val = recipe[axis.key]
          const formatted = axis.key === 'salt'
            ? val.toFixed(1)
            : Math.round(val).toString()

          return (
            <g key={i}>
              <text
                x={lx} y={ly + dy}
                textAnchor={anchor}
                fontSize="9.5"
                fontWeight="700"
                fill="#3A3A3A"
              >
                {axis.label}
              </text>
              <text
                x={lx} y={ly + dy + 12}
                textAnchor={anchor}
                fontSize="8.5"
                fill="#E07B5A"
              >
                {formatted}{axis.unit}
              </text>
            </g>
          )
        })}
      </svg>

      {/* 凡例 */}
      <div className="flex items-center gap-6 text-[11px] text-[#9B8B7A]">
        <div className="flex items-center gap-1.5">
          <svg width="22" height="10" viewBox="0 0 22 10">
            <line x1="1" y1="5" x2="21" y2="5"
              stroke="#63B3ED" strokeWidth="1.5" strokeDasharray="5 3" />
          </svg>
          <span>理想値（1食分）</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="22" height="10" viewBox="0 0 22 10">
            <line x1="1" y1="5" x2="21" y2="5"
              stroke="#E07B5A" strokeWidth="2" />
            <circle cx="11" cy="5" r="2.5" fill="#E07B5A" />
          </svg>
          <span>このレシピ</span>
        </div>
      </div>

      {/* 数値一覧テーブル */}
      <div className="w-full mt-1 rounded-xl border border-[#E8E0D8] overflow-hidden text-xs">
        <div className="grid grid-cols-3 bg-[#F8F6F2] px-3 py-1.5 text-[#9B8B7A] font-medium text-[10px]">
          <span>栄養素</span>
          <span className="text-center text-[#E07B5A]">レシピ</span>
          <span className="text-center text-[#63B3ED]">理想値</span>
        </div>
        {AXES.map(axis => {
          const rv = recipe[axis.key]
          const iv = ideal[axis.key]
          const ratio = iv > 0 ? rv / iv : 0
          const over = ratio > 1.2
          const under = ratio < 0.6
          return (
            <div key={axis.key}
              className="grid grid-cols-3 px-3 py-2 border-t border-[#F0EDE8] items-center">
              <span className="text-[#3A3A3A] font-medium">{axis.label}</span>
              <span className={`text-center font-bold ${over ? 'text-red-500' : under ? 'text-blue-400' : 'text-[#E07B5A]'}`}>
                {axis.key === 'salt' ? rv.toFixed(1) : Math.round(rv)}{axis.unit}
              </span>
              <span className="text-center text-[#9B8B7A]">
                {axis.key === 'salt' ? iv.toFixed(1) : Math.round(iv)}{axis.unit}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-[#C4B5A8] self-start">※ 栄養素は1人分の推定値です</p>
    </div>
  )
}
