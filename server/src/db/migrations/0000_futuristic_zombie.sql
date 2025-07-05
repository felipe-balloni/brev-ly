CREATE TABLE "urls" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"original_url" text NOT NULL,
	"shortened_url" text NOT NULL,
	"access_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "urls_shortened_url_unique" UNIQUE("shortened_url")
);
