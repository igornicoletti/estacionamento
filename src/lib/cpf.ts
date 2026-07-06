import { onlyDigits } from "./normalize"

const cpfDigitsLength = 11
const maskedCpfFallback = "***.***.***-**"

export { onlyDigits }

export function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, cpfDigitsLength)

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
}

export function isValidCpf(value: string) {
  const digits = onlyDigits(value)

  if (digits.length !== cpfDigitsLength || /^(\d)\1{10}$/.test(digits)) {
    return false
  }

  const numbers = Array.from(digits, Number)

  const firstCheck = numbers
    .slice(0, 9)
    .reduce((sum, digit, index) => sum + digit * (10 - index), 0)
  const firstDigit = (firstCheck * 10) % 11
  const normalizedFirstDigit = firstDigit === 10 ? 0 : firstDigit

  const secondCheck = numbers
    .slice(0, 10)
    .reduce((sum, digit, index) => sum + digit * (11 - index), 0)
  const secondDigit = (secondCheck * 10) % 11
  const normalizedSecondDigit = secondDigit === 10 ? 0 : secondDigit

  return (
    numbers[9] === normalizedFirstDigit &&
    numbers[10] === normalizedSecondDigit
  )
}

export function maskCpfForDisplay(value: string) {
  const digits = onlyDigits(value)

  if (digits.length === 0) {
    return maskedCpfFallback
  }

  const suffix = digits.slice(-2).padStart(2, "*")

  return `***.***.***-${suffix}`
}
