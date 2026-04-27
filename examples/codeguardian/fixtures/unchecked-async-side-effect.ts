type SaveResult =
  | { ok: true; id: string }
  | { ok: false; reason: string };

export async function saveAuditResult(
  id: string,
  writeAudit: (id: string) => Promise<void>,
): Promise<SaveResult> {
  await writeAudit(id);
  return { ok: true, id };
}
