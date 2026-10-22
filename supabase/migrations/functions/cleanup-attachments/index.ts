import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

type CleanupItem = {
  attachment_id: string;
  storage_path: string;
  status: string;
};

export default {
  fetch: withSupabase(
    { auth: "secret" },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return Response.json(
          { error: "Method not allowed" },
          { status: 405, headers: { Allow: "POST" } },
        );
      }

      // Пустое тело также означает dry-run.
      let body: Record<string, unknown>;

      try {
        const text = await req.text();
        const parsed = text.trim() ? JSON.parse(text) : {};

        if (
          parsed === null ||
          typeof parsed !== "object" ||
          Array.isArray(parsed)
        ) {
          throw new Error("Expected a JSON object");
        }

        body = parsed;
      } catch {
        return Response.json(
          { error: "Expected a valid JSON object" },
          { status: 400 },
        );
      }

      // Опечатка в параметре не должна запускать другую операцию.
      if (
        Object.keys(body).some(
          (key) => key !== "dry_run" && key !== "limit",
        )
      ) {
        return Response.json(
          { error: "Allowed parameters: dry_run, limit" },
          { status: 400 },
        );
      }

      const dryRun =
        body.dry_run === undefined ? true : body.dry_run;
      const limit =
        body.limit === undefined ? 100 : body.limit;

      if (
        typeof dryRun !== "boolean" ||
        typeof limit !== "number" ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return Response.json(
          {
            error:
              "dry_run must be boolean; limit must be an integer from 1 to 100",
          },
          { status: 400 },
        );
      }

      const db = ctx.supabaseAdmin;
      const runId = crypto.randomUUID();
      const startedAt = Date.now();

      let acquired = false;
      let processed = 0;
      let cleaned = 0;
      let failed = 0;
      let deferred = 0;
      let status = 200;
      let response: Record<string, unknown> = {};

      try {
        const { data, error } = await db.rpc(
          "prepare_attachment_cleanup",
          {
            p_dry_run: dryRun,
            p_limit: limit,
            p_run_id: dryRun ? null : runId,
          },
        );

        if (error) throw error;

        if (!data || typeof data !== "object") {
          throw new Error("Invalid cleanup preparation response");
        }

        if (data.busy === true) {
          return Response.json(
            { error: "Cleanup is already running or needs recovery" },
            { status: 409 },
          );
        }

        if (!dryRun) {
          if (data.run_id !== runId) {
            throw new Error("Cleanup run ID mismatch");
          }

          acquired = true;
        }

        const items = data.items as CleanupItem[];

        if (!Array.isArray(items) || items.length > limit) {
          throw new Error("Invalid cleanup batch");
        }

        if (dryRun) {
          console.log(JSON.stringify({
            event: "cleanup_preview",
            run_id: runId,
            candidates: items.length,
            limit,
          }));

          return Response.json({
            dry_run: true,
            candidates: items.length,
            limit,
            items,
          });
        }

        console.log(JSON.stringify({
          event: "cleanup_started",
          run_id: runId,
          candidates: items.length,
          limit,
        }));

        for (const item of items) {
          // Ограничиваем время начала новых операций.
          // Уже начатую операцию всегда дожидаемся.
          if (Date.now() - startedAt >= 45_000) {
            deferred = items.length - processed;
            break;
          }

          processed++;

          try {
            if (
              typeof item.attachment_id !== "string" ||
              typeof item.storage_path !== "string" ||
              !item.storage_path
            ) {
              throw new Error("Invalid attachment data");
            }

            const { error: removeError } = await db.storage
              .from("task-attachments")
              .remove([item.storage_path]);

            if (removeError) throw removeError;

            const { data: finished, error: finishError } =
              await db.rpc("finish_attachment_cleanup_v2", {
                p_run_id: runId,
                p_attachment_id: item.attachment_id,
                p_storage_path: item.storage_path,
              });

            if (finishError) throw finishError;

            if (finished !== true) {
              throw new Error("Cleanup was not finalized");
            }

            cleaned++;

            console.log(JSON.stringify({
              event: "attachment_cleaned",
              run_id: runId,
              attachment_id: item.attachment_id,
            }));
          } catch (error) {
            failed++;

            console.error(JSON.stringify({
              event: "attachment_cleanup_failed",
              run_id: runId,
              attachment_id: item.attachment_id,
              message:
                error instanceof Error
                  ? error.message
                  : String(
                    (error as { message?: unknown })?.message ??
                      error,
                  ),
            }));
          }
        }

        // failed/deferred остаются cleaning для следующего запуска.
        response = {
          dry_run: false,
          run_id: runId,
          processed,
          cleaned,
          failed,
          deferred,
        };

        if (failed > 0) status = 500;
      } catch (error) {
        status = 500;

        console.error("Cleanup failed", {
          run_id: runId,
          error,
        });

        response = {
          error: "Cleanup failed; check function logs",
          run_id: runId,
          processed,
          cleaned,
          failed,
          deferred,
        };
      } finally {
        if (acquired) {
          try {
            const { data: released, error: releaseError } =
              await db.rpc("release_attachment_cleanup", {
                p_run_id: runId,
              });

            if (releaseError || released !== true) {
              throw releaseError ??
                new Error("Cleanup lock was not released");
            }
          } catch (error) {
            status = 500;
            response.recovery_required = true;

            console.error("Cleanup lock release failed", {
              run_id: runId,
              error,
            });
          }
        }
      }

      console.log(JSON.stringify({
        event: "cleanup_finished",
        ...response,
        status,
      }));

      return Response.json(response, { status });
    },
  ),
};