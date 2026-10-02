/** URL-friendly name: "Atlético Madrid" → "atletico-madrid", "Brighton & Hove Albion" → "brighton-hove-albion". */
export function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
