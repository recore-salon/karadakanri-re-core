import Link from 'next/link'
import { Check, ChefHat, Package, RefreshCw, ShoppingCart, Beer, ArrowRight, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#3A3A3A]">
      {/* ───── ヘッダー ───── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E8E0D8]">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍱</span>
            <div>
              <span className="text-xs text-[#9B8B7A] font-medium tracking-widest block leading-none">Re:Core</span>
              <span className="text-base font-bold text-[#3A3A3A] leading-none">Re:Stock</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-[#9B8B7A] hover:text-[#3A3A3A] px-3 py-1.5 transition-colors">
              ログイン
            </Link>
            <Link href="/signup" className="bg-[#E07B5A] hover:bg-[#C96A4A] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="bg-gradient-to-b from-[#FFF8F5] to-white pt-16 pb-20 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-[#FFF1EC] text-[#E07B5A] text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <Star size={11} fill="currentColor" /> Re:Core 会員向け無料サービス
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-[#3A3A3A] leading-tight tracking-tight mb-5">
            家にあるもので、<br />
            <span className="text-[#E07B5A]">今日のごはん</span>を決める。
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E52] leading-relaxed mb-8 max-w-xl mx-auto">
            食材を登録するだけで、朝・昼・晩の献立をAIが提案。<br className="hidden sm:block"/>
            作った分だけ在庫が減るから、管理が自然と続きます。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-[#E07B5A] hover:bg-[#C96A4A] text-white text-base font-bold px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-[#E07B5A]/25"
            >
              無料で始める <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-[#E8E0D8] hover:border-[#E07B5A] text-[#3A3A3A] text-base font-medium px-8 py-4 rounded-2xl transition-colors"
            >
              ログイン
            </Link>
          </div>

          <p className="text-xs text-[#9B8B7A] mt-4">クレジットカード不要・登録1分</p>
        </div>

        {/* アプリモックアップ */}
        <div className="max-w-sm mx-auto mt-12">
          <AppMockup />
        </div>
      </section>

      {/* ───── こんな経験ありませんか？ ───── */}
      <section className="bg-[#F8F6F2] py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#3A3A3A] mb-10">
            こんな経験、ありませんか？
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { emoji: '🤔', text: '毎日「今日なにを作ろう」と悩んでいる' },
              { emoji: '😅', text: '冷蔵庫に何があるか分からないまま買い物した' },
              { emoji: '😩', text: '「あると思ったのになかった」でメニューが崩れた' },
              { emoji: '🗑', text: '賞味期限に気づかず食材を無駄にしてしまった' },
              { emoji: '📋', text: '在庫管理アプリを使ったけど3日で挫折した' },
              { emoji: '😓', text: '同じ調味料を二重購入していた' },
            ].map(({ emoji, text }) => (
              <div key={text} className="bg-white rounded-2xl border border-[#E8E0D8] px-4 py-3 flex items-center gap-3">
                <span className="text-xl flex-shrink-0">{emoji}</span>
                <p className="text-sm text-[#3A3A3A]">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[#E07B5A] font-bold text-base mt-8">
            Re:Stock が、そのすべてを解決します。
          </p>
        </div>
      </section>

      {/* ───── 機能紹介 ───── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-[#E07B5A] text-center tracking-widest uppercase mb-3">Features</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#3A3A3A] mb-14">
            使いやすさを、とことん追求しました
          </h2>

          <div className="space-y-16">
            {/* Feature 1 */}
            <FeatureRow
              icon={<ChefHat size={28} className="text-[#E07B5A]" />}
              color="bg-[#FFF1EC]"
              badge="AI献立提案"
              title="「今日、何作ろう」から解放される"
              description="在庫食材を優先しながら、朝・昼・晩の献立をAIが提案。家にある材料だけで作れるメニューと、少し買い足せば作れるメニューの両方が一目でわかります。"
              points={['人数・量（少なめ/標準/多め）を設定するだけ', 'お弁当用食材は通常提案から自動で除外', '気に入らなければ再提案がすぐできる']}
              imageSide="right"
              mockup={<MealMockup />}
            />

            {/* Feature 2 */}
            <FeatureRow
              icon={<Package size={28} className="text-[#7BC4A8]" />}
              color="bg-[#EDF7F4]"
              badge="在庫管理"
              title="家の食材が、いつでも一目でわかる"
              description="冷蔵・冷凍・常温・調味料を分けて管理。よく使う食材はサジェストから選ぶだけで、入力はあっという間。+/-ボタンで数量もすぐ調整できます。"
              points={['60品以上の食材サジェスト搭載', '+/-ボタンでその場で数量を更新', '期限間近・期限切れは自動でアラート表示']}
              imageSide="left"
              mockup={<StockMockup />}
            />

            {/* Feature 3 */}
            <FeatureRow
              icon={<RefreshCw size={28} className="text-[#E07B5A]" />}
              color="bg-[#FFF1EC]"
              badge="自動在庫減算"
              title="作った分だけ在庫が減る。だから続く"
              description="「作った」ボタンを1回押すだけで、使った食材が自動で減算されます。ミスしても5秒以内に取り消せるから安心。在庫管理が「頑張る作業」じゃなくなります。"
              points={['献立の「作った」1タップで一括減算', 'トーストから即取り消し可能', '手動で食材を選んで「使った」記録もOK']}
              imageSide="right"
              mockup={<CookMockup />}
            />

            {/* Feature 4 */}
            <FeatureRow
              icon={<Beer size={28} className="text-[#7BC4A8]" />}
              color="bg-[#EDF7F4]"
              badge="おつまみモード"
              title="今夜の一品、15分で決まる"
              description="朝昼晩の献立とは別に、「おつまみモード」で夜の一品をサクッと提案。短時間・一品・洗い物少なめを条件に、家にある食材で作れる軽い料理を教えてくれます。"
              points={['15分以内・一品・洗い物少なめが条件', '少し買い足せば作れる提案も表示', 'もちろん「作った」で在庫に反映']}
              imageSide="left"
              mockup={<SnackMockup />}
            />
          </div>
        </div>
      </section>

      {/* ───── 使い方 3ステップ ───── */}
      <section className="bg-[#F8F6F2] py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-[#E07B5A] text-center tracking-widest uppercase mb-3">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#3A3A3A] mb-12">
            たった3ステップで始まる
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: '📋',
                title: '食材を登録する',
                desc: '初回はよく使う食材を選ぶだけ。あとから追加・編集も自由にできます。',
              },
              {
                step: '02',
                icon: '✨',
                title: '献立を提案してもらう',
                desc: '人数と量を選んでタップするだけ。AIが今日の朝・昼・晩を提案します。',
              },
              {
                step: '03',
                icon: '✅',
                title: '作ったら記録する',
                desc: '「作った」を押すだけで在庫が自動更新。これだけで管理が回ります。',
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl border border-[#E8E0D8] p-5 text-center">
                <div className="text-3xl mb-3">{icon}</div>
                <div className="text-xs font-bold text-[#E07B5A] mb-1">STEP {step}</div>
                <h3 className="text-sm font-bold text-[#3A3A3A] mb-2">{title}</h3>
                <p className="text-xs text-[#9B8B7A] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Re:Core ブランド ───── */}
      <section className="bg-white py-16 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl">🍱</span>
            <div className="text-left">
              <span className="text-xs text-[#9B8B7A] font-medium tracking-widest block">からだメンテナンス</span>
              <span className="text-lg font-bold text-[#3A3A3A]">Re:Core</span>
            </div>
          </div>
          <div className="w-12 h-0.5 bg-[#E8E0D8] mx-auto mb-5" />
          <h2 className="text-xl font-bold text-[#3A3A3A] mb-3">
            Re:Core 会員サービスとして<br />安心・安全に使えます
          </h2>
          <p className="text-sm text-[#6B5E52] leading-relaxed mb-6">
            Re:Stockは、からだメンテナンス Re:Coreが会員向けに提供する<br className="hidden sm:block"/>
            生活サポートサービスです。<br />
            セキュアな認証と暗号化通信で、大切なデータをしっかり守ります。
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            {[
              { icon: '🔒', label: '暗号化通信' },
              { icon: '🛡', label: 'セキュア認証' },
              { icon: '🗑', label: 'データ削除可能' },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-[#F8F6F2] rounded-xl py-3 text-center">
                <div className="text-xl mb-1">{icon}</div>
                <p className="text-xs text-[#9B8B7A] font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 最終CTA ───── */}
      <section className="bg-gradient-to-br from-[#E07B5A] to-[#C96A4A] py-20 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-4">🍽</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            今日の献立、もう悩まない。
          </h2>
          <p className="text-white/80 text-base mb-8 leading-relaxed">
            家にある食材から献立が決まる。<br />
            在庫管理が自然に続く。<br />
            Re:Stockで、毎日の食事をもっとラクに。
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#E07B5A] font-bold text-base px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
          >
            無料で始める <ArrowRight size={18} />
          </Link>
          <p className="text-white/60 text-xs mt-4">登録無料・クレジットカード不要・いつでも退会できます</p>
        </div>
      </section>

      {/* ───── フッター ───── */}
      <footer className="bg-[#3A3A3A] text-white py-10 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🍱</span>
                <div>
                  <span className="text-xs text-white/50 font-medium tracking-widest block">Re:Core</span>
                  <span className="text-base font-bold">Re:Stock</span>
                </div>
              </div>
              <p className="text-xs text-white/40">家にあるもので、今日のごはんを決める</p>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">ログイン</Link>
              <Link href="/signup" className="text-sm text-white/60 hover:text-white transition-colors">新規登録</Link>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6">
            <p className="text-xs text-white/30 text-center">© 2025 からだメンテナンス Re:Core. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Feature Row ───────────────────────────────────────────────────────────────

function FeatureRow({
  icon, color, badge, title, description, points, imageSide, mockup,
}: {
  icon: React.ReactNode
  color: string
  badge: string
  title: string
  description: string
  points: string[]
  imageSide: 'left' | 'right'
  mockup: React.ReactNode
}) {
  const textContent = (
    <div className="flex-1 flex flex-col justify-center">
      <div className={`inline-flex items-center gap-2 ${color} rounded-xl px-3 py-1.5 w-fit mb-4`}>
        {icon}
        <span className="text-xs font-bold text-[#3A3A3A]">{badge}</span>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-[#3A3A3A] mb-3 leading-tight">{title}</h3>
      <p className="text-sm text-[#6B5E52] leading-relaxed mb-5">{description}</p>
      <ul className="space-y-2">
        {points.map(point => (
          <li key={point} className="flex items-start gap-2 text-sm text-[#3A3A3A]">
            <Check size={15} className="text-[#7BC4A8] flex-shrink-0 mt-0.5" strokeWidth={3} />
            {point}
          </li>
        ))}
      </ul>
    </div>
  )

  const imageContent = (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-[240px]">{mockup}</div>
    </div>
  )

  return (
    <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-center">
      {imageSide === 'left' ? (
        <><div className="sm:hidden w-full">{textContent}</div>{imageContent}{textContent}</>
      ) : (
        <>{textContent}{imageContent}</>
      )}
    </div>
  )
}

// ─── Phone Mockups ─────────────────────────────────────────────────────────────

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-[#3A3A3A] rounded-[32px] p-3 shadow-2xl shadow-black/20">
      <div className="bg-[#F8F6F2] rounded-[22px] overflow-hidden">
        {/* ノッチ */}
        <div className="bg-[#3A3A3A] h-5 flex items-center justify-center">
          <div className="w-16 h-2.5 bg-[#2A2A2A] rounded-full" />
        </div>
        <div className="p-3 space-y-2">
          {children}
        </div>
      </div>
    </div>
  )
}

function AppMockup() {
  return (
    <PhoneFrame>
      {/* ヘッダー */}
      <div className="bg-white rounded-xl p-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#9B8B7A]">Re:Core</p>
          <p className="text-sm font-bold text-[#3A3A3A]">Re:Stock</p>
        </div>
        <div className="w-7 h-7 rounded-full bg-[#F8F6F2] flex items-center justify-center text-xs text-[#9B8B7A] font-bold">設</div>
      </div>
      {/* 挨拶 */}
      <div className="px-1">
        <p className="text-xs text-[#9B8B7A]">おはようございます · 4月17日(木)</p>
        <p className="text-xs font-bold text-[#3A3A3A] mt-0.5">家に18品あります。今日の献立を考えましょう！</p>
      </div>
      {/* 献立カード */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { icon: '🌅', label: '朝食', dish: '目玉焼きトースト', cooked: true },
          { icon: '☀️', label: '昼食', dish: '豚こまチャーハン', cooked: false },
          { icon: '🌙', label: '夕食', dish: '鶏むね肉の...' , cooked: false },
        ].map(({ icon, label, dish, cooked }) => (
          <div key={label} className={`rounded-xl p-2 ${cooked ? 'bg-[#EDF7F4] border border-[#7BC4A8]/40' : 'bg-white border border-[#E8E0D8]'}`}>
            <div className="text-base mb-1">{icon}</div>
            <p className="text-xs text-[#9B8B7A] leading-none mb-1">{label}</p>
            <p className="text-xs font-bold text-[#3A3A3A] leading-tight">{dish}</p>
            {cooked
              ? <p className="text-xs text-[#7BC4A8] mt-1">✓ 完了</p>
              : <div className="mt-1.5 bg-[#E07B5A] rounded-md py-0.5 text-center"><p className="text-xs text-white font-bold">作った</p></div>
            }
          </div>
        ))}
      </div>
      {/* クイックアクション */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-white rounded-xl p-2 flex items-center gap-2 border border-[#E8E0D8]">
          <div className="w-6 h-6 rounded-lg bg-[#FFF1EC] flex items-center justify-center text-xs">＋</div>
          <p className="text-xs font-bold text-[#3A3A3A]">食材を追加</p>
        </div>
        <div className="bg-white rounded-xl p-2 flex items-center gap-2 border border-[#E8E0D8]">
          <div className="w-6 h-6 rounded-lg bg-[#EDF7F4] flex items-center justify-center text-xs">🍺</div>
          <p className="text-xs font-bold text-[#3A3A3A]">おつまみ</p>
        </div>
      </div>
    </PhoneFrame>
  )
}

function MealMockup() {
  return (
    <PhoneFrame>
      <div className="bg-white rounded-xl p-2.5">
        <p className="text-xs font-bold text-[#3A3A3A] mb-2">今日の夕食</p>
        <div className="space-y-2">
          {[
            { name: '鶏むね肉の照り焼き', type: '家にある材料で', color: 'bg-[#EDF7F4] text-[#7BC4A8]' },
            { name: '豚こまと野菜の炒め物', type: '少し買い足し', color: 'bg-[#FFF8F0] text-[#E07B5A]' },
            { name: '卵と豆腐の味噌汁', type: '家にある材料で', color: 'bg-[#EDF7F4] text-[#7BC4A8]' },
          ].map(({ name, type, color }) => (
            <div key={name} className="bg-[#F8F6F2] rounded-xl p-2.5 flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-[#3A3A3A] flex-1">{name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${color} font-medium whitespace-nowrap`}>{type}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="bg-[#F8F6F2] rounded-xl p-2 flex-1 text-center">
          <p className="text-xs text-[#9B8B7A]">人数</p>
          <p className="text-sm font-bold text-[#3A3A3A]">2人</p>
        </div>
        <div className="bg-[#F8F6F2] rounded-xl p-2 flex-1 text-center">
          <p className="text-xs text-[#9B8B7A]">量</p>
          <p className="text-sm font-bold text-[#3A3A3A]">標準</p>
        </div>
        <div className="bg-[#E07B5A] rounded-xl p-2 flex-1 text-center">
          <p className="text-xs text-white/80">再提案</p>
          <p className="text-sm font-bold text-white">↻</p>
        </div>
      </div>
    </PhoneFrame>
  )
}

function StockMockup() {
  return (
    <PhoneFrame>
      <div className="bg-white rounded-xl p-2.5 space-y-2">
        <div className="flex gap-1">
          {['すべて', '冷蔵', '冷凍', '常温'].map((tab, i) => (
            <div key={tab} className={`flex-1 text-center text-xs py-1 rounded-lg font-medium ${i === 0 ? 'bg-[#E07B5A] text-white' : 'text-[#9B8B7A]'}`}>{tab}</div>
          ))}
        </div>
        {[
          { name: '卵', qty: '6個', cat: '冷蔵', bar: 'bg-blue-400' },
          { name: '鶏むね肉', qty: '300g', cat: '冷蔵', bar: 'bg-blue-400' },
          { name: '玉ねぎ', qty: '3個', cat: '冷蔵', bar: 'bg-blue-400' },
          { name: '醤油', qty: '400ml', cat: '調味料', bar: 'bg-rose-400' },
        ].map(({ name, qty, cat, bar }) => (
          <div key={name} className="flex items-center gap-2 bg-[#F8F6F2] rounded-xl px-3 py-2">
            <div className={`w-1 h-7 rounded-full flex-shrink-0 ${bar}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#3A3A3A]">{name}</p>
              <p className="text-xs text-[#9B8B7A]">{qty} · {cat}</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-md bg-white border border-[#E8E0D8] flex items-center justify-center text-xs">−</div>
              <div className="w-5 h-5 rounded-md bg-white border border-[#E8E0D8] flex items-center justify-center text-xs">+</div>
            </div>
          </div>
        ))}
      </div>
    </PhoneFrame>
  )
}

function CookMockup() {
  return (
    <PhoneFrame>
      <div className="bg-white rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🌙</span>
          <p className="text-xs font-bold text-[#3A3A3A]">今夜の夕食</p>
        </div>
        <div className="bg-[#FFF1EC] border border-[#E07B5A]/30 rounded-xl p-3 mb-3">
          <p className="text-sm font-bold text-[#3A3A3A]">鶏むね肉の照り焼き</p>
          <p className="text-xs text-[#9B8B7A] mt-0.5">使用食材 3品</p>
        </div>
        <div className="space-y-1.5 mb-3">
          {['鶏むね肉 300g', '醤油 大さじ2', 'みりん 大さじ2'].map(ing => (
            <div key={ing} className="flex items-center gap-1.5 text-xs text-[#3A3A3A]">
              <Check size={11} className="text-[#7BC4A8]" strokeWidth={3} />
              {ing}
            </div>
          ))}
        </div>
        <div className="bg-[#E07B5A] rounded-xl py-2.5 text-center">
          <p className="text-sm font-bold text-white">✓ 作った！</p>
        </div>
      </div>
      <div className="bg-[#EDF7F4] border border-[#7BC4A8]/40 rounded-xl px-3 py-2 flex items-center justify-between">
        <p className="text-xs text-[#3A3A3A]">在庫を更新しました</p>
        <p className="text-xs text-[#E07B5A] font-bold">取り消す</p>
      </div>
    </PhoneFrame>
  )
}

function SnackMockup() {
  return (
    <PhoneFrame>
      <div className="bg-gradient-to-br from-[#EDF7F4] to-[#F0F8F5] rounded-xl p-3 text-center">
        <div className="text-2xl mb-1">🍺</div>
        <p className="text-xs font-bold text-[#3A3A3A]">おつまみモード</p>
        <p className="text-xs text-[#9B8B7A]">15分 · 一品 · 洗い物少なめ</p>
      </div>
      <div className="space-y-1.5">
        {[
          { name: '豆腐のネギ塩がけ', tag: '5分', avail: true },
          { name: 'ウインナー炒め', tag: '10分', avail: true },
          { name: 'もやしのナムル', tag: '10分', avail: false },
        ].map(({ name, tag, avail }) => (
          <div key={name} className="bg-white rounded-xl border border-[#E8E0D8] p-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-[#3A3A3A]">{name}</p>
              <p className="text-xs text-[#9B8B7A]">{tag}</p>
            </div>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${avail ? 'bg-[#EDF7F4] text-[#7BC4A8]' : 'bg-[#FFF8F0] text-[#E07B5A]'}`}>
              {avail ? '家にある' : '買い足し'}
            </span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  )
}
