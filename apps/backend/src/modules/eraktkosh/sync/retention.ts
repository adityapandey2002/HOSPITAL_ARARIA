import type { Queryable } from "../db/types";

/**
 * Deletes history older than the retention window, except the snapshot that is
 * currently published for a centre. Cells cascade with their snapshot.
 */
export async function pruneHistory(
  db: Queryable,
  options: { days?: number; now?: Date } = {}
): Promise<number> {
  const days = options.days ?? 30;
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const deleted = await db.query<{ id: string | number }>(
    `delete from ek_stock_snapshots
      where fetched_at < $1
        and id not in (
          select last_snapshot_id from ek_center_state where last_snapshot_id is not null
        )
      returning id`,
    [cutoff]
  );

  return deleted.rows.length;
}
