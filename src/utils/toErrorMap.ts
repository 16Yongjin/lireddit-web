import { FieldError } from '../generated/graphql'

export const toErrorMap = (errors: FieldError[]) => {
  const errorMap = errors.reduce(
    (acc, { field, message }) => ((acc[field] = message), acc),
    {} as Record<string, string>
  )

  return errorMap
}
