import { Toaster } from '@/components/ui/sonner'

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-center" />
    </>
  )
}
