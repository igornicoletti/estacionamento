import { act } from "@testing-library/react"

export async function flushReactUpdates() {
  await act(async () => {
    await Promise.resolve()
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0)
    })
  })
}
