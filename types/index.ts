// =====================================================
// Re:Stock 型定義
// =====================================================

export type Category = 'fridge' | 'freezer' | 'pantry' | 'seasoning'
export type Unit = 'piece' | 'g' | 'kg' | 'ml' | 'L' | 'bottle' | 'bag' | 'pack' | 'can'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Portion = 'light' | 'standard' | 'large'
export type PlanType = 'available' | 'need_shopping'

// ラベルマッピング
export const CATEGORY_LABELS: Record<Category, string> = {
  fridge: '冷蔵',
  freezer: '冷凍',
  pantry: '常温',
  seasoning: '調味料',
}

export const UNIT_LABELS: Record<Unit, string> = {
  piece: '個',
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  L: 'L',
  bottle: '本',
  bag: '袋',
  pack: 'パック',
  can: '缶',
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: 'おつまみ',
}

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍺',
}

export const PORTION_LABELS: Record<Portion, string> = {
  light: '少なめ',
  standard: '標準',
  large: '多め',
}

export const PORTION_MULTIPLIERS: Record<Portion, number> = {
  light: 0.8,
  standard: 1.0,
  large: 1.3,
}

export const UNITS: Unit[] = ['piece', 'g', 'kg', 'ml', 'L', 'bottle', 'bag', 'pack', 'can']
export const CATEGORIES: Category[] = ['fridge', 'freezer', 'pantry', 'seasoning']

// =====================================================
// DB モデル型
// =====================================================

export interface UserSettings {
  id: string
  user_id: string
  display_name: string | null
  default_people: number
  default_portion: Portion
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  user_id: string
  name: string
  category: Category
  quantity: number
  unit: Unit
  is_bento: boolean
  expires_at: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface MealPlan {
  id: string
  user_id: string
  plan_date: string
  meal_type: MealType
  dish_name: string
  description: string | null
  people: number
  portion: Portion
  plan_type: PlanType
  is_cooked: boolean
  cooked_at: string | null
  created_at: string
  meal_plan_ingredients?: MealPlanIngredient[]
}

export interface MealPlanIngredient {
  id: string
  meal_plan_id: string
  ingredient_id: string | null
  ingredient_name: string
  required_quantity: number
  unit: Unit
  is_available: boolean
}

export interface StockTransaction {
  id: string
  user_id: string
  ingredient_id: string | null
  ingredient_name: string
  meal_plan_id: string | null
  transaction_group_id: string
  delta: number
  unit: Unit
  note: string | null
  created_at: string
}

export interface CommonIngredient {
  id: string
  name: string
  category: Category
  unit: Unit
  sort_order: number
}

// =====================================================
// API レスポンス型
// =====================================================

export interface ApiError {
  error: string
  details?: string
}

export interface MealSuggestion {
  dish_name: string
  description: string
  plan_type: PlanType
  ingredients: {
    name: string
    quantity: number
    unit: Unit
    is_available: boolean
    ingredient_id?: string
  }[]
  missing_ingredients: {
    name: string
    quantity: number
    unit: Unit
  }[]
}

export interface MealSuggestionsResponse {
  suggestions: MealSuggestion[]
}

export interface DeductResponse {
  success: boolean
  transaction_group_id: string
  updated_ingredients: { id: string; name: string; new_quantity: number }[]
}
