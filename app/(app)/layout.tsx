export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/shared/BottomNav'
import { Toaster } from '@/components/ui/sonner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      <main className="pb-20 max-w-md mx-auto">
        {children}
      </main>
      <BottomNav />
      <Toaster position="bottom-center" richColors />
    </div>
  )
}
