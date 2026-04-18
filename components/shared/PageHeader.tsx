'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  backHref?: string
  right?: React.ReactNode
}

export default function PageHeader({ title, backHref, right }: PageHeaderProps) {
  const router = useRouter()

  function handleBack() {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-[#F8F6F2]/90 backdrop-blur-sm border-b border-[#E8E0D8]">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={handleBack} className="text-[#9B8B7A] hover:text-[#3A3A3A] p-1 -ml-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-[#3A3A3A] truncate">{title}</h1>
        </div>
        {right && <div>{right}</div>}
      </div>
    </header>
  )
}
