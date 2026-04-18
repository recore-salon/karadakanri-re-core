-- =====================================================
-- あるもんメンテナンス Re:Stock — 初期スキーマ
-- =====================================================

-- ユーザー設定テーブル
CREATE TABLE IF NOT EXISTS public.user_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  default_people  INTEGER NOT NULL DEFAULT 2 CHECK (default_people BETWEEN 1 AND 10),
  default_portion TEXT NOT NULL DEFAULT 'standard' CHECK (default_portion IN ('light', 'standard', 'large')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 食材・在庫テーブル
CREATE TABLE IF NOT EXISTS public.ingredients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  category    TEXT NOT NULL DEFAULT 'fridge'
                CHECK (category IN ('fridge', 'freezer', 'pantry', 'seasoning')),
  quantity    NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit        TEXT NOT NULL DEFAULT 'piece'
                CHECK (unit IN ('piece', 'g', 'kg', 'ml', 'L', 'bottle', 'bag', 'pack', 'can')),
  is_bento    BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  DATE,
  memo        TEXT CHECK (char_length(memo) <= 200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 献立プランテーブル
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date   DATE NOT NULL,
  meal_type   TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  dish_name   TEXT NOT NULL,
  description TEXT,
  people      INTEGER NOT NULL DEFAULT 2 CHECK (people BETWEEN 1 AND 10),
  portion     TEXT NOT NULL DEFAULT 'standard' CHECK (portion IN ('light', 'standard', 'large')),
  plan_type   TEXT NOT NULL DEFAULT 'available' CHECK (plan_type IN ('available', 'need_shopping')),
  is_cooked   BOOLEAN NOT NULL DEFAULT FALSE,
  cooked_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 献立と食材の中間テーブル
CREATE TABLE IF NOT EXISTS public.meal_plan_ingredients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id      UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  ingredient_id     UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  ingredient_name   TEXT NOT NULL,
  required_quantity NUMERIC(10, 2) NOT NULL CHECK (required_quantity >= 0),
  unit              TEXT NOT NULL,
  is_available      BOOLEAN NOT NULL DEFAULT TRUE
);

-- 在庫変動履歴テーブル
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id        UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  ingredient_name      TEXT NOT NULL,
  meal_plan_id         UUID REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  transaction_group_id UUID NOT NULL,   -- 同一操作をまとめるためのグループID
  delta                NUMERIC(10, 2) NOT NULL,  -- マイナス=消費 / プラス=追加・取り消し
  unit                 TEXT NOT NULL,
  note                 TEXT,            -- '献立から' | '手動' | '取り消し'
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- よく使う食材サジェストマスタ
CREATE TABLE IF NOT EXISTS public.common_ingredients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  category   TEXT NOT NULL CHECK (category IN ('fridge', 'freezer', 'pantry', 'seasoning')),
  unit       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- インデックス
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ingredients_user_category
  ON public.ingredients(user_id, category);

CREATE INDEX IF NOT EXISTS idx_ingredients_user_expires
  ON public.ingredients(user_id, expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ingredients_user_name
  ON public.ingredients(user_id, name);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date
  ON public.meal_plans(user_id, plan_date DESC);

CREATE INDEX IF NOT EXISTS idx_stock_transactions_user_date
  ON public.stock_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_transactions_group
  ON public.stock_transactions(transaction_group_id);

-- =====================================================
-- updated_at 自動更新トリガー
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ingredients_updated_at
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.common_ingredients  ENABLE ROW LEVEL SECURITY;

-- user_settings ポリシー
CREATE POLICY "user can manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ingredients ポリシー
CREATE POLICY "user can manage own ingredients"
  ON public.ingredients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- meal_plans ポリシー
CREATE POLICY "user can manage own meal_plans"
  ON public.meal_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- meal_plan_ingredients ポリシー（meal_plans経由でアクセス制御）
CREATE POLICY "user can manage own meal_plan_ingredients"
  ON public.meal_plan_ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid()
    )
  );

-- stock_transactions ポリシー
CREATE POLICY "user can manage own stock_transactions"
  ON public.stock_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- common_ingredients は全ユーザーが読み取り可能
CREATE POLICY "all users can read common_ingredients"
  ON public.common_ingredients FOR SELECT
  USING (true);

-- =====================================================
-- よく使う食材サジェストデータ
-- =====================================================

