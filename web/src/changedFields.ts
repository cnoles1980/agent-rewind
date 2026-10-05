import { normalize } from "./engine";

export type ChangedField = { path: string; a: unknown; b: unknown };

// Match the comparison engine's treatment of captured JSON and volatile fields.
// Bound the expanded view; full recorded evidence remains available separately.
export function changedFields(left: unknown, right: unknown) {
  const fields: ChangedField[] = [];
  let visited = 0;
  let limited = false;
  function visit(a: unknown, b: unknown, path: string, depth: number) {
    if (++visited > 2000 || fields.length >= 30) {
      limited = true;
      return;
    }
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    const objects =
      a !== null &&
      b !== null &&
      typeof a === "object" &&
      typeof b === "object" &&
      Array.isArray(a) === Array.isArray(b);
    if (objects && depth < 6) {
      const aa = a as Record<string, unknown>,
        bb = b as Record<string, unknown>;
      for (const key of new Set([...Object.keys(aa), ...Object.keys(bb)])) {
        // JSON Pointer escapes keep unusual captured keys unambiguous.
        visit(
          Object.hasOwn(aa, key) ? aa[key] : undefined,
          Object.hasOwn(bb, key) ? bb[key] : undefined,
          path + "/" + key.replace(/~/g, "~0").replace(/\//g, "~1"),
          depth + 1,
        );
        if (limited) break;
      }
    } else fields.push({ path: path || "/", a, b });
  }
  visit(normalize(left), normalize(right), "", 0);
  return { fields, limited };
}

export function previewValue(value: unknown) {
  if (value === undefined) return "Not captured";
  const text = JSON.stringify(value, null, 2);
  return text.length > 1200
    ? text.slice(0, 1200) + "\n… Preview shortened; expand full evidence."
    : text;
}
