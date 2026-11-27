-- AlterTable
ALTER TABLE "user" ADD COLUMN     "about" TEXT,
ADD COLUMN     "birth_date" DATE,
ADD COLUMN     "citation" VARCHAR(255),
ADD COLUMN     "first_name" VARCHAR(100),
ADD COLUMN     "last_name" VARCHAR(100),
ADD COLUMN     "occupation" VARCHAR(100),
ADD COLUMN     "phone_number" VARCHAR(20),
ADD COLUMN     "username" VARCHAR(50);

-- CreateTable
CREATE TABLE "house" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "house_photo_path" TEXT,
    "country" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "house_address" VARCHAR(255),
    "theme" VARCHAR(50),

    CONSTRAINT "house_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tag" (
    "user_id" TEXT NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "user_tag_pkey" PRIMARY KEY ("user_id","tag_id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "house_id" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" SERIAL NOT NULL,
    "house_id" INTEGER NOT NULL,
    "payer_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "expense_date" DATE NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_share" (
    "id" SERIAL NOT NULL,
    "expense_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "expense_share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayment" (
    "id" SERIAL NOT NULL,
    "house_id" INTEGER NOT NULL,
    "payer_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "repayment_date" DATE NOT NULL,

    CONSTRAINT "repayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "house_invitation" (
    "id" SERIAL NOT NULL,
    "house_id" INTEGER NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "house_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" SERIAL NOT NULL,
    "house_id" INTEGER NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(80),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_recurrence" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "frequency" VARCHAR(12) NOT NULL,
    "repeat_every" INTEGER NOT NULL DEFAULT 1,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "rotate_members" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "task_recurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignment" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "status" VARCHAR(12) NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_category" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "shopping_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_item" (
    "id" SERIAL NOT NULL,
    "house_id" INTEGER NOT NULL,
    "added_by_id" TEXT NOT NULL,
    "owner_id" TEXT,
    "category_id" INTEGER,
    "name" VARCHAR(200) NOT NULL,
    "quantity" DECIMAL(8,2) NOT NULL DEFAULT 1,
    "unit" VARCHAR(30),
    "planned_for" DATE,
    "purchased_by_id" TEXT,
    "purchased_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopping_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" SERIAL NOT NULL,
    "house_id" INTEGER NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "event_type" VARCHAR(20) NOT NULL DEFAULT 'event',
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "guest_count" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participant" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "event_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "id" SERIAL NOT NULL,
    "house_id" INTEGER NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "conversation_type" VARCHAR(15) NOT NULL,
    "name" VARCHAR(100),
    "picture_path" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participant" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMPTZ(6),
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "conversation_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT,
    "attachment_path" TEXT,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder" (
    "id" SERIAL NOT NULL,
    "house_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" SERIAL NOT NULL,
    "folder_id" INTEGER NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "house_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel" VARCHAR(15) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(6),
    "read_at" TIMESTAMPTZ(6),

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" SERIAL NOT NULL,
    "house_id" INTEGER NOT NULL,
    "actor_id" TEXT,
    "action" VARCHAR(60) NOT NULL,
    "entity_type" VARCHAR(60) NOT NULL,
    "entity_id" INTEGER,
    "details" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE INDEX "idx_membership_user_house" ON "membership"("user_id", "house_id");

-- CreateIndex
CREATE INDEX "idx_membership_house" ON "membership"("house_id");

-- CreateIndex
CREATE INDEX "idx_expense_house_date" ON "expense"("house_id", "expense_date");

-- CreateIndex
CREATE INDEX "idx_expense_payer_date" ON "expense"("payer_id", "expense_date");

-- CreateIndex
CREATE INDEX "idx_expense_share_user" ON "expense_share"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_expense_share_expense_user" ON "expense_share"("expense_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_repayment_house_date" ON "repayment"("house_id", "repayment_date");

-- CreateIndex
CREATE UNIQUE INDEX "house_invitation_token_hash_key" ON "house_invitation"("token_hash");

-- CreateIndex
CREATE INDEX "idx_house_invitation_house" ON "house_invitation"("house_id");

-- CreateIndex
CREATE INDEX "idx_task_house" ON "task"("house_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_task_recurrence_task" ON "task_recurrence"("task_id");

-- CreateIndex
CREATE INDEX "idx_task_assignment_due" ON "task_assignment"("user_id", "due_at");

-- CreateIndex
CREATE INDEX "idx_task_assignment_task" ON "task_assignment"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_task_assignment_person_due" ON "task_assignment"("task_id", "user_id", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "shopping_category_name_key" ON "shopping_category"("name");

-- CreateIndex
CREATE INDEX "idx_shopping_house_owner" ON "shopping_item"("house_id", "owner_id");

-- CreateIndex
CREATE INDEX "idx_shopping_category" ON "shopping_item"("category_id");

-- CreateIndex
CREATE INDEX "idx_event_house_dates" ON "event"("house_id", "starts_at");

-- CreateIndex
CREATE INDEX "idx_event_participant_user" ON "event_participant"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_event_participant" ON "event_participant"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_conversation_house" ON "conversation"("house_id");

-- CreateIndex
CREATE INDEX "idx_conversation_participant_user" ON "conversation_participant"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_conversation_user" ON "conversation_participant"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_message_conversation_date" ON "message"("conversation_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_folder_house_name" ON "folder"("house_id", "name");

-- CreateIndex
CREATE INDEX "idx_document_folder" ON "document"("folder_id");

-- CreateIndex
CREATE INDEX "idx_notification_user_date" ON "notification"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_activity_house_date" ON "activity_log"("house_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- AddForeignKey
ALTER TABLE "user_tag" ADD CONSTRAINT "user_tag_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_tag" ADD CONSTRAINT "user_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_share" ADD CONSTRAINT "expense_share_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expense"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_share" ADD CONSTRAINT "expense_share_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repayment" ADD CONSTRAINT "repayment_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repayment" ADD CONSTRAINT "repayment_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repayment" ADD CONSTRAINT "repayment_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "house_invitation" ADD CONSTRAINT "house_invitation_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "house_invitation" ADD CONSTRAINT "house_invitation_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_recurrence" ADD CONSTRAINT "task_recurrence_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shopping_item" ADD CONSTRAINT "shopping_item_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shopping_item" ADD CONSTRAINT "shopping_item_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shopping_item" ADD CONSTRAINT "shopping_item_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shopping_item" ADD CONSTRAINT "shopping_item_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "shopping_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shopping_item" ADD CONSTRAINT "shopping_item_purchased_by_id_fkey" FOREIGN KEY ("purchased_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "house"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Prisma schema cannot represent CHECK constraints; preserve the MLD predicates here.
ALTER TABLE "membership" ADD CONSTRAINT "chk_membership_left_after_join" CHECK ("left_at" IS NULL OR "left_at" >= "joined_at");
ALTER TABLE "expense" ADD CONSTRAINT "chk_expense_positive_amount" CHECK ("amount" > 0);
ALTER TABLE "expense_share" ADD CONSTRAINT "chk_expense_share_positive_amount" CHECK ("amount" > 0);
ALTER TABLE "repayment" ADD CONSTRAINT "chk_repayment_distinct_users" CHECK ("recipient_id" <> "payer_id");
ALTER TABLE "repayment" ADD CONSTRAINT "chk_repayment_positive_amount" CHECK ("amount" > 0);
ALTER TABLE "task_recurrence" ADD CONSTRAINT "chk_task_recurrence_frequency" CHECK ("frequency" IN ('daily', 'weekly', 'monthly'));
ALTER TABLE "task_recurrence" ADD CONSTRAINT "chk_task_recurrence_repeat_positive" CHECK ("repeat_every" > 0);
ALTER TABLE "task_recurrence" ADD CONSTRAINT "chk_task_recurrence_date_order" CHECK ("end_date" IS NULL OR "end_date" >= "start_date");
ALTER TABLE "task_assignment" ADD CONSTRAINT "chk_task_assignment_status" CHECK ("status" IN ('pending', 'completed', 'skipped'));
ALTER TABLE "shopping_item" ADD CONSTRAINT "chk_shopping_item_positive_quantity" CHECK ("quantity" > 0);
ALTER TABLE "event" ADD CONSTRAINT "chk_event_type" CHECK ("event_type" IN ('event', 'absence', 'guest_visit'));
ALTER TABLE "event" ADD CONSTRAINT "chk_event_date_order" CHECK ("ends_at" IS NULL OR "ends_at" >= "starts_at");
ALTER TABLE "event" ADD CONSTRAINT "chk_event_nonnegative_guest_count" CHECK ("guest_count" >= 0);
ALTER TABLE "conversation" ADD CONSTRAINT "chk_conversation_type" CHECK ("conversation_type" IN ('direct', 'house', 'group'));
ALTER TABLE "message" ADD CONSTRAINT "chk_message_has_content_or_attachment" CHECK (("body" IS NOT NULL AND length(btrim("body")) > 0) OR "attachment_path" IS NOT NULL);
ALTER TABLE "document" ADD CONSTRAINT "chk_document_nonnegative_size" CHECK ("size_bytes" >= 0);
ALTER TABLE "notification" ADD CONSTRAINT "chk_notification_channel" CHECK ("channel" IN ('in_app', 'email', 'push'));
