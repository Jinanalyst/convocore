CREATE TABLE "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL,
    "updated_at" "timestamp with time zone" DEFAULT "now"() NOT NULL,
    "model" "text",
    "thread_id" "text"
);

ALTER TABLE "public"."conversations" OWNER TO "postgres"; 