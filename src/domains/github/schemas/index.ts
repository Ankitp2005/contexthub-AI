// github domain — schemas

export function validateInstallationId(value: string | null): number {
  if (!value) {
    throw new Error("installation_id is required");
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error("installation_id must be a positive integer");
  }
  return parsed;
}