INSERT INTO public.common_ingredients (name, category, unit, sort_order) VALUES
  -- 冷蔵
  ('卵', 'fridge', 'piece', 1),
  ('牛乳', 'fridge', 'ml', 2),
  ('豆腐', 'fridge', 'piece', 3),
  ('納豆', 'fridge', 'pack', 4),
  ('鶏むね肉', 'fridge', 'g', 5),
  ('鶏もも肉', 'fridge', 'g', 6),
  ('豚バラ肉', 'fridge', 'g', 7),
  ('豚こま切れ肉', 'fridge', 'g', 8),
  ('ひき肉（豚）', 'fridge', 'g', 9),
  ('ひき肉（合挽）', 'fridge', 'g', 10),
  ('キャベツ', 'fridge', 'piece', 11),
  ('にんじん', 'fridge', 'piece', 12),
  ('玉ねぎ', 'fridge', 'piece', 13),
  ('じゃがいも', 'fridge', 'piece', 14),
  ('大根', 'fridge', 'piece', 15),
  ('ほうれん草', 'fridge', 'bag', 16),
  ('もやし', 'fridge', 'bag', 17),
  ('小松菜', 'fridge', 'bag', 18),
  ('長ねぎ', 'fridge', 'piece', 19),
  ('にんにく', 'fridge', 'piece', 20),
  ('生姜', 'fridge', 'piece', 21),
  ('ヨーグルト', 'fridge', 'g', 22),
  ('チーズ（スライス）', 'fridge', 'pack', 23),
  ('バター', 'fridge', 'g', 24),
  ('ウインナー', 'fridge', 'bag', 25),
  ('ベーコン', 'fridge', 'pack', 26),
  -- 冷凍
  ('冷凍枝豆', 'freezer', 'g', 1),
  ('冷凍ブロッコリー', 'freezer', 'g', 2),
  ('冷凍ほうれん草', 'freezer', 'g', 3),
  ('冷凍コーン', 'freezer', 'g', 4),
  ('冷凍うどん', 'freezer', 'bag', 5),
  ('冷凍ご飯', 'freezer', 'piece', 6),
  ('エビ（冷凍）', 'freezer', 'g', 7),
  ('鶏むね肉（冷凍）', 'freezer', 'g', 8),
  -- 常温
  ('米', 'pantry', 'kg', 1),
  ('パスタ', 'pantry', 'g', 2),
  ('そうめん', 'pantry', 'bag', 3),
  ('インスタントラーメン', 'pantry', 'piece', 4),
  ('食パン', 'pantry', 'bag', 5),
  ('缶詰（ツナ）', 'pantry', 'can', 6),
  ('缶詰（サバ）', 'pantry', 'can', 7),
  ('乾燥わかめ', 'pantry', 'bag', 8),
  ('天かす', 'pantry', 'bag', 9),
  ('ごま', 'pantry', 'bag', 10),
  -- 調味料
  ('醤油', 'seasoning', 'ml', 1),
  ('みりん', 'seasoning', 'ml', 2),
  ('料理酒', 'seasoning', 'ml', 3),
  ('砂糖', 'seasoning', 'g', 4),
  ('塩', 'seasoning', 'g', 5),
  ('味噌', 'seasoning', 'g', 6),
  ('めんつゆ', 'seasoning', 'ml', 7),
  ('ポン酢', 'seasoning', 'ml', 8),
  ('マヨネーズ', 'seasoning', 'g', 9),
  ('ケチャップ', 'seasoning', 'g', 10),
  ('ソース', 'seasoning', 'ml', 11),
  ('ごま油', 'seasoning', 'ml', 12),
  ('オリーブオイル', 'seasoning', 'ml', 13),
  ('サラダ油', 'seasoning', 'ml', 14),
  ('だしの素', 'seasoning', 'bag', 15),
  ('コンソメ', 'seasoning', 'piece', 16),
  ('鶏がらスープの素', 'seasoning', 'g', 17),
  ('豆板醤', 'seasoning', 'g', 18),
  ('オイスターソース', 'seasoning', 'ml', 19),
  ('片栗粉', 'seasoning', 'g', 20),
  ('小麦粉', 'seasoning', 'g', 21),
  ('パン粉', 'seasoning', 'g', 22),
  ('酢', 'seasoning', 'ml', 23),
  ('白だし', 'seasoning', 'ml', 24)
ON CONFLICT (name) DO NOTHING;
