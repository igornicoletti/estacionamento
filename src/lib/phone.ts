import { onlyDigits } from "./cpf"

const brazilPhoneDigitsLength = {
  landline: 10,
  mobile: 11,
} as const

function hasRepeatedDigits(value: string) {
  return /^(\d)\1+$/.test(value)
}

function hasValidBrazilAreaCode(digits: string) {
  const areaCode = Number(digits.slice(0, 2))

  return areaCode >= 11 && areaCode <= 99
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, brazilPhoneDigitsLength.mobile)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 6) {
    return digits.replace(/^(\d{2})(\d+)/, "($1) $2")
  }

  if (digits.length <= brazilPhoneDigitsLength.landline) {
    return digits.replace(/^(\d{2})(\d{4})(\d+)/, "($1) $2-$3")
  }

  return digits.replace(/^(\d{2})(\d{5})(\d+)/, "($1) $2-$3")
}

export function isValidPhone(value: string) {
  const digits = onlyDigits(value)
  const hasValidLength =
    digits.length === brazilPhoneDigitsLength.landline ||
    digits.length === brazilPhoneDigitsLength.mobile

  if (!hasValidLength || hasRepeatedDigits(digits)) {
    return false
  }

  if (!hasValidBrazilAreaCode(digits)) {
    return false
  }

  const subscriberNumber = digits.slice(2)

  return subscriberNumber.length > 0 && !hasRepeatedDigits(subscriberNumber)
}
