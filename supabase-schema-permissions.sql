-- physicalgoスキーマへのアクセス権限を付与
-- Supabase SQL Editor で実行してください

GRANT USAGE ON SCHEMA physicalgo TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA physicalgo TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA physicalgo TO anon, authenticated;

-- 今後作成されるテーブル・シーケンスにも自動付与
ALTER DEFAULT PRIVILEGES IN SCHEMA physicalgo
  GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA physicalgo
  GRANT ALL ON SEQUENCES TO anon, authenticated;
