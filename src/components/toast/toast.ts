import { toast as sonnerToast, type ExternalToast } from "sonner"

import { type ToastMessageKey } from "./toast-copy"
import {
  resolveToastMessage,
  type ToastMessageInput,
} from "./toast-utils"

type NotifyOptions = Omit<ExternalToast, "description"> & {
  description?: ToastMessageInput
}

type NotifyPromiseOptions<TData> = NotifyOptions & {
  loading?: ToastMessageInput
  success?: ToastMessageInput | ((data: TData) => ToastMessageInput)
  error?: ToastMessageInput | ((error: unknown) => ToastMessageInput)
  finally?: () => void | Promise<void>
}

type NotifyPromiseInput<TData> = Promise<TData> | (() => Promise<TData>)

function resolveToastOptions(
  options: NotifyOptions | undefined,
  fallbackKey: ToastMessageKey
): ExternalToast | undefined {
  if (!options) {
    return undefined
  }

  const { description, ...externalOptions } = options

  return {
    ...externalOptions,
    description: description
      ? resolveToastMessage(description, fallbackKey)
      : undefined,
  }
}

export const notify = {
  success(message?: ToastMessageInput, options?: NotifyOptions) {
    return sonnerToast.success(
      resolveToastMessage(message, "common.success"),
      resolveToastOptions(options, "common.success")
    )
  },
  error(message?: ToastMessageInput, options?: NotifyOptions) {
    return sonnerToast.error(
      resolveToastMessage(message, "common.error"),
      resolveToastOptions(options, "common.error")
    )
  },
  info(message?: ToastMessageInput, options?: NotifyOptions) {
    return sonnerToast.info(
      resolveToastMessage(message, "common.info"),
      resolveToastOptions(options, "common.info")
    )
  },
  warning(message?: ToastMessageInput, options?: NotifyOptions) {
    return sonnerToast.warning(
      resolveToastMessage(message, "common.warning"),
      resolveToastOptions(options, "common.warning")
    )
  },
  loading(message?: ToastMessageInput, options?: NotifyOptions) {
    return sonnerToast.loading(
      resolveToastMessage(message, "common.loading"),
      resolveToastOptions(options, "common.loading")
    )
  },
  promise<TData>(
    promise: NotifyPromiseInput<TData>,
    options?: NotifyPromiseOptions<TData>
  ) {
    const {
      success,
      error,
      description,
      finally: onFinally,
      ...externalOptions
    } = options ?? {}

    return sonnerToast.promise<TData>(promise, {
      ...externalOptions,
      loading: undefined,
      success: (data) =>
        resolveToastMessage(
          typeof success === "function" ? success(data) : success,
          "common.success"
        ),
      error: (caughtError) =>
        resolveToastMessage(
          typeof error === "function" ? error(caughtError) : error,
          "common.error"
        ),
      description: description
        ? resolveToastMessage(description, "common.info")
        : undefined,
      finally: onFinally,
    })
  },
  async track<TData>(
    promise: NotifyPromiseInput<TData>,
    options?: NotifyPromiseOptions<TData>
  ) {
    const actualPromise =
      typeof promise === "function" ? promise() : promise
    const {
      success,
      error,
      description,
      finally: onFinally,
      ...externalOptions
    } = options ?? {}

    sonnerToast.promise<TData>(actualPromise, {
      ...externalOptions,
      loading: undefined,
      success: (data) =>
        resolveToastMessage(
          typeof success === "function" ? success(data) : success,
          "common.success"
        ),
      error: (caughtError) =>
        resolveToastMessage(
          typeof error === "function" ? error(caughtError) : error,
          "common.error"
        ),
      description: description
        ? resolveToastMessage(description, "common.info")
        : undefined,
      finally: onFinally,
    })

    return actualPromise
  },
  dismiss(id?: string | number) {
    return sonnerToast.dismiss(id)
  },
}
