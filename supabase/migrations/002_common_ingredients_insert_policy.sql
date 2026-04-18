-- =====================================================
-- common_ingredients に認証済みユーザーの INSERT を許可
-- 手入力食材を次回から候補に表示するために必要
-- =====================================================

CREATE POLICY "authenticated users can insert common_ingredients"
  ON public.common_ingredients FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
