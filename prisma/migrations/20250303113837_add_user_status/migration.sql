-- CreateEnum
CREATE TYPE "users"."UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'DELETED');

-- AlterTable
ALTER TABLE "users"."User" ADD COLUMN     "status" "users"."UserStatus" NOT NULL DEFAULT 'ACTIVE';

WITH can_insert AS (
  SELECT NOT EXISTS (
    SELECT 1
    FROM "users"."Auth"
    WHERE "email" = 'string@gmail.com'
  ) AS do_it
),
ins_user AS (
  INSERT INTO "users"."User" ("id", "name", "status", "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    'Администратор системы',
    'ACTIVE',
    now(),
    now()
  FROM can_insert
  WHERE do_it
  RETURNING "id" AS user_id
)
INSERT INTO "users"."Auth"
  ("id", "email", "hashedPassword", "salt", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  'string@gmail.com',
  '0362795b2ee7235b3b4d28f0698a85366703eacf0ba4085796ffd980d7653337',
  'my-custom-salt',
  ins_user.user_id,
  now(),
  now()
FROM ins_user;
