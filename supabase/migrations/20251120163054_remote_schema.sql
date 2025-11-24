
  create table "public"."slack_channels" (
    "id" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone default now(),
    "name" text not null,
    "function" text not null,
    "client_account_id" integer not null,
    "slack_workdspace_id" text not null,
    "employee_id" integer
      );


alter table "public"."slack_channels" enable row level security;

alter table "public"."employee_roles" enable row level security;

alter table "public"."stripe_api_keys" add column "is_primary" boolean;

CREATE UNIQUE INDEX slack_channels_pkey ON public.slack_channels USING btree (id);

alter table "public"."slack_channels" add constraint "slack_channels_pkey" PRIMARY KEY using index "slack_channels_pkey";

alter table "public"."slack_channels" add constraint "slack_channels_client_account_id_fkey" FOREIGN KEY (client_account_id) REFERENCES public.accounts(id) not valid;

alter table "public"."slack_channels" validate constraint "slack_channels_client_account_id_fkey";

alter table "public"."slack_channels" add constraint "slack_channels_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employees(id) not valid;

alter table "public"."slack_channels" validate constraint "slack_channels_employee_id_fkey";

alter table "public"."slack_channels" add constraint "slack_channels_slack_workdspace_id_fkey" FOREIGN KEY (slack_workdspace_id) REFERENCES public.slack_accounts(workspace_id) not valid;

alter table "public"."slack_channels" validate constraint "slack_channels_slack_workdspace_id_fkey";

grant delete on table "public"."slack_channels" to "anon";

grant insert on table "public"."slack_channels" to "anon";

grant references on table "public"."slack_channels" to "anon";

grant select on table "public"."slack_channels" to "anon";

grant trigger on table "public"."slack_channels" to "anon";

grant truncate on table "public"."slack_channels" to "anon";

grant update on table "public"."slack_channels" to "anon";

grant delete on table "public"."slack_channels" to "authenticated";

grant insert on table "public"."slack_channels" to "authenticated";

grant references on table "public"."slack_channels" to "authenticated";

grant select on table "public"."slack_channels" to "authenticated";

grant trigger on table "public"."slack_channels" to "authenticated";

grant truncate on table "public"."slack_channels" to "authenticated";

grant update on table "public"."slack_channels" to "authenticated";

grant delete on table "public"."slack_channels" to "service_role";

grant insert on table "public"."slack_channels" to "service_role";

grant references on table "public"."slack_channels" to "service_role";

grant select on table "public"."slack_channels" to "service_role";

grant trigger on table "public"."slack_channels" to "service_role";

grant truncate on table "public"."slack_channels" to "service_role";

grant update on table "public"."slack_channels" to "service_role";


