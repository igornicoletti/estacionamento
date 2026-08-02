
export function scheduleAfterMenuClose(action: () => void) {
  queueMicrotask(action)
}
