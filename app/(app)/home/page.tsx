import { createClient } from '@/lib/supabase/server'
import { getTodayStr, formatDate, getExpiryStatus } from '@/lib/utils'
import { redirect } from 'next/navigation'
import HomeClient from './HomeClient'
import type { MealPlan, UserSettings } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const today = getTodayStr()

  const [
    { data: todayPlans },
    { data: ingredientsData },
    { data: settings },
    { count: ingredientCount },
  ] = await Promise.all([
    supabase
      .from('meal_plans')
      .select('*, meal_plan_ingredients(*)')
      .eq('user_id', user!.id)
      .eq('plan_date', today)
      .order('created_at'),
    supabase
      .from('ingredients')
      .select('id, name, category, quantity, expires_at')
      .eq('user_id', user!.id)
      .gt('quantity', 0),
    supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
  ])

  // 食材が一度も登録されていない初回ユーザー → オンボーディングへ
  if ((ingredientCount ?? 0) === 0) {
    redirect('/onboarding')
  }

  const stockSummary = {
    fridge: ingredientsData?.filter(i => i.category === 'fridge').length ?? 0,
    freezer: ingredientsData?.filter(i => i.category === 'freezer').length ?? 0,
    pantry: ingredientsData?.filter(i => i.category === 'pantry').length ?? 0,
    seasoning: ingredientsData?.filter(i => i.category === 'seasoning').length ?? 0,
    total: ingredientsData?.length ?? 0,
  }

  const expiryAlerts = (ingredientsData ?? [])
    .filter(i => {
      const s = getExpiryStatus(i.expires_at)
      return s === 'expired' || s === 'soon'
    })
    .map(i => i.name)

  const defaultSettings: UserSettings = settings ?? {
    id: '',
    user_id: user!.id,
    display_name: null,
    default_people: 2,
    default_portion: 'standard',
    created_at: '',
    updated_at: '',
  }

  return (
    <HomeClient
      todayPlans={(todayPlans ?? []) as MealPlan[]}
      stockSummary={stockSummary}
      settings={defaultSettings}
      todayLabel={formatDate(today)}
      todayStr={today}
      expiryAlerts={expiryAlerts}
    />
  )
}
