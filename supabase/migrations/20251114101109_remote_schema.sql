alter table "public"."stripe_customers" drop constraint "stripe_customers_client_id_stripe_account_key";

alter table "public"."stripe_customers" drop constraint "stripe_customers_pkey";

drop index if exists "public"."stripe_customers_client_id_stripe_account_key";

drop index if exists "public"."stripe_customers_pkey";

alter table "public"."employee_tokens" enable row level security;

alter table "public"."employees_groups" enable row level security;

alter table "public"."employees_user_permissions" enable row level security;

alter table "public"."stripe_customers" drop column "id";

alter table "public"."stripe_customers" alter column "stripe_account" set data type character varying using "stripe_account"::character varying;

drop sequence if exists "public"."stripe_customers_id_seq";

CREATE UNIQUE INDEX stripe_customers_pkey ON public.stripe_customers USING btree (stripe_customer_id);

alter table "public"."stripe_customers" add constraint "stripe_customers_pkey" PRIMARY KEY using index "stripe_customers_pkey";

alter table "public"."stripe_customers" add constraint "stripe_customers_stripe_account_fkey" FOREIGN KEY (stripe_account) REFERENCES public.stripe_api_keys(stripe_account) ON UPDATE CASCADE not valid;

alter table "public"."stripe_customers" validate constraint "stripe_customers_stripe_account_fkey";


