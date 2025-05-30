-- AlterTable
ALTER TABLE "users"."User" ADD COLUMN     "role" "users"."Role" NOT NULL DEFAULT 'USER';
