import type { CneMetadata } from "../../model/CneMetadata";

const timers = new Map<CneMetadata, ReturnType<typeof setTimeout>>();

export function debouncedSave(metadata: CneMetadata): void {
  clearTimeout(timers.get(metadata));
  timers.set(
    metadata,
    setTimeout(async () => {
      timers.delete(metadata);
      try {
        await metadata.save();
        if (metadata.hasPendingChanges()) debouncedSave(metadata);
      } catch {
        // The draft keeps its text and displays the error; never blindly retry a conflict.
      }
    }, 500),
  );
}

export function cancelSave(metadata: CneMetadata): void {
  clearTimeout(timers.get(metadata));
  timers.delete(metadata);
}

export function stopPendingSaves(): void {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
}
