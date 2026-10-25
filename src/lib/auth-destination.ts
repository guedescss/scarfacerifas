export function safeNextDestination(value: string | null | undefined, fallback = "/") {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : fallback;
}
