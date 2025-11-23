-- Create working_hours table
CREATE TABLE IF NOT EXISTS "working_hours" (
    "id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "open_time" TEXT,
    "close_time" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on day_of_week
CREATE UNIQUE INDEX IF NOT EXISTS "working_hours_day_of_week_key" ON "working_hours"("day_of_week");

-- Insert default working hours (Monday to Sunday)
INSERT INTO "working_hours" ("id", "day_of_week", "is_open", "open_time", "close_time", "created_at", "updated_at")
VALUES
    (gen_random_uuid()::text, 0, true, '10:00', '00:00', NOW(), NOW()), -- Sunday
    (gen_random_uuid()::text, 1, true, '10:00', '00:00', NOW(), NOW()), -- Monday
    (gen_random_uuid()::text, 2, true, '10:00', '00:00', NOW(), NOW()), -- Tuesday
    (gen_random_uuid()::text, 3, true, '10:00', '00:00', NOW(), NOW()), -- Wednesday
    (gen_random_uuid()::text, 4, true, '10:00', '00:00', NOW(), NOW()), -- Thursday
    (gen_random_uuid()::text, 5, true, '10:00', '00:00', NOW(), NOW()), -- Friday
    (gen_random_uuid()::text, 6, true, '10:00', '00:00', NOW(), NOW())  -- Saturday
ON CONFLICT ("day_of_week") DO NOTHING;

