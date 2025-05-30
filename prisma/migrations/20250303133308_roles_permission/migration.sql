-- CreateTable
CREATE TABLE "users"."PermissionRef" (
    "id" UUID NOT NULL,
    "role" "users"."Role" NOT NULL,
    "permission" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PermissionRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."UserPermission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "permissionRefId" UUID NOT NULL,
    "limitValue" INTEGER,
    "remainder" INTEGER,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PermissionRef_role_permission_key" ON "users"."PermissionRef"("role", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionRefId_key" ON "users"."UserPermission"("userId", "permissionRefId");

-- AddForeignKey
ALTER TABLE "users"."UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."UserPermission" ADD CONSTRAINT "UserPermission_permissionRefId_fkey" FOREIGN KEY ("permissionRefId") REFERENCES "users"."PermissionRef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "users"."PermissionRef"(id, role, permission, active)
    VALUES (gen_random_uuid(), 'USER', 'CREATE_CHAT', true);

INSERT INTO "users"."PermissionRef"(id, role, permission, active)
    VALUES (gen_random_uuid(), 'USER', 'SEND_MESSAGE', true);

WITH can_insert AS (
  SELECT NOT EXISTS (
    SELECT 1
    FROM "users"."Auth"
    WHERE "email" = 'string@gmail.com'
  ) AS do_it
),
ins_user AS (
  INSERT INTO "users"."User" ("id", "name", "status", "createdAt", "updatedAt", role)
  SELECT
    gen_random_uuid(),
    'Администратор системы',
    'ACTIVE',
    now(),
    now(),
    'ADMIN'
  FROM can_insert
  WHERE do_it
  RETURNING "id" AS user_id
)
INSERT INTO "users"."Auth"
  ("id", "email", "hashedPassword", "salt", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  'string@gmail.com',
  '$2b$10$wEPSU32iMQtWmoD2xAlpyezbc5NB2Dh./c0tKKxodFos0J3kDUSaq',
  '$2b$10$wEPSU32iMQtWmoD2xAlpye',
  ins_user.user_id,
  now(),
  now()
FROM ins_user;
