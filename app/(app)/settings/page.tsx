'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PageHeader from '@/components/shared/PageHeader'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Portion } from '@/types'
import { PORTION_LABELS } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [displayName, setDisplayName] = useState('')
  const [defaultPeople, setDefaultPeople] = useState(2)
  const [defaultPortion, setDefaultPortion] = useState<Portion>('standard')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setEmail(user.email ?? '')

        const res = await fetch('/api/user/settings')
        if (res.ok) {
          const data = await res.json()
          setDisplayName(data.display_name ?? '')
          setDefaultPeople(data.default_people ?? 2)
          setDefaultPortion(data.default_portion ?? 'standard')
        }
      } catch {
        // エラーが発生してもデフォルト値で表示
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName || null,
        default_people: defaultPeople,
        default_portion: defaultPortion,
      }),
    })
    if (res.ok) {
      toast.success('設定を保存しました')
    } else {
      toast.error('保存に失敗しました')
    }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) return <div className="p-8 text-center text-[#9B8B7A] text-sm">読み込み中...</div>

  return (
    <div>
      <PageHeader title="設定" />

      <div className="px-4 py-5 space-y-5">
        {/* アカウント情報 */}
        <section className="bg-white rounded-2xl border border-[#E8E0D8] p-4 space-y-3">
          <p className="text-xs font-bold text-[#9B8B7A] uppercase tracking-wide">アカウント</p>
          <div className="space-y-1.5">
            <Label className="text-sm text-[#3A3A3A]">お名前</Label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="山田 花子"
              className="rounded-xl border-[#E8E0D8] bg-[#F8F6F2] h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-[#3A3A3A]">メールアドレス</Label>
            <Input
              value={email}
              disabled
              className="rounded-xl border-[#E8E0D8] bg-[#F0EDE8] h-10 text-[#9B8B7A]"
            />
          </div>
        </section>

        {/* 献立デフォルト設定 */}
        <section className="bg-white rounded-2xl border border-[#E8E0D8] p-4 space-y-4">
          <p className="text-xs font-bold text-[#9B8B7A] uppercase tracking-wide">献立の初期設定</p>

          <div className="space-y-2">
            <Label className="text-sm text-[#3A3A3A]">デフォルト人数</Label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDefaultPeople(Math.max(1, defaultPeople - 1))}
                className="w-10 h-10 rounded-xl bg-[#F8F6F2] text-[#3A3A3A] font-bold text-lg flex items-center justify-center"
              >
                −
              </button>
              <span className="text-2xl font-bold text-[#3A3A3A] w-8 text-center">{defaultPeople}</span>
              <button
                onClick={() => setDefaultPeople(Math.min(10, defaultPeople + 1))}
                className="w-10 h-10 rounded-xl bg-[#F8F6F2] text-[#3A3A3A] font-bold text-lg flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-[#3A3A3A]">デフォルト量</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'standard', 'large'] as Portion[]).map(p => (
                <button
                  key={p}
                  onClick={() => setDefaultPortion(p)}
                  className={cn(
                    'h-10 rounded-xl border-2 text-sm font-medium transition-all',
                    defaultPortion === p
                      ? 'bg-[#E07B5A] border-[#E07B5A] text-white'
                      : 'bg-white border-[#E8E0D8] text-[#9B8B7A]'
                  )}
                >
                  {PORTION_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* アプリ情報 */}
        <section className="bg-white rounded-2xl border border-[#E8E0D8] p-4 space-y-2">
          <p className="text-xs font-bold text-[#9B8B7A] uppercase tracking-wide">アプリについて</p>
          <div className="space-y-1">
            <p className="text-sm text-[#3A3A3A] font-medium">あるもんメンテナンス Re:Stock</p>
            <p className="text-xs text-[#9B8B7A]">Re:Core 会員サービス</p>
            <p className="text-xs text-[#C4B5A8]">Version 1.0.0</p>
          </div>
        </section>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-xl h-12 text-base font-medium"
        >
          {saving ? '保存中...' : '設定を保存する'}
        </Button>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full text-[#9B8B7A] hover:text-red-500 rounded-xl h-10"
        >
          ログアウト
        </Button>
      </div>
    </div>
  )
}
