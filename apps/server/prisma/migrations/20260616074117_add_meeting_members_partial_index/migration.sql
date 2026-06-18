-- Partial unique index: meeting_members(meeting_id, user_id)
CREATE UNIQUE INDEX "meeting_members_meeting_id_user_id_unique_partial"
ON "meeting_members" ("meeting_id", "user_id")
WHERE "user_id" IS NOT NULL;
