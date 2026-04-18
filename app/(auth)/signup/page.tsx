'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('パスワードは8文字以上で入力してください')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      toast.error('登録に失敗しました: ' + error.message)
    } else if (data.user) {
      // user_settings を作成
      await supabase.from('user_settings').insert({
        user_id: data.user.id,
        display_name: name || null,
      })
      setDone(true)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <Card className="border-0 shadow-sm bg-white rounded-2xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-lg font-bold text-[#3A3A3A] mb-2">確認メールを送りました</h2>
          <p className="text-sm text-[#9B8B7A] leading-relaxed">
            {email} 宛に確認メールを送りました。<br />
            メール内のリンクをクリックして登録を完了してください。
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[#3A3A3A] text-sm">お名前（任意）</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="山田 花子"
              className="rounded-xl border-[#E8E0D8] bg-[#F8F6F2]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[#3A3A3A] text-sm">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="rounded-xl border-[#E8E0D8] bg-[#F8F6F2]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[#3A3A3A] text-sm">パスワード（8文字以上）</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="パスワード"
              required
              className="rounded-xl border-[#E8E0D8] bg-[#F8F6F2]"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-xl h-11 font-medium"
          >
            {loading ? '登録中...' : '新規登録'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center pb-6">
        <p className="text-sm text-[#9B8B7A]">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-[#E07B5A] font-medium hover:underline">
            ログイン
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
