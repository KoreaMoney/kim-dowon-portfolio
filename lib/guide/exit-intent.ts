export const EXIT_INTENT_DWELL_MS = 5_000;

type ExitIntent = {
  x: number;
  y: number;
  width: number;
  height: number;
  relatedTarget: EventTarget | null;
  trusted: boolean;
  buttons: number;
  elapsed: number;
  mouseObserved: boolean;
};

// A null relatedTarget alone also occurs for some embedded content. Require a
// viewport edge as well, and never interrupt a drag or a synthetic event.
export function isIntentionalViewportExit(event: ExitIntent) {
  return event.trusted && event.relatedTarget === null && event.buttons === 0
    && event.mouseObserved && event.elapsed >= EXIT_INTENT_DWELL_MS
    && (event.x <= 0 || event.y <= 0 || event.x >= event.width - 1 || event.y >= event.height - 1);
}

// Keep the initial dwell clock across dismissals, but consume each observed
// mouse visit. Another offer requires a fresh movement inside the page.
export function createExitIntentTracker(startedAt: number) {
  let mouseObserved = false;
  return {
    observeMouse() { mouseObserved = true; },
    disarm() { mouseObserved = false; },
    leave(event: Omit<ExitIntent, "elapsed" | "mouseObserved">, now: number) {
      if (!isIntentionalViewportExit({ ...event, elapsed:now - startedAt, mouseObserved })) return false;
      mouseObserved = false;
      return true;
    },
  };
}
