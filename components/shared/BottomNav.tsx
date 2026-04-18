'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, ChefHat, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home', icon: Home, label: 'ホーム' },
  { href: '/ingredients', icon: Package, label: '在庫' },
  { href: '/meal-plans', icon: ChefHat, label: '献立' },
  { href: '/settings', icon: Settings, label: '設定' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E0D8] z-50">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors',
                isActive ? 'text-[#E07B5A]' : 'text-[#9B8B7A]'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn('text-xs', isActive ? 'font-semibold' : 'font-normal')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
