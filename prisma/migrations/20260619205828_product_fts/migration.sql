-- AlterTable
-- searchVector is a STORED GENERATED column: Postgres recomputes it from
-- name + summary on every insert/update, so it never goes stale.
-- (Edited from Prisma's default `ADD COLUMN "searchVector" tsvector;`.)
-- Note: only IMMUTABLE functions are allowed here, so we use
-- to_tsvector(regconfig, text). array_to_string is only STABLE, so the
-- `features` use-cases are searched via a separate array facet, not FTS.
ALTER TABLE "Product" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english'::regconfig,
      coalesce("name", '') || ' ' || coalesce("summary", '')
    )
  ) STORED;

-- CreateIndex
CREATE INDEX "Product_searchVector_idx" ON "Product" USING GIN ("searchVector");
