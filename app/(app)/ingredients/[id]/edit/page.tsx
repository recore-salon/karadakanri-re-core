import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import IngredientForm from '@/components/ingredients/IngredientForm'
import PageHeader from '@/components/shared/PageHeader'
import type { Ingredient } from '@/types'

export default async function EditIngredientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: ingredient } = await supabase
    .from('ingredients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!ingredient) notFound()

  return (
    <div>
      <PageHeader title="食材を編集" backHref="/ingredients" />
      <div className="px-4 py-4">
        <IngredientForm mode="edit" ingredient={ingredient as Ingredient} />
      </div>
    </div>
  )
}
