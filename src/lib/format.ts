export const brl = (v: { toString(): string } | number) =>
  Number(v.toString()).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const padNumber = (n: number, total: number) =>
  String(n).padStart(String(total - 1).length, "0");

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const maskName = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[0][0]}***` : `${first.slice(0, 1)}***`;
};
