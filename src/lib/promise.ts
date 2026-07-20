export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: Error
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(timeoutError)
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error instanceof Error ? error : new Error("Não foi possível concluir a operação."))
      }
    )
  })
}
