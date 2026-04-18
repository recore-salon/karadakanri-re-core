import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Category, Ingredient, MealSuggestion, MealType, Portion, Unit } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Gemini 2.5 Flash（無料枠：5 req/分 / 20 req/日）
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

interface SuggestOptions {
  mealType: MealType
  people: number
  portion: Portion
  ingredients: Ingredient[]
  recentDishes?: string[]   // 直近の提案料理（重複排除用）
  isSnack?: boolean
  focusNearPossible?: boolean  // 追加可能セットモード
}

const MEAL_TYPE_NAMES: Record<MealType, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: 'おつまみ・軽い一品',
}

const PORTION_NAMES: Record<Portion, string> = {
  light: '少なめ（0.8倍）',
  standard: '標準（1.0倍）',
  large: '多め（1.3倍）',
}

export async function getMealSuggestions(options: SuggestOptions): Promise<MealSuggestion[]> {
  const { mealType, people, portion, ingredients, recentDishes = [], isSnack = false, focusNearPossible = false } = options

  // お弁当用タグの食材を除外（スナックモードも除外）
  const availableIngredients = ingredients.filter(i => !i.is_bento && i.quantity > 0)

  const ingredientList = availableIngredients
    .map(i => `${i.name}（${i.quantity}${unitLabel(i.unit)}・${categoryLabel(i.category)}）`)
    .join('\n')

  const recentDishesText = recentDishes.length > 0
    ? `\n【直近の提案料理（重複を避けてください）】\n${recentDishes.join('、')}`
    : ''

  const snackInstructions = isSnack
    ? `
【おつまみモードの制約】
- 調理時間：15分以内
- 品数：1品のみ
- 洗い物：最小限（フライパン1つ、レンジ等）
- 量：軽いつまみ程度（通常の0.5倍）
- お酒に合う一品であること
`
    : ''

  const nearPossibleInstructions = focusNearPossible
    ? `
【追加可能セットモード】
現在の在庫に「あと1〜2品だけ買い足せば作れる」料理を3つ提案してください。
- すでに全食材がそろっている料理は除外
- 不足食材は必ず1〜2品のみ（3品以上不足する料理は提案しない）
- type は必ず "need_shopping"
- missing_ingredients には不足している1〜2品のみ記載
- 買いやすいスーパーで入手可能な一般的な食材を優先
`
    : ''

  const prompt = `あなたは家庭料理の献立提案アシスタントです。
以下の条件と在庫情報を元に、現実的で作りやすい献立を3つ提案してください。

【食事タイプ】${MEAL_TYPE_NAMES[mealType]}
【人数】${people}人
【量の設定】${PORTION_NAMES[portion]}
${snackInstructions}${nearPossibleInstructions}
【在庫食材】
${ingredientList || '（食材が登録されていません）'}
${recentDishesText}

【提案ルール】
- 家庭料理・和食中心・短時間で作れるものを優先
- 在庫食材を優先して使う
- 在庫食材だけで作れる場合は "type": "available"
- 不足食材が1〜2品以内なら "type": "need_shopping"（大きく足りない場合は提案しない）
- 調味料（醤油・みりん・砂糖等）の不足はカウントしない
- 料理名は具体的に（「焼き魚」ではなく「鮭の塩焼き」など）
- descriptionは1〜2文で簡潔に

【食材名の記載ルール（必須）】
- ingredientsのnameには、上記「在庫食材」リストの食材名を一字一句そのままコピーすること
- 例：在庫に「豚こま切れ肉」とあれば "name": "豚こま切れ肉" と書く（「豚肉」「豚こま」などに変えない）
- 在庫にない食材（missing_ingredients）は自由な名前でよい

【出力形式】必ず以下のJSONのみを返してください（他のテキスト不可）：
{
  "suggestions": [
    {
      "dish_name": "料理名",
      "description": "料理の説明（1〜2文）",
      "type": "available" または "need_shopping",
      "ingredients": [
        {
          "name": "食材名",
          "quantity": 数値,
          "unit": "piece/g/kg/ml/L/bottle/bag/pack/can のいずれか",
          "is_available": true または false
        }
      ],
      "missing_ingredients": [
        {
          "name": "不足食材名",
          "quantity": 数値,
          "unit": "unit値"
        }
      ]
    }
  ]
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  // JSONを抽出（Markdownコードブロックが含まれる場合に対応）
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Geminiからの応答をパースできませんでした')
  }

  const parsed = JSON.parse(jsonMatch[0])

  // 在庫食材との紐付け
  return parsed.suggestions.map((s: {
    dish_name: string
    description: string
    type: 'available' | 'need_shopping'
    ingredients: { name: string; quantity: number; unit: Unit; is_available: boolean }[]
    missing_ingredients: { name: string; quantity: number; unit: Unit }[]
  }) => {
    const enrichedIngredients = s.ingredients.map((ing: { name: string; quantity: number; unit: Unit; is_available: boolean }) => {
      const matched = findBestMatch(ing.name, availableIngredients)
      return {
        ...ing,
        ingredient_id: matched?.id,
      }
    })

    return {
      dish_name: s.dish_name,
      description: s.description,
      plan_type: s.type,
      ingredients: enrichedIngredients,
      missing_ingredients: s.missing_ingredients || [],
    } as MealSuggestion
  })
}

export interface NutritionData {
  calories: number  // kcal
  protein: number   // g
  fiber: number     // g
  fat: number       // g
  salt: number      // g
  carbs: number     // g
}

export interface Recipe {
  dish_name: string
  time: string
  servings: string
  ingredients: { name: string; amount: string }[]
  steps: string[]
  tips?: string
  nutrition?: NutritionData  // 1人分の推定栄養素
}

export async function getRecipe(dishName: string): Promise<Recipe> {
  const prompt = `家庭料理「${dishName}」の簡単なレシピを以下のJSONのみで返してください（他のテキスト不可）:
{
  "dish_name": "料理名",
  "time": "調理時間（例: 20分）",
  "servings": "人数（例: 2人分）",
  "ingredients": [
    { "name": "食材名", "amount": "量" }
  ],
  "steps": [
    "手順1",
    "手順2"
  ],
  "tips": "ひとことコツ（任意・1文）",
  "nutrition": {
    "calories": 1人分のカロリー（kcal・整数）,
    "protein": 1人分のたんぱく質（g・小数第1位まで）,
    "fiber": 1人分の食物繊維（g・小数第1位まで）,
    "fat": 1人分の脂質（g・小数第1位まで）,
    "salt": 1人分の食塩相当量（g・小数第1位まで）,
    "carbs": 1人分の糖質（g・小数第1位まで）
  }
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('レシピの取得に失敗しました')
  return JSON.parse(jsonMatch[0])
}

// ─── 食材名マッチング ──────────────────────────────────────────────────────────

/** カタカナ→ひらがな変換・空白除去・小文字化で正規化 */
function normalize(s: string): string {
  return s
    .replace(/\s/g, '')
    .replace(/[\u30A1-\u30F6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .toLowerCase()
}

/**
 * スコア付きマッチング
 * 3: 完全一致
 * 2: 正規化後に完全一致（カタカナ/ひらがな違い等）
 * 1: 正規化後に部分一致（3文字以上の場合のみ）
 * 0: 不一致
 */
function matchScore(ingName: string, stockName: string): number {
  if (ingName === stockName) return 3
  const a = normalize(ingName)
  const b = normalize(stockName)
  if (a === b) return 2
  const minLen = Math.min(a.length, b.length)
  if (minLen >= 2 && (a.includes(b) || b.includes(a))) return 1
  return 0
}

function findBestMatch(ingName: string, stock: Ingredient[]): Ingredient | undefined {
  let best: Ingredient | undefined
  let bestScore = 0
  for (const item of stock) {
    const score = matchScore(ingName, item.name)
    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }
  return bestScore > 0 ? best : undefined
}

function unitLabel(unit: string): string {
  const map: Record<string, string> = {
    piece: '個', g: 'g', kg: 'kg', ml: 'ml', L: 'L',
    bottle: '本', bag: '袋', pack: 'パック', can: '缶',
  }
  return map[unit] ?? unit
}

function categoryLabel(category: Category): string {
  const map: Record<Category, string> = {
    fridge: '冷蔵', freezer: '冷凍', pantry: '常温', seasoning: '調味料',
  }
  return map[category] ?? category
}
