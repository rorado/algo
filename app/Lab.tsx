"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const fmt = (n: number) => n.toFixed(3);

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  color,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  color: string;
  onChange: (n: number) => void;
}) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));
  return (
    <div className="lab-step" style={{ ["--c" as any]: color }}>
      <div className="lab-step-label">{label}</div>
      <div className="lab-step-row">
        <button
          onClick={() => set(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus size={22} />
        </button>
        <output>{value}</output>
        <button
          onClick={() => set(value + 1)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus size={22} />
        </button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(+e.target.value)}
        aria-label={label}
      />
      <div className="lab-step-hint">{hint}</div>
    </div>
  );
}

const presets = [
  {
    name: "A very common word (like “the”)",
    words: 20,
    count: 3,
    docs: 10,
    df: 10,
  },
  { name: "A rare, important word", words: 20, count: 3, docs: 10, df: 1 },
  { name: "A rare word, said only once", words: 20, count: 1, docs: 10, df: 1 },
  { name: "A medium word", words: 20, count: 2, docs: 10, df: 4 },
];

export default function Lab() {
  const [words, setWords] = useState(20);
  const [count, setCount] = useState(3);
  const [docs, setDocs] = useState(10);
  const [df, setDf] = useState(2);

  const setW = (n: number) => {
    setWords(n);
    if (count > n) setCount(n);
  };
  const setN = (n: number) => {
    setDocs(n);
    if (df > n) setDf(n);
  };

  const tf = count / words;
  const idf = Math.log10(docs / df);
  const score = tf * idf;

  // A word making up 30% of a document and found in only one document is already "very distinctive".
  const ref = 0.3 * Math.log10(docs) || 1;
  const pct = Math.min(100, (score / ref) * 100);
  const tone = idf === 0 || pct < 33 ? "low" : pct < 66 ? "mid" : "high";

  const verdict =
    idf === 0
      ? {
          tone,
          title: "Score is 0 — this word tells us nothing.",
          text: `It appears in every one of the ${docs} documents, so it cannot help tell them apart. Try lowering “documents containing the word”.`,
        }
      : tone === "low"
        ? {
            tone,
            title: "Low score — not very distinctive.",
            text:
              tf < 0.1
                ? "The word hardly appears in this document. Say it more often and the score goes up."
                : "The word is spread across many documents. The rarer it is, the higher the score.",
          }
        : tone === "mid"
          ? {
              tone,
              title: "Medium score — somewhat distinctive.",
              text: "The word matters here, but it is either not very frequent or not very rare. Push either one further to see the score grow.",
            }
          : {
              tone,
              title: "High score — this word defines the document.",
              text: "It is used a lot here and it is rare in the other documents. This is exactly what TF-IDF rewards.",
            };

  return (
    <section className="lab" id="lab">
      <div className="lab-head">
        <span className="lab-kicker">TRY IT YOURSELF · THE TF-IDF LAB</span>
        <h2>Change the numbers. See the score change.</h2>
        <p>
          Pick a word. Tell the lab how often it appears in one document, and
          how many documents contain it. Use the + and − buttons or drag the
          sliders.
        </p>
      </div>

      <div className="lab-presets">
        <span>Start from an example:</span>
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              setWords(p.words);
              setCount(p.count);
              setDocs(p.docs);
              setDf(p.df);
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="lab-grid">
        <div className="lab-side lab-in">
          <div className="lab-side-title">
            <b>A</b> Look inside ONE document
          </div>
          <div
            className="lab-dots"
            aria-label={`${count} of ${words} words are the chosen word`}
          >
            {Array.from({ length: words }, (_, i) => (
              <i key={i} className={i < count ? "on" : ""} />
            ))}
          </div>
          <p className="lab-caption">
            <b style={{ color: "var(--mint)" }}>{count}</b> of <b>{words}</b>{" "}
            words are your word.
          </p>
          <Stepper
            label="Words in the document"
            hint="the total length of the document"
            value={words}
            min={1}
            max={40}
            color="#a394ff"
            onChange={setW}
          />
          <Stepper
            label="Times your word appears"
            hint="how many of those words are your word"
            value={count}
            min={1}
            max={words}
            color="#68dbc1"
            onChange={setCount}
          />
        </div>

        <div className="lab-side lab-out">
          <div className="lab-side-title">
            <b>B</b> Look at ALL the documents
          </div>
          <div
            className="lab-docs"
            aria-label={`${df} of ${docs} documents contain the word`}
          >
            {Array.from({ length: docs }, (_, i) => (
              <i key={i} className={i < df ? "on" : ""}>
                <span />
              </i>
            ))}
          </div>
          <p className="lab-caption">
            <b style={{ color: "var(--orange)" }}>{df}</b> of <b>{docs}</b>{" "}
            documents contain your word.
          </p>
          <Stepper
            label="Documents in total"
            hint="the size of your collection"
            value={docs}
            min={1}
            max={24}
            color="#a394ff"
            onChange={setN}
          />
          <Stepper
            label="Documents containing the word"
            hint="the fewer, the rarer the word"
            value={df}
            min={1}
            max={docs}
            color="#f0b778"
            onChange={setDf}
          />
        </div>
      </div>

      <div className="lab-calc">
        <div className="lab-card tf">
          <span>TF · how often here</span>
          <em>
            {count} / {words}
          </em>
          <strong>{fmt(tf)}</strong>
        </div>
        <i>×</i>
        <div className="lab-card idf">
          <span>IDF · how rare overall</span>
          <em>
            log({docs} / {df})
          </em>
          <strong>{fmt(idf)}</strong>
        </div>
        <i>=</i>
        <div className={`lab-card res ${verdict.tone}`}>
          <span>TF-IDF · the final score</span>
          <em>
            {fmt(tf)} × {fmt(idf)}
          </em>
          <strong>{fmt(score)}</strong>
        </div>
      </div>

      <div className={`lab-verdict ${verdict.tone}`}>
        <div className="lab-meter" aria-hidden>
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="lab-meter-scale">
          <span>0 · not distinctive</span>
          <span>very distinctive</span>
        </div>
        <h3>{verdict.title}</h3>
        <p>{verdict.text}</p>
      </div>

      <p className="lab-note">
        “log” is the base-10 logarithm: log(10) = 1, log(100) = 2. It turns “how
        many times rarer” into a gentle score, so a word in 1 of 10 documents is
        rewarded without being 10× as important.
      </p>
    </section>
  );
}
