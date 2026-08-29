-- Convert the fixed Category enum into a text field so categories can be
-- created dynamically as new watch topics are added.
ALTER TABLE "Watch"
ALTER COLUMN "category" TYPE TEXT USING ("category"::text);

UPDATE "Watch"
SET "category" = CASE "category"
    WHEN 'GAME' THEN 'Oyun'
    WHEN 'BOOK' THEN 'Kitap'
    WHEN 'MOVIE_TV' THEN 'Film & Dizi'
    WHEN 'TECHNOLOGY' THEN 'Teknoloji'
    WHEN 'GENERAL' THEN 'Diğer'
    ELSE "category"
END;

DROP TYPE IF EXISTS "Category";
