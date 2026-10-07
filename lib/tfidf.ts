export type Doc = { id: number; name: string; text: string };
export type Settings = {
  lowercase: boolean;
  punctuation: boolean;
  stopWords: boolean;
  numbers: boolean;
  minLength: number;
  tf: "relative" | "count" | "log" | "binary";
  idf: "standard" | "smooth";
  norm: "none" | "l1" | "l2";
};
export const defaults: Settings = {
  lowercase: true,
  punctuation: true,
  stopWords: false,
  numbers: false,
  minLength: 1,
  tf: "relative",
  idf: "standard",
  norm: "none",
};
export const stops = new Set(
  "a an and are as at be by for from has he in is it its of on or that the to was were will with".split(
    " ",
  ),
);
export function tokens(text: string, s: Settings) {
  let t = text;
  if (s.lowercase) t = t.toLowerCase();
  if (s.punctuation) t = t.replace(/[^\p{L}\p{N}\s]/gu, " ");
  if (s.numbers) t = t.replace(/\d+/g, " ");
  return t
    .trim()
    .split(/\s+/)
    .filter(
      (w) => w && w.length >= s.minLength && !(s.stopWords && stops.has(w)),
    );
}
export function analyze(docs: Doc[], s: Settings) {
  const words = docs.map((d) => tokens(d.text, s));
  const vocab = [...new Set(words.flat())].sort();
  const N = docs.length;
  const df = Object.fromEntries(
    vocab.map((w) => [
      w,
      words.reduce((n, ws) => n + (ws.includes(w) ? 1 : 0), 0),
    ]),
  ) as Record<string, number>;
  const idf = Object.fromEntries(
    vocab.map((w) => [
      w,
      s.idf === "smooth"
        ? Math.log10(1 + N / (1 + df[w]))
        : N && df[w]
          ? Math.log10(N / df[w])
          : 0,
    ]),
  ) as Record<string, number>;
  const tf = words.map(
    (ws) =>
      Object.fromEntries(
        vocab.map((w) => {
          const c = ws.filter((x) => x === w).length;
          return [
            w,
            s.tf === "count"
              ? c
              : s.tf === "binary"
                ? Number(c > 0)
                : s.tf === "log"
                  ? c
                    ? 1 + Math.log10(c)
                    : 0
                  : ws.length
                    ? c / ws.length
                    : 0,
          ];
        }),
      ) as Record<string, number>,
  );
  let matrix = tf.map(
    (row) =>
      Object.fromEntries(vocab.map((w) => [w, row[w] * idf[w]])) as Record<
        string,
        number
      >,
  );
  if (s.norm !== "none")
    matrix = matrix.map((row) => {
      const len = Math.sqrt(Object.values(row).reduce((a, b) => a + b * b, 0));
      const sum = Object.values(row).reduce((a, b) => a + b, 0);
      return Object.fromEntries(
        vocab.map((w) => [
          w,
          s.norm === "l2" ? (len ? row[w] / len : 0) : sum ? row[w] / sum : 0,
        ]),
      );
    });
  return { words, vocab, df, idf, tf, matrix };
}
export function cosine(a: Record<string, number>, b: Record<string, number>) {
  const keys = Object.keys(a);
  const dot = keys.reduce((n, k) => n + a[k] * b[k], 0);
  const x = Math.sqrt(keys.reduce((n, k) => n + a[k] ** 2, 0));
  const y = Math.sqrt(keys.reduce((n, k) => n + b[k] ** 2, 0));
  return x && y ? dot / (x * y) : 0;
}
