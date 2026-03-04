ALTER TABLE "profiles"
ADD COLUMN "fullName" TEXT;

UPDATE "profiles"
SET "fullName" = TRIM(COALESCE("firstName", '') || ' ' || COALESCE("lastName", ''));

ALTER TABLE "profiles"
ALTER COLUMN "fullName" SET NOT NULL;

ALTER TABLE "profiles"
DROP COLUMN "firstName",
DROP COLUMN "lastName";
