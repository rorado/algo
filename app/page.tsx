"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  FileText,
  Maximize2,
  Minimize2,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import Lab from "./Lab";
import VectorLab from "./VectorLab";
import {
  analyze,
  cosine,
  defaults,
  Doc,
  Settings,
  stops,
  tokens,
} from "@/lib/tfidf";

const examples: Record<string, string[]> = {
  Simple: ["The cat eats fish", "The cat likes fish", "The dog eats meat"],
  Technology: [
    "Machine learning is powerful",
    "Deep learning uses neural networks",
    "Machine learning uses data",
  ],
  Animals: [
    "A fox runs through the forest",
    "The dog runs in the park",
    "A bird flies over the forest",
  ],
  News: [
    "City council approves new climate plan",
    "Local schools open after storm closure",
    "Climate researchers report warmer oceans",
  ],
};
const initialDocs = () =>
  examples.Simple.map((text, i) => ({
    id: i + 1,
    name: `Document ${i + 1}`,
    text,
  }));
const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(3) : "0.000");
function Illustration({ kind, onWord, docs, vocab, analysis }: any) {
  const first = (docs[0]?.text || "The cat eats fish")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
  const selected = vocab[0] || "cat";
  if (kind === "hero")
    return (
      <div className="hero-art" aria-label="Documents transform into a vector">
        <svg viewBox="0 0 680 280" role="img">
          <defs>
            <linearGradient id="line" x1="0" x2="1">
              <stop stopColor="#9f8cff" />
              <stop offset="1" stopColor="#52d9bd" />
            </linearGradient>
          </defs>
          <path
            className="flow-line"
            d="M158 137 C220 137 220 80 280 80 M158 137 C220 137 220 137 280 137 M158 137 C220 137 220 194 280 194 M436 137 C455 137 465 137 482 137"
          />
          <g className="mini-doc">
            <rect x="24" y="67" width="136" height="140" rx="13" />
            <path d="M45 94h94M45 113h79M45 132h85M45 151h48" />
            <text x="45" y="184">
              DOCS
            </text>
          </g>
          <g className="word-cloud">
            {["cat", "fish", "eats", "0.10", "0.27"].map((w, i) => (
              <g
                key={w}
                className={`float f${i} ${i > 2 ? "num" : ""}`}
                onClick={() => onWord(w)}
                role="button"
                tabIndex={0}
              >
                <rect
                  x={i < 3 ? 250 : 372}
                  y={[52, 109, 166, 92, 162][i]}
                  width={i < 3 ? 82 : 64}
                  height="34"
                  rx="10"
                />
                <text x={i < 3 ? 291 : 404} y={[74, 131, 188, 114, 184][i]}>
                  {w}
                </text>
              </g>
            ))}
          </g>
          <g className="vector-box">
            <rect x="484" y="91" width="170" height="92" rx="18" />
            <text x="505" y="123">
              VECTOR
            </text>
            <text className="vector-num" x="505" y="155">
              [0, .10, .27]
            </text>
          </g>
          <circle className="spark spark-one" cx="222" cy="54" r="3" />
          <circle className="spark spark-two" cx="433" cy="211" r="4" />
        </svg>
        <div className="art-caption">
          <span className="live-dot" /> One collection. A vocabulary of meaning.
        </div>
      </div>
    );
  if (kind === "idf")
    return (
      <div className="idf-art">
        <div className="idf-docs">
          {docs.length ? (
            docs.slice(0, 4).map((doc: any, di: number) => {
              const has = analysis?.words?.[di]?.includes(selected);
              return (
                <button
                  className="idf-doc"
                  key={doc.id}
                  onClick={() => onWord(selected)}
                >
                  <span className="doc-label">D{di + 1}</span>
                  <span className={`word-token ${has ? "present" : ""}`}>
                    {has ? selected : "···"}
                  </span>
                  <i />
                  <i />
                  <small>{has ? "contains term" : "no match"}</small>
                </button>
              );
            })
          ) : (
            <div className="idf-empty">Add documents to compare rarity</div>
          )}
        </div>
        <div className="rarity-scale">
          <span>COMMON</span>
          <div>
            <b className="scale-pip" />
            <b className="scale-pip mid" />
            <b className="scale-pip high" />
          </div>
          <span>RARE</span>
        </div>
        <div className="rarity-labels">
          <span>
            DF {docs.length}/{docs.length} · IDF low
          </span>
          <span>DF 1/{docs.length} · IDF high</span>
        </div>
      </div>
    );
  if (kind === "tf")
    return (
      <div className="tf-art">
        <div className="tf-paper">
          <span>D1 · PROCESSED TEXT</span>
          <div>
            {(analysis?.words?.[0] || []).map((w: string, i: number) => (
              <button
                className={w === selected ? "counted" : ""}
                key={i}
                onClick={() => onWord(w)}
              >
                {w}
                {w === selected && <i>✓</i>}
              </button>
            ))}
          </div>
        </div>
        <div className="count-result">
          <span>OCCURRENCES OF “{selected.toUpperCase()}”</span>
          <strong>
            {
              (analysis?.words?.[0] || []).filter((w: string) => w === selected)
                .length
            }
            <small>×</small>
          </strong>
          <div>
            {
              (analysis?.words?.[0] || []).filter((w: string) => w === selected)
                .length
            }{" "}
            of {(analysis?.words?.[0] || []).length} processed tokens
          </div>
        </div>
      </div>
    );
  if (kind === "multiply")
    return (
      <div className="multiply-art">
        <button onClick={() => onWord(selected)}>
          <b>TF</b>
          <small>how often here</small>
          <strong>×</strong>
          <em>{fmt(analysis?.tf?.[0]?.[selected] || 0)}</em>
        </button>
        <span className="multiply-sign">×</span>
        <button onClick={() => onWord(selected)}>
          <b>IDF</b>
          <small>how rare overall</small>
          <strong>↗</strong>
          <em>{fmt(analysis?.idf?.[selected] || 0)}</em>
        </button>
        <span className="multiply-sign">=</span>
        <button className="result-tile" onClick={() => onWord(selected)}>
          <b>TF·IDF</b>
          <small>distinctive here</small>
          <strong>✦</strong>
          <em>{fmt(analysis?.matrix?.[0]?.[selected] || 0)}</em>
        </button>
      </div>
    );
  if (kind === "stop")
    return (
      <div className="stop-art">
        <div className="stop-source">
          {["the", "cat", "is", "eating", "and", "fish"].map((w, i) => (
            <button
              className={stops.has(w) ? "filtered" : ""}
              key={i}
              onClick={() => onWord(w)}
            >
              {w}
              {stops.has(w) && <span>×</span>}
            </button>
          ))}
        </div>
        <div className="filter-arrow">
          <span />
          <ArrowDown size={15} />
          <small>FILTER COMMON WORDS</small>
        </div>
        <div className="stop-result">
          <span>cat</span>
          <span>eating</span>
          <span>fish</span>
        </div>
      </div>
    );
  if (kind === "similarity")
    return (
      <div className="sim-art">
        <div className="sim-doc">
          <b>D1</b>
          <span>
            The <strong>cat</strong> eats fish
          </span>
          <code>[.0, .1, .1, .3]</code>
        </div>
        <div className="sim-link">
          <span />
          <strong>0.82</strong>
          <span />
        </div>
        <div className="sim-doc">
          <b>D2</b>
          <span>
            The <strong>cat</strong> likes milk
          </span>
          <code>[.0, .1, .0, .3]</code>
        </div>
      </div>
    );
  if (kind === "textvector")
    return (
      <div className="textvector-art">
        <div className="tv-text">
          “{(docs[0]?.text || "The cat eats fish").slice(0, 42)}”
        </div>
        <ArrowRight size={18} />
        <div className="tv-chips">
          {(vocab.length ? vocab.slice(0, 4) : first).map(
            (w: string, i: number) => (
              <button key={w} onClick={() => onWord(w)}>
                {w}
                <small>{fmt(analysis?.matrix?.[0]?.[w] || 0)}</small>
              </button>
            ),
          )}
        </div>
      </div>
    );
  return (
    <div className="importance-art">
      <div className="importance-words">
        {(vocab.length ? vocab.slice(0, 6) : first).map((w: string) => {
          const score = Math.max(
            ...(analysis?.matrix || []).map((r: any) => r[w] || 0),
            0,
          );
          return (
            <button key={w} onClick={() => onWord(w)}>
              <span>{w}</span>
              <i>
                <b
                  style={{
                    width: `${Math.max(5, Math.min(100, score * 300))}%`,
                  }}
                />
              </i>
              <small>{fmt(analysis?.idf?.[w] || 0)}</small>
            </button>
          );
        })}
      </div>
      <div className="importance-axis">
        <span>COMMON · LOW IDF</span>
        <span>RARE · HIGH IDF</span>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, desc }: any) {
  return (
    <div className="section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
    </div>
  );
}

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [selected, setSelected] = useState("cat");
  const [activeStep, setActiveStep] = useState("TF-IDF");
  const [view, setView] = useState("heatmap");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState(false);
  const [walk, setWalk] = useState(false);
  const [walkStep, setWalkStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [copied, setCopied] = useState(false);
  const [matrixFullscreen, setMatrixFullscreen] = useState(false);
  const matrixRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const sync = () =>
      setMatrixFullscreen(document.fullscreenElement === matrixRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleMatrixFullscreen = async () => {
    if (!matrixRef.current) return;
    try {
      if (document.fullscreenElement === matrixRef.current)
        await document.exitFullscreen();
      else await matrixRef.current.requestFullscreen();
    } catch {
      setMatrixFullscreen(false);
    }
  };
  const data = useMemo(() => analyze(docs, settings), [docs, settings]);
  const allTokens = data.words.flat();
  const selectedDocs = data.words.filter((ws) => ws.includes(selected)).length;
  const selectedIdf = data.idf[selected] || 0;
  const rank = [...data.vocab].sort(
    (a, b) =>
      Math.max(...data.matrix.map((r) => r[b] || 0), 0) -
      Math.max(...data.matrix.map((r) => r[a] || 0), 0),
  );
  const steps = [
    "Raw documents",
    "Tokens",
    "Vocabulary",
    "Term frequency",
    "Document frequency",
    "Inverse document frequency",
    "TF × IDF",
    "Vectors",
  ];
  const addDoc = () =>
    setDocs((d) => [
      ...d,
      { id: Date.now(), name: `Document ${d.length + 1}`, text: "" },
    ]);
  const update = (id: number, key: "text" | "name", value: string) =>
    setDocs((d) => d.map((x) => (x.id === id ? { ...x, [key]: value } : x)));
  const highlight = (word: string) => {
    setSelected(word);
    setActiveStep("TF-IDF");
  };
  const walkCopy = [
    "Find “cat” in the document.",
    "Count its appearances in D1.",
    "Divide by the processed word count.",
    "Count documents containing “cat”.",
    "Rarity is log(N / DF).",
    "Multiply TF by IDF.",
  ];
  const copyFormula = () => {
    navigator.clipboard?.writeText(
      `TF-IDF(${selected}, ${docs[0]?.name || "D1"}) = ${fmt(data.tf[0]?.[selected] || 0)} × ${fmt(selectedIdf)} = ${fmt(data.matrix[0]?.[selected] || 0)}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <main className={theme ? "app light" : "app"}>
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">
            <Activity size={18} />
          </span>
          <span>
            tf<span className="brand-dot">·</span>idf <small>STUDIO</small>
          </span>
        </a>
        <div className="top-center">
          <span className="status-dot" /> Interactive learning environment
        </div>
        <div className="top-actions">
          <button
            className="icon-button"
            title="Glossary"
            onClick={() => setShowGlossary(true)}
          >
            <BookOpen size={16} />
            <span className="hide-mobile">Glossary</span>
          </button>
          <button
            className="icon-button"
            title="Toggle theme"
            onClick={() => setTheme(!theme)}
          >
            {theme ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            className="icon-button"
            title="Reset"
            onClick={() => {
              setDocs(initialDocs());
              setSettings(defaults);
              setSelected("cat");
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </header>
      <div className="page-wrap" id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="overline">
              <Sparkles size={13} /> A VISUAL EXPLORER FOR TEXT
            </div>
            <h1>
              Words have
              <br />
              <span>weight.</span>
            </h1>
            <p>
              See how TF-IDF turns language into meaning. Change a word, add a
              document, follow every number.
            </p>
            <div className="hero-ctas">
              <a className="primary-button" href="#playground">
                Explore your documents <ArrowRight size={16} />
              </a>
              <button
                className="text-button"
                onClick={() => {
                  setWalk(true);
                  setWalkStep(0);
                }}
              >
                <span className="play-icon">▶</span> Walk me through it
              </button>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack">
                <b>t</b>
                <b>f</b>
                <b>·</b>
              </div>
              <span>From plain text to meaningful vectors</span>
            </div>
          </div>
          <Illustration
            kind="hero"
            docs={docs}
            vocab={data.vocab}
            analysis={data}
            onWord={highlight}
          />
        </section>
        <nav className="story-nav" aria-label="Learning path">
          {["TEXT", "LAB", "TF", "IDF", "TF·IDF", "VECTORS", "SIMILARITY"].map(
            (x, i) => (
              <a
                key={x}
                href={
                  [
                    "#playground",
                    "#lab",
                    "#tf",
                    "#idf",
                    "#calculation",
                    "#vectors",
                    "#similarity",
                  ][i]
                }
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {x}
                {i < 6 && <i />}
              </a>
            ),
          )}
        </nav>
        <section className="workspace" id="playground">
          <div className="workspace-heading">
            <div>
              <div className="overline">YOUR PLAYGROUND</div>
              <h2>Start with your words.</h2>
              <p>Every edit recalculates the entire collection in real time.</p>
            </div>
            <div className="workspace-tools">
              <label className="select-wrap">
                <span>Dataset</span>
                <select
                  value="Custom"
                  onChange={(e) => {
                    if (examples[e.target.value])
                      setDocs(
                        examples[e.target.value].map((t, i) => ({
                          id: Date.now() + i,
                          name: `Document ${i + 1}`,
                          text: t,
                        })),
                      );
                  }}
                >
                  {Object.keys(examples).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                  <option>Custom</option>
                </select>
                <ChevronDown size={14} />
              </label>
              <button
                className="secondary-button"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings2 size={15} /> Preprocessing
              </button>
            </div>
          </div>
          <div className="editor-grid">
            <div className="editor-panel">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">DOCUMENTS</span>
                  <h3>
                    Your collection{" "}
                    <span className="count-pill">{docs.length}</span>
                  </h3>
                </div>
                <button className="small-add" onClick={addDoc}>
                  <Plus size={14} /> Add document
                </button>
              </div>
              {docs.length === 0 && (
                <div className="editor-empty">
                  <span>
                    <FileText size={17} />
                  </span>
                  <b>Your workspace is ready.</b>
                  <p>Add a document to begin turning words into weights.</p>
                </div>
              )}
              <div className="doc-list">
                <AnimatePresence initial={false}>
                  {docs.map((doc, i) => (
                    <motion.article
                      layout
                      key={doc.id}
                      initial={reduce ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="document-card"
                    >
                      <div className="document-top">
                        <span className="doc-icon">
                          <FileText size={14} />
                        </span>
                        <input
                          className="doc-name"
                          aria-label="Document name"
                          value={doc.name}
                          onChange={(e) =>
                            update(doc.id, "name", e.target.value)
                          }
                        />
                        <span className="doc-count">
                          {data.words[i]?.length || 0} words
                        </span>
                        <button
                          className="doc-delete"
                          aria-label="Delete document"
                          onClick={() =>
                            setDocs((d) => d.filter((x) => x.id !== doc.id))
                          }
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <textarea
                        aria-label={`${doc.name} text`}
                        value={doc.text}
                        onChange={(e) => update(doc.id, "text", e.target.value)}
                        placeholder="Type or paste text here…"
                      />
                      <div className="doc-bottom">
                        <span>{doc.text.length} characters</span>
                        <button
                          onClick={() =>
                            setDocs((d) =>
                              d.map((x) =>
                                x.id === doc.id ? { ...x, text: "" } : x,
                              ),
                            )
                          }
                        >
                          Clear
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
              <button className="add-wide" onClick={addDoc}>
                <Plus size={15} /> Add another document
              </button>
            </div>
            <aside className="pipeline-panel">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">THE PIPELINE</span>
                  <h3>Follow the transformation</h3>
                </div>
                <button
                  className="help-button"
                  title="What is this?"
                  onClick={() => setShowGlossary(true)}
                >
                  <CircleHelp size={16} />
                </button>
              </div>
              <div className="pipeline">
                {steps.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setActiveStep(s)}
                    className={`pipeline-step ${activeStep === s ? "active" : ""} ${i < 6 ? "has-next" : ""}`}
                  >
                    <span className="step-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="step-name">{s}</span>
                    {i === steps.length - 1 && <Check size={14} />}
                  </button>
                ))}
              </div>
              <div className="pipeline-detail">
                <span className="detail-label">{activeStep.toUpperCase()}</span>
                <p>
                  {activeStep === "Term frequency"
                    ? "How often a word appears in one document, divided by its processed length."
                    : activeStep === "Document frequency"
                      ? "The number of documents that contain this word at least once."
                      : activeStep === "Inverse document frequency"
                        ? "Rarity across the collection: common terms carry less information."
                        : activeStep === "TF × IDF"
                          ? "Multiply local frequency by collection-wide rarity to surface distinctive words."
                          : activeStep === "Vectors"
                            ? "Each document becomes a list of weights, one per vocabulary term."
                            : activeStep === "Tokens"
                              ? "Text is split into individual processed terms."
                              : activeStep === "Vocabulary"
                                ? "The unique set of terms found across all documents."
                                : "Your original documents are the starting point."}
                </p>
              </div>
              <button
                className="walk-link"
                onClick={() => {
                  setWalk(true);
                  setWalkStep(0);
                }}
              >
                Walk through a calculation <ArrowRight size={14} />
              </button>
            </aside>
          </div>
          {showSettings && (
            <div className="settings-panel">
              <div className="settings-title">
                <div>
                  <span className="panel-kicker">PREPROCESSING & SCORING</span>
                  <h3>Shape the text before counting.</h3>
                </div>
                <button onClick={() => setShowSettings(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="settings-options">
                {[
                  ["lowercase", "Lowercase text"],
                  ["punctuation", "Remove punctuation"],
                  ["stopWords", "Remove stop words"],
                  ["numbers", "Remove numbers"],
                ].map(([k, label]) => (
                  <label key={k} className="toggle-row">
                    <span>
                      {label}
                      <small>
                        {k === "stopWords"
                          ? "Filters “the”, “is”, “and”…"
                          : "Applied before token counts and TF."}
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings[k as keyof Settings] as boolean}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, [k]: e.target.checked }))
                      }
                    />
                  </label>
                ))}
                <label className="toggle-row">
                  <span>
                    Minimum word length
                    <small>Shorter terms are excluded.</small>
                  </span>
                  <select
                    value={settings.minLength}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, minLength: +e.target.value }))
                    }
                  >
                    <option value="1">1+ chars</option>
                    <option value="2">2+ chars</option>
                    <option value="3">3+ chars</option>
                  </select>
                </label>
                <label className="toggle-row">
                  <span>
                    Term frequency
                    <small>How to measure within-document frequency.</small>
                  </span>
                  <select
                    value={settings.tf}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        tf: e.target.value as Settings["tf"],
                      }))
                    }
                  >
                    <option value="relative">Relative frequency</option>
                    <option value="count">Raw count</option>
                    <option value="log">Log normalized</option>
                    <option value="binary">Binary</option>
                  </select>
                </label>
                <label className="toggle-row">
                  <span>
                    Inverse document frequency
                    <small>How collection rarity is measured.</small>
                  </span>
                  <select
                    value={settings.idf}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        idf: e.target.value as Settings["idf"],
                      }))
                    }
                  >
                    <option value="standard">Standard IDF</option>
                    <option value="smooth">Smoothed IDF</option>
                  </select>
                </label>
              </div>
              <div className="processed-preview">
                <span>PROCESSED PREVIEW · D1</span>
                <p>
                  {tokens(docs[0]?.text || "", settings).map((w, i) => (
                    <button key={i} onClick={() => highlight(w)}>
                      {w}
                    </button>
                  ))}
                </p>
              </div>
            </div>
          )}
          <div className="metrics-row">
            <div>
              <span>DOCUMENTS</span>
              <strong>{docs.length}</strong>
              <small>in this collection</small>
            </div>
            <div>
              <span>PROCESSED TOKENS</span>
              <strong>{allTokens.length}</strong>
              <small>after preprocessing</small>
            </div>
            <div>
              <span>VOCABULARY</span>
              <strong>{data.vocab.length}</strong>
              <small>unique terms</small>
            </div>
            <div>
              <span>SELECTED TERM</span>
              <strong className="metric-word">{selected || "—"}</strong>
              <small>{selectedDocs} documents contain it</small>
            </div>
          </div>
        </section>

        <Lab />

        <section className="concept-section" id="tf">
          <div className="concept-left">
            <SectionTitle
              eyebrow="01 · TERM FREQUENCY"
              title="How present is a word?"
              desc="Term frequency looks inside one document. A repeated term earns more weight within that document."
            />
            <div className="formula-box">
              <div className="formula-label">
                <span>RELATIVE FREQUENCY</span>
                <button onClick={copyFormula}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}{" "}
                  {copied ? "Copied" : "Copy values"}
                </button>
              </div>
              <div className="math">
                TF(t, d) ={" "}
                <span className="fraction">
                  <b>count of t in d</b>
                  <i />
                  processed terms in d
                </span>
              </div>
              <div className="formula-example">
                <span className="term-pill" onClick={() => highlight(selected)}>
                  {selected}
                </span>
                <span>
                  {data.words[0]?.filter((w: string) => w === selected)
                    .length || 0}{" "}
                  / {data.words[0]?.length || 0}
                </span>
                <b>= {fmt(data.tf[0]?.[selected] || 0)}</b>
              </div>
            </div>
          </div>
          <div className="concept-visual">
            <div className="visual-head">
              <span>COUNTING INSIDE D1</span>
              <span className="legend-dot">{selected}</span>
            </div>
            <Illustration
              kind="tf"
              docs={docs}
              vocab={data.vocab}
              analysis={data}
              onWord={highlight}
            />
            <div className="word-count-row">
              {(data.words[0] || []).slice(0, 9).map((w: string, i: number) => (
                <button
                  key={i}
                  className={w === selected ? "selected" : ""}
                  onClick={() => highlight(w)}
                >
                  {w}
                  <small>
                    {w === selected
                      ? "×" +
                        data.words[0].filter((z: string) => z === w).length
                      : "1"}
                  </small>
                </button>
              ))}
            </div>
            <p className="visual-note">
              Select a word to follow its count. TF divides the count by all{" "}
              <b>processed</b> words.
            </p>
          </div>
        </section>

        <section className="concept-section reverse" id="idf">
          <div className="concept-left">
            <SectionTitle
              eyebrow="02 · INVERSE DOCUMENT FREQUENCY"
              title="How rare is it here?"
              desc="IDF looks across the whole collection. Words found everywhere tell us less about what makes a document unique."
            />
            <div className="formula-box">
              <div className="formula-label">
                <span>
                  {settings.idf === "standard" ? "STANDARD" : "SMOOTHED"} IDF ·
                  LOG BASE 10
                </span>
                <button onClick={copyFormula}>
                  <Copy size={13} /> Copy values
                </button>
              </div>
              <div className="math">
                IDF(t) ={" "}
                {settings.idf === "standard" ? (
                  <>
                    log{" "}
                    <span className="fraction">
                      <b>total documents</b>
                      <i />
                      documents containing t
                    </span>
                  </>
                ) : (
                  <>
                    log (1 +{" "}
                    <span className="fraction">
                      <b>total documents</b>
                      <i>1 + documents containing t</i>
                    </span>
                    )
                  </>
                )}
              </div>
              <div className="formula-example">
                <span>N = {docs.length}</span>
                <span>
                  DF({selected}) = {selectedDocs}
                </span>
                <b>= {fmt(selectedIdf)}</b>
              </div>
            </div>
          </div>
          <div className="concept-visual" id="word-importance">
            <div className="visual-head">
              <span>WORD RARITY</span>
              <span>
                MORE RARE <ArrowRight size={13} />
              </span>
            </div>
            <Illustration
              kind="idf"
              docs={docs}
              vocab={data.vocab}
              analysis={data}
              onWord={highlight}
            />
            <p className="visual-note">
              {selectedDocs === docs.length && docs.length
                ? `“${selected}” appears in every document, so its IDF is ${fmt(selectedIdf)}.`
                : `“${selected}” appears in ${selectedDocs} of ${docs.length} documents. More rare terms receive higher IDF.`}
            </p>
          </div>
        </section>

        <section className="stop-section">
          <div className="stop-copy">
            <span className="section-title">
              <span>PREPROCESSING · STOP WORDS</span>
            </span>
            <h2>Some words take a step back.</h2>
            <p>
              Common words can be filtered out before tokenization. Notice how
              the processed text shrinks, and how its TF denominator changes
              with it.
            </p>
            <label className="inline-toggle">
              Remove stop words{" "}
              <input
                type="checkbox"
                checked={settings.stopWords}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, stopWords: e.target.checked }))
                }
              />
            </label>
          </div>
          <div className="concept-visual stop-visual">
            <div className="visual-head">
              <span>BEFORE → AFTER</span>
              <span>PREPROCESSING</span>
            </div>
            <Illustration
              kind="stop"
              docs={docs}
              vocab={data.vocab}
              analysis={data}
              onWord={highlight}
            />
            <p className="visual-note">
              The terms removed here are excluded from both counts and the TF
              denominator.
            </p>
          </div>
        </section>
        <section className="calculation-section" id="calculation">
          <div className="calculation-heading">
            <SectionTitle
              eyebrow="03 · THE COMBINATION"
              title="Local frequency × global rarity."
              desc="TF-IDF rewards words that matter inside a document and are uncommon across the collection."
            />
            <button
              className="secondary-button"
              onClick={() => {
                setWalk(true);
                setWalkStep(0);
              }}
            >
              <Sparkles size={15} /> Walk me through it
            </button>
          </div>
          <div className="combination-stage">
            <Illustration
              kind="multiply"
              docs={docs}
              vocab={data.vocab}
              analysis={data}
              onWord={highlight}
            />
          </div>
          <div className="equation-strip">
            <span>TF({selected}, D1)</span>
            <b>{fmt(data.tf[0]?.[selected] || 0)}</b>
            <i>×</i>
            <span>IDF({selected})</span>
            <b>{fmt(selectedIdf)}</b>
            <i>=</i>
            <span className="equation-result">TF-IDF</span>
            <strong>{fmt(data.matrix[0]?.[selected] || 0)}</strong>
          </div>
        </section>

        <section className="matrix-section" id="vectors">
          <div className="matrix-heading">
            <SectionTitle
              eyebrow="04 · TEXT BECOMES A VECTOR"
              title="Every document, mapped."
              desc="Each column is a vocabulary term. Each cell is that term’s TF-IDF weight in the document."
            />
            <div className="matrix-controls">
              <label className="search-box">
                <Search size={14} />
                <input
                  placeholder="Find a word"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <select
                value={settings.norm}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    norm: e.target.value as Settings["norm"],
                  }))
                }
              >
                <option value="none">No normalization</option>
                <option value="l1">L1 normalization</option>
                <option value="l2">L2 normalization</option>
              </select>
            </div>
          </div>
          <div className="matrix-card" ref={matrixRef}>
            <div className="matrix-toolbar">
              <div className="view-tabs">
                {["heatmap", "table"].map((x) => (
                  <button
                    className={view === x ? "active" : ""}
                    key={x}
                    onClick={() => setView(x)}
                  >
                    {x === "heatmap" ? "Heatmap" : "Table"}
                  </button>
                ))}
              </div>
              <span>
                TF-IDF MATRIX <i /> click a cell to inspect
              </span>
              <button
                className="small-add export-button"
                onClick={() => {
                  const rows = ["Document", "Word", ...data.vocab];
                  const csv = [
                    rows.join(","),
                    ...docs.map((d, i) =>
                      [
                        d.name,
                        ...data.vocab.map((w) => fmt(data.matrix[i]?.[w] || 0)),
                      ].join(","),
                    ),
                  ].join("\n");
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(
                    new Blob([csv], { type: "text/csv" }),
                  );
                  a.download = "tf-idf-matrix.csv";
                  a.click();
                }}
              >
                Export CSV
              </button>
              <button
                className="small-add fullscreen-button"
                onClick={toggleMatrixFullscreen}
                aria-label={
                  matrixFullscreen
                    ? "Exit fullscreen"
                    : "View matrix fullscreen"
                }
                title={
                  matrixFullscreen
                    ? "Exit fullscreen"
                    : "View matrix fullscreen"
                }
              >
                {matrixFullscreen ? (
                  <Minimize2 size={13} />
                ) : (
                  <Maximize2 size={13} />
                )}
                <span>{matrixFullscreen ? "Exit" : "Fullscreen"}</span>
              </button>
            </div>
            {data.vocab.length === 0 ? (
              <div className="empty-state">
                <span className="empty-graphic">
                  <FileText />
                </span>
                <b>{docs.length ? "No vocabulary yet" : "No documents yet"}</b>
                <p>
                  {docs.length
                    ? "Add text to a document and its terms will appear here."
                    : "Add a document to build your vocabulary."}
                </p>
              </div>
            ) : !data.vocab.some((w: string) =>
                w.toLowerCase().includes(query.toLowerCase()),
              ) ? (
              <div className="empty-state">
                <span className="empty-graphic">
                  <Search />
                </span>
                <b>No matching terms</b>
                <p>Try another search or clear the search field.</p>
              </div>
            ) : (
              <div className="matrix-scroll">
                <table
                  className={`matrix-table ${view === "table" ? "plain-table" : ""}`}
                >
                  <thead>
                    <tr>
                      <th>DOCUMENT</th>
                      {data.vocab
                        .filter((w: string) =>
                          w.toLowerCase().includes(query.toLowerCase()),
                        )
                        .map((w: string) => (
                          <th key={w}>
                            <button
                              className={selected === w ? "selected" : ""}
                              onClick={() => highlight(w)}
                            >
                              {w}
                            </button>
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((d, i) => (
                      <tr key={d.id}>
                        <th>
                          <span className="row-icon">
                            <FileText size={13} />
                          </span>
                          {d.name}
                        </th>
                        {data.vocab
                          .filter((w: string) =>
                            w.toLowerCase().includes(query.toLowerCase()),
                          )
                          .map((w: string) => {
                            const v = data.matrix[i]?.[w] || 0;
                            return (
                              <td key={w}>
                                <button
                                  aria-label={`${d.name} ${w} ${fmt(v)}`}
                                  className={`${selected === w ? "cell-selected" : ""} ${v === 0 ? "zero" : ""}`}
                                  style={
                                    view === "heatmap"
                                      ? ({
                                          "--heat": Math.min(
                                            0.92,
                                            Math.max(0.12, v * 3.5),
                                          ),
                                        } as any)
                                      : undefined
                                  }
                                  onClick={() => highlight(w)}
                                >
                                  <span>{fmt(v)}</span>
                                </button>
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="matrix-foot">
              <span>
                <i className="heat-legend" /> Higher TF-IDF = more distinctive
                in the document
              </span>
              <span>Formula: TF × IDF · log(N / DF)</span>
            </div>
          </div>
          <div className="vector-translation">
            <Illustration
              kind="textvector"
              docs={docs}
              vocab={data.vocab}
              analysis={data}
              onWord={highlight}
            />
          </div>
        </section>

        <VectorLab docs={docs} data={data} rank={rank}/>

   <section className="explore-grid">
          <div className="explore-card" id="vocabulary">
            <div className="card-head">
              <div>
                <span className="panel-kicker">EXPLORE TERMS</span>
                <h3>Vocabulary, ranked.</h3>
              </div>
              <span className="count-pill">{data.vocab.length} terms</span>
            </div>
            <div className="table-head">
              <span>WORD</span>
              <span>DF</span>
              <span>IDF</span>
              <span>MAX TF·IDF</span>
            </div>
            <div className="vocab-list">
              {rank.slice(0, 8).map((w: string, i: number) => (
                <button
                  key={w}
                  className={`vocab-row ${selected === w ? "chosen" : ""}`}
                  onClick={() => highlight(w)}
                >
                  <span>
                    <i>{String(i + 1).padStart(2, "0")}</i>
                    {w}
                  </span>
                  <span>
                    {data.df[w]}/{docs.length}
                  </span>
                  <span>{fmt(data.idf[w])}</span>
                  <span>
                    {fmt(Math.max(...data.matrix.map((r) => r[w] || 0), 0))}
                  </span>
                </button>
              ))}
            </div>
            <div className="card-foot">
              Sorted by maximum TF-IDF score <ArrowRight size={13} />
            </div>
          </div>
          <div className="explore-card importance-card">
            <div className="card-head">
              <div>
                <span className="panel-kicker">AT A GLANCE</span>
                <h3>Word importance</h3>
              </div>
              <span className="rare-badge">
                <span /> COMMON → RARE
              </span>
            </div>
            <Illustration
              kind="importance"
              docs={docs}
              vocab={rank}
              analysis={data}
              onWord={highlight}
            />
            <p className="small-explain">
              High IDF means a word is rarer across the collection. Its TF-IDF
              also depends on how often it appears in each document.
            </p>
          </div>
        </section>

        <section className="lower-story" id="similarity">
          <div className="story-copy">
            <div className="overline">06 · MEANING IN SPACE</div>
            <h2>
              Similar words.
              <br />
              <span>Similar documents.</span>
            </h2>
            <p>
              Once text becomes vectors, cosine similarity measures the angle
              between them. A closer direction means a more similar mix of
              terms.
            </p>
            <button
              className="text-button"
              onClick={() => setShowGlossary(true)}
            >
              What is cosine similarity? <ArrowRight size={14} />
            </button>
          </div>
          <div className="similarity-card">
            <div className="visual-head">
              <span>DOCUMENT SIMILARITY</span>
              <span>Cosine similarity · 0–1</span>
            </div>
            <Illustration
              kind="similarity"
              docs={docs}
              vocab={data.vocab}
              analysis={data}
              onWord={highlight}
            />
            <div className="similarity-matrix">
              <span />
              <span>{docs[0]?.name || "D1"}</span>
              <span>{docs[1]?.name || "D2"}</span>
              <b>{docs[0]?.name || "D1"}</b>
              <strong>1.00</strong>
              <strong>
                {fmt(cosine(data.matrix[0] || {}, data.matrix[1] || {}))}
              </strong>
              <b>{docs[1]?.name || "D2"}</b>
              <strong>
                {fmt(cosine(data.matrix[1] || {}, data.matrix[0] || {}))}
              </strong>
              <strong>1.00</strong>
            </div>
            <p className="similarity-foot">
              Shared direction = overlapping important terms
            </p>
          </div>
        </section>

        <section className="closing">
          <div className="closing-icon">
            <Sparkles size={18} />
          </div>
          <span>THAT’S THE IDEA</span>
          <h2>Text, made measurable.</h2>
          <p>
            Try a different dataset, change the preprocessing, or add a document
            and watch the weights shift.
          </p>
          <button
            className="primary-button"
            onClick={() => {
              setDocs(initialDocs());
              setSettings(defaults);
              setSelected("cat");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Reset the experiment <RotateCcw size={14} />
          </button>
        </section>
        <footer>
          <a className="brand" href="#top">
            <span className="brand-mark">
              <Activity size={16} />
            </span>
            <span>
              tf<span className="brand-dot">·</span>idf <small>STUDIO</small>
            </span>
          </a>
          <span>Made to make the math make sense.</span>
          <button onClick={() => setShowGlossary(true)}>Glossary</button>
        </footer>
      </div>
      <AnimatePresence>
        {walk && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWalk(false)}
          >
            <motion.div
              className="walk-modal"
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setWalk(false)}>
                <X size={17} />
              </button>
              <span className="panel-kicker">
                GUIDED CALCULATION · STEP {walkStep + 1} OF 6
              </span>
              <div className="walk-progress">
                {walkCopy.map((_, i) => (
                  <i key={i} className={i <= walkStep ? "done" : ""} />
                ))}
              </div>
              <div className="walk-icon">
                <Sparkles size={20} />
              </div>
              <h2>{walkCopy[walkStep]}</h2>
              <p>
                {walkStep === 0
                  ? `We’ll follow “${selected}” through ${docs[0]?.name || "D1"} and the whole collection.`
                  : walkStep === 1
                    ? `“${selected}” appears ${data.words[0]?.filter((w: string) => w === selected).length || 0} time(s) in ${docs[0]?.name || "D1"}.`
                    : walkStep === 2
                      ? `There are ${data.words[0]?.length || 0} processed tokens in ${docs[0]?.name || "D1"}.`
                      : walkStep === 3
                        ? `It appears in ${selectedDocs} of ${docs.length} documents.`
                        : walkStep === 4
                          ? `IDF = ${settings.idf === "standard" ? `log(${docs.length} / ${selectedDocs || 1})` : `log(1 + ${docs.length} / (1 + ${selectedDocs}))`} = ${fmt(selectedIdf)}.`
                          : `TF ${fmt(data.tf[0]?.[selected] || 0)} × IDF ${fmt(selectedIdf)} = ${fmt(data.matrix[0]?.[selected] || 0)}.`}
              </p>
              <div className="walk-equation">
                <span>
                  {walkStep < 2
                    ? "COUNT"
                    : walkStep === 2
                      ? "TERM FREQUENCY"
                      : walkStep === 3
                        ? "DOCUMENT FREQUENCY"
                        : walkStep === 4
                          ? "INVERSE DOCUMENT FREQUENCY"
                          : "TF-IDF"}
                </span>
                <b>
                  {walkStep < 2
                    ? `${data.words[0]?.filter((w: string) => w === selected).length || 0} × “${selected}”`
                    : walkStep === 2
                      ? `${data.words[0]?.filter((w: string) => w === selected).length || 0} / ${data.words[0]?.length || 0} = ${fmt(data.tf[0]?.[selected] || 0)}`
                      : walkStep === 3
                        ? `${selectedDocs} / ${docs.length} docs`
                        : walkStep === 4
                          ? `${settings.idf === "standard" ? `log(${docs.length} / ${selectedDocs || 1})` : `log(1 + ${docs.length} / (1 + ${selectedDocs}))`} = ${fmt(selectedIdf)}`
                          : `${fmt(data.tf[0]?.[selected] || 0)} × ${fmt(selectedIdf)} = ${fmt(data.matrix[0]?.[selected] || 0)}`}
                </b>
              </div>
              <div className="modal-actions">
                <button
                  className="text-button"
                  onClick={() => setWalkStep(Math.max(0, walkStep - 1))}
                  disabled={walkStep === 0}
                >
                  Back
                </button>
                <button
                  className="primary-button"
                  onClick={() =>
                    walkStep === 5 ? setWalk(false) : setWalkStep(walkStep + 1)
                  }
                >
                  {walkStep === 5 ? "Finish lesson" : "Next step"}{" "}
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showGlossary && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGlossary(false)}
          >
            <motion.div
              className="glossary-modal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setShowGlossary(false)}
              >
                <X size={17} />
              </button>
              <span className="panel-kicker">A SMALL GLOSSARY</span>
              <h2>Words for the word math.</h2>
              {[
                ["Token", "A single processed word in a document."],
                [
                  "Vocabulary",
                  "The set of all unique tokens in the collection.",
                ],
                [
                  "TF",
                  "How often a term appears in a document, relative to its processed length.",
                ],
                ["DF", "How many documents contain the term at least once."],
                ["IDF", "A rarity score: common terms get less weight."],
                [
                  "TF-IDF",
                  "Term frequency multiplied by inverse document frequency.",
                ],
                ["Vector", "An ordered list of numbers describing a document."],
                [
                  "Cosine similarity",
                  "A score comparing vector direction, from 0 (unrelated) to 1 (same direction).",
                ],
                [
                  "Normalization",
                  "Scaling vector values so documents can be compared on a shared length.",
                ],
                [
                  "Stop words",
                  "Common terms such as “the” or “is”, often filtered before analysis.",
                ],
              ].map(([a, b]) => (
                <div className="glossary-row" key={a}>
                  <b>{a}</b>
                  <p>{b}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
