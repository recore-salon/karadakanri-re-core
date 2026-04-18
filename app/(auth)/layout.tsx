export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* ブランドヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-2xl">🍱</span>
            <span className="text-xs text-[#9B8B7A] font-medium tracking-widest uppercase">Re:Core</span>
          </div>
          <h1 className="text-2xl font-bold text-[#3A3A3A] tracking-tight">
            あるもんメンテナンス
          </h1>
          <p className="text-sm text-[#9B8B7A] mt-1 font-medium">Re:Stock</p>
        </div>
        {children}
      </div>
    </div>
  )
}
