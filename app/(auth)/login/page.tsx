'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('ログインに失敗しました。メールアドレスとパスワードを確認してください。')
    } else {
      router.push('/home')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl">
      <CardContent className="pt-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[#3A3A3A] text-sm">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="rounded-xl border-[#E8E0D8] focus:border-[#E07B5A] bg-[#F8F6F2]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[#3A3A3A] text-sm">パスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="パスワード"
              required
              className="rounded-xl border-[#E8E0D8] focus:border-[#E07B5A] bg-[#F8F6F2]"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E07B5A] hover:bg-[#C96A4A] text-white rounded-xl h-11 font-medium"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center pb-6">
        <p className="text-sm text-[#9B8B7A]">
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" className="text-[#E07B5A] font-medium hover:underline">
            新規登録
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
