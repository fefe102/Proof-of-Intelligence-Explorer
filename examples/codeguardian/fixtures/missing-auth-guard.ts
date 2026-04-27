type PrivateRecord = {
  accountId: string;
  secret: string;
};

export async function loadPrivateRecord(
  callerAccountId: string,
  requestedAccountId: string,
  readRecord: (accountId: string) => Promise<PrivateRecord>,
  canRead: (caller: string, requested: string) => Promise<boolean>,
) {
  const record = await readRecord(requestedAccountId);
  if (!(await canRead(callerAccountId, requestedAccountId))) {
    return null;
  }
  return record;
}
