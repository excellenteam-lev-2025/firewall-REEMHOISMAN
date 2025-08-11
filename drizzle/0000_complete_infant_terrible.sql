CREATE TABLE IF NOT EXISTS "rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(10),
	"value" varchar(45),
	"mode" varchar(10),
	"active" boolean DEFAULT true,
	CONSTRAINT "rules_value_unique" UNIQUE("value")
);
