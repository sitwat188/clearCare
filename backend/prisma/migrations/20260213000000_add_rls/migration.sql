-- Enable Row-Level Security (RLS) on PHI and audit tables.
-- Session variables (set by app): app.current_user_id, app.user_role, app.login_email (for login lookup).
-- See docs/RLS.md for usage and enforcement.

-- users: own row, all for administrator, or when app.login_email is set (login flow)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_or_admin_or_login"
  ON "users" FOR SELECT
  USING (
    (current_setting('app.current_user_id', true) = id)
    OR (current_setting('app.user_role', true) = 'administrator')
    OR (current_setting('app.login_email', true) <> '')
  );

CREATE POLICY "users_update_own_or_admin"
  ON "users" FOR UPDATE
  USING (
    (current_setting('app.current_user_id', true) = id)
    OR (current_setting('app.user_role', true) = 'administrator')
  );

CREATE POLICY "users_insert_admin"
  ON "users" FOR INSERT
  WITH CHECK (current_setting('app.user_role', true) = 'administrator');

CREATE POLICY "users_delete_admin"
  ON "users" FOR DELETE
  USING (current_setting('app.user_role', true) = 'administrator');

-- patients: own row (patient), assigned (provider via patient_providers), all (administrator)
ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_select_own_assigned_or_admin"
  ON "patients" FOR SELECT
  USING (
    (current_setting('app.user_role', true) = 'administrator')
    OR (
      (current_setting('app.user_role', true) = 'patient' AND "user_id" = current_setting('app.current_user_id', true))
    )
    OR (
      (current_setting('app.user_role', true) = 'provider' AND id IN (
        SELECT "patient_id" FROM "patient_providers"
        WHERE "provider_id" = current_setting('app.current_user_id', true)
      ))
    )
  );

CREATE POLICY "patients_update_own_assigned_or_admin"
  ON "patients" FOR UPDATE
  USING (
    (current_setting('app.user_role', true) = 'administrator')
    OR ("user_id" = current_setting('app.current_user_id', true))
    OR (id IN (
      SELECT "patient_id" FROM "patient_providers"
      WHERE "provider_id" = current_setting('app.current_user_id', true)
    ))
  );

CREATE POLICY "patients_insert_admin_or_provider"
  ON "patients" FOR INSERT
  WITH CHECK (
    current_setting('app.user_role', true) IN ('administrator', 'provider')
  );

CREATE POLICY "patients_delete_admin"
  ON "patients" FOR DELETE
  USING (current_setting('app.user_role', true) = 'administrator');

-- user_history: own user's history or administrator
ALTER TABLE "user_history" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_history_select_own_or_admin"
  ON "user_history" FOR SELECT
  USING (
    (current_setting('app.user_role', true) = 'administrator')
    OR ("user_id" = current_setting('app.current_user_id', true))
  );

CREATE POLICY "user_history_insert_system"
  ON "user_history" FOR INSERT
  WITH CHECK (true);

CREATE POLICY "user_history_no_update_delete"
  ON "user_history" FOR UPDATE USING (false);
CREATE POLICY "user_history_no_delete"
  ON "user_history" FOR DELETE USING (false);

-- audit_logs: own logs or administrator
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_own_or_admin"
  ON "audit_logs" FOR SELECT
  USING (
    (current_setting('app.user_role', true) = 'administrator')
    OR ("user_id" = current_setting('app.current_user_id', true))
  );

CREATE POLICY "audit_logs_insert_system"
  ON "audit_logs" FOR INSERT
  WITH CHECK (true);

CREATE POLICY "audit_logs_no_update_delete"
  ON "audit_logs" FOR UPDATE USING (false);
CREATE POLICY "audit_logs_no_delete"
  ON "audit_logs" FOR DELETE USING (false);

-- care_instructions: provider who created, patient who owns, assigned provider, or administrator
ALTER TABLE "care_instructions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "care_instructions_select"
  ON "care_instructions" FOR SELECT
  USING (
    (current_setting('app.user_role', true) = 'administrator')
    OR ("provider_id" = current_setting('app.current_user_id', true))
    OR ("patient_id" IN (SELECT id FROM "patients" WHERE "user_id" = current_setting('app.current_user_id', true)))
    OR ("patient_id" IN (
      SELECT "patient_id" FROM "patient_providers"
      WHERE "provider_id" = current_setting('app.current_user_id', true)
    ))
  );

CREATE POLICY "care_instructions_update"
  ON "care_instructions" FOR UPDATE
  USING (
    (current_setting('app.user_role', true) = 'administrator')
    OR ("provider_id" = current_setting('app.current_user_id', true))
    OR ("patient_id" IN (SELECT id FROM "patients" WHERE "user_id" = current_setting('app.current_user_id', true)))
    OR ("patient_id" IN (
      SELECT "patient_id" FROM "patient_providers"
      WHERE "provider_id" = current_setting('app.current_user_id', true)
    ))
  );

CREATE POLICY "care_instructions_insert"
  ON "care_instructions" FOR INSERT
  WITH CHECK (
    current_setting('app.user_role', true) IN ('administrator', 'provider')
  );

CREATE POLICY "care_instructions_delete"
  ON "care_instructions" FOR DELETE
  USING (
    (current_setting('app.user_role', true) = 'administrator')
    OR ("provider_id" = current_setting('app.current_user_id', true))
  );
