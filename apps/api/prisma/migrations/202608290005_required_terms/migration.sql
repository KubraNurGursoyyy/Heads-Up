ALTER TABLE "Watch"
ADD COLUMN "requiredTerms" JSONB NOT NULL DEFAULT '[]';

-- Preserve the old intersection watches by turning every word in both topics
-- into a strict required term. The legacy columns remain in the database for
-- migration safety, but the application no longer reads them.
UPDATE "Watch" AS w
SET "requiredTerms" = COALESCE((
  SELECT jsonb_agg(token ORDER BY first_pos)
  FROM (
    SELECT token, MIN(position) AS first_pos
    FROM (
      SELECT
        token,
        term_index * 1000 + token_index AS position
      FROM jsonb_array_elements_text(COALESCE(w."intersectionTerms", '[]'::jsonb))
        WITH ORDINALITY AS terms(term, term_index)
      CROSS JOIN LATERAL regexp_split_to_table(trim(term), E'\\s+')
        WITH ORDINALITY AS words(token, token_index)
      WHERE length(trim(token)) > 0
    ) raw_tokens
    GROUP BY token
  ) unique_tokens
), '[]'::jsonb)
WHERE w."matchMode" = 'INTERSECTION';

UPDATE "Watch"
SET "category" = 'Oyun'
WHERE lower("category") IN ('diğer', 'diger')
  AND (
    lower("prompt") ~ '(^|[^a-z0-9])gta([[:space:]][0-9]+)?([^a-z0-9]|$)'
    OR lower("topic") ~ '(^|[^a-z0-9])gta([[:space:]][0-9]+)?([^a-z0-9]|$)'
    OR lower("prompt") LIKE '%grand theft auto%'
    OR lower("topic") LIKE '%grand theft auto%'
  );
