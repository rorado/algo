'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Doc, analyze, cosine, defaults } from '@/lib/tfidf';

type Data = { vocab: string[]; words: string[][]; matrix: Record<string, number>[] };

const f4 = (n: number) => (Number.isFinite(n) ? n.toFixed(4) : '0.0000');
const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '0.00');
const A_COLOR = 'var(--va)', B_COLOR = 'var(--vb)';
const COLORS = [A_COLOR, B_COLOR, 'var(--vc)', 'var(--vd)', 'var(--ve)', 'var(--vf)'];

const MAXDOCS = 6;
const CSTEPS = ['Vectors', 'Overlap', 'Size', 'Divide', 'Diagram'];
const STEPS = [
  { title: 'Write your documents', short: 'Documents' },
  { title: 'Every word gets a number', short: 'Numbers' },
  { title: 'Put the numbers in a row', short: 'Vector' },
  { title: 'Compare two documents', short: 'Compare' },
  { title: 'Calculate the similarity', short: 'Calculate' },
];

/* ---------- step 4: draggable arrows ---------- */
const S = 480, PAD = 56, SIDE = S - PAD * 2, MAX = 10;
type P = { x: number; y: number };
function Arrows({ a, b, onChange, ro, xl, yl, an, bn, extra = [] }: { a: P; b: P; onChange: (k: 'a' | 'b', p: P) => void; ro?: boolean; xl: string; yl: string; an: string; bn: string; extra?: { p: P; color: string; label: string }[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<'a' | 'b' | null>(null);
  const px = (v: number) => PAD + (v / MAX) * SIDE, py = (v: number) => S - PAD - (v / MAX) * SIDE;
  const move = (e: React.PointerEvent) => {
    if (!active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * S, sy = ((e.clientY - r.top) / r.height) * S;
    const c = (n: number) => Math.round(Math.min(MAX, Math.max(0, n)) * 2) / 2;
    onChange(active, { x: c(((sx - PAD) / SIDE) * MAX), y: c(((S - PAD - sy) / SIDE) * MAX) });
  };
  const arrow = (k: 'a' | 'b', p: P, color: string, label: string) => (
    <g>
      <line x1={px(0)} y1={py(0)} x2={px(p.x)} y2={py(p.y)} style={{ stroke: color }} strokeWidth="5" strokeLinecap="round" />
      <circle cx={px(p.x)} cy={py(p.y)} r="17" fillOpacity=".3" strokeWidth="3" style={{ fill: color, stroke: color, cursor: ro ? 'default' : 'grab', touchAction: 'none' }}
        onPointerDown={e => { if (ro) return; (e.target as Element).setPointerCapture?.(e.pointerId); setActive(k); }} />
      <text x={Math.min(S - 64, Math.max(64, px(p.x)))} y={Math.max(24, py(p.y) - 26)} textAnchor="middle" className="vw-aname" style={{ fill: color }}>{label}</text>
    </g>
  );
  return (
    <svg ref={ref} viewBox={`0 0 ${S} ${S}`} className="vw-plot" onPointerMove={move} onPointerUp={() => setActive(null)} onPointerLeave={() => setActive(null)} role="img" aria-label="Two arrows you can drag">
      {[0, 2.5, 5, 7.5, 10].map(t => <g key={t}><line x1={px(t)} y1={PAD} x2={px(t)} y2={S - PAD} className="vw-grid" /><line x1={PAD} y1={py(t)} x2={S - PAD} y2={py(t)} className="vw-grid" /></g>)}
      <line x1={PAD} y1={S - PAD} x2={S - PAD} y2={S - PAD} className="vw-axis" /><line x1={PAD} y1={S - PAD} x2={PAD} y2={PAD} className="vw-axis" />
      <text x={S / 2} y={S - 14} textAnchor="middle" className="vw-axname">{xl} →</text>
      <text x={16} y={S / 2} textAnchor="middle" className="vw-axname" transform={`rotate(-90 16 ${S / 2})`}>{yl} →</text>
      {extra.map(e => <g key={e.label} opacity=".7">
        <line x1={px(0)} y1={py(0)} x2={px(e.p.x)} y2={py(e.p.y)} style={{ stroke: e.color }} strokeWidth="3" strokeLinecap="round" />
        <circle cx={px(e.p.x)} cy={py(e.p.y)} r="9" style={{ fill: e.color }} />
        <text x={Math.min(S - 64, Math.max(64, px(e.p.x)))} y={Math.max(24, py(e.p.y) + 28)} textAnchor="middle" className="vw-aname" style={{ fill: e.color, fontSize: 14 }}>{e.label}</text>
      </g>)}
      {arrow('a', a, A_COLOR, an)}{arrow('b', b, B_COLOR, bn)}
    </svg>
  );
}

function verdict(sim: number) {
  return sim > 0.9 ? { word: 'Almost the same', tone: 'high' } : sim > 0.6 ? { word: 'Quite similar', tone: 'high' } : sim > 0.3 ? { word: 'A little similar', tone: 'mid' } : sim > 0.05 ? { word: 'Barely similar', tone: 'low' } : { word: 'Nothing in common', tone: 'low' };
}

export default function VectorLab({ docs: initial }: { docs: Doc[]; data?: Data; rank?: string[] }) {
  const [step, setStep] = useState(0);
  const [pick, setPick] = useState(0);
  const [a, setA] = useState(0); const [b, setB] = useState(1);
  const [math, setMath] = useState(false);
  const [texts, setTexts] = useState<string[]>(() => initial.slice(0, MAXDOCS).map(x => x.text));
  const docs: Doc[] = useMemo(() => texts.map((t, i) => ({ id: i, name: `Document ${i + 1}`, text: t })).filter(x => x.text.trim()), [texts]);
  const data = useMemo(() => analyze(docs, defaults), [docs]);
  const [pa, setPa] = useState<P>({ x: 6, y: 3 }); const [pb, setPb] = useState<P>({ x: 3, y: 7 });

  const shown = useMemo(() => {
    const peak = (w: string) => Math.max(0, ...data.matrix.map(r => r[w] || 0));
    return data.vocab.length <= 30 ? data.vocab : [...data.vocab].sort((p, q) => peak(q) - peak(p)).slice(0, 30).sort();
  }, [data]);
  const [wx, setWx] = useState(''); const [wy, setWy] = useState(''); const [free, setFree] = useState(false); const [cs, setCs] = useState(0);
  const ready = docs.length >= 2 && data.vocab.length > 0;
  const setText = (i: number, t: string) => setTexts(x => x.map((y, j) => (j === i ? t : y)));

  const clamp = (i: number) => Math.min(Math.max(0, i), docs.length - 1);
  const d = clamp(pick), ia = clamp(a), ib = docs.length > 1 ? (clamp(b) === ia ? (ia + 1) % docs.length : clamp(b)) : ia;
  const row = data.matrix[d] || {};
  const top = Math.max(0.0001, ...shown.map(w => row[w] || 0));
  const topAB = Math.max(0.0001, ...shown.map(w => Math.max(data.matrix[ia]?.[w] || 0, data.matrix[ib]?.[w] || 0)));

  const ra = data.matrix[ia] || {}, rb = data.matrix[ib] || {};
  const sim = cosine(ra, rb);
  const dot = data.vocab.reduce((n, w) => n + (ra[w] || 0) * (rb[w] || 0), 0);
  const la = Math.sqrt(data.vocab.reduce((n, w) => n + (ra[w] || 0) ** 2, 0)), lb = Math.sqrt(data.vocab.reduce((n, w) => n + (rb[w] || 0) ** 2, 0));
  const v = verdict(sim);

  const byPeak = [...data.vocab].sort((p, q) => Math.max(...data.matrix.map(r => r[q] || 0)) - Math.max(...data.matrix.map(r => r[p] || 0)));
  const pair = useMemo(() => {
    const c = byPeak.slice(0, 12); let best: [string, string] = [byPeak[0] || '', byPeak[1] || byPeak[0] || ''], sc = -1;
    for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) {
      const cover = data.matrix.filter(r => (r[c[i]] || 0) > 0 || (r[c[j]] || 0) > 0).length;
      const mix = data.matrix.filter(r => (r[c[i]] || 0) > 0 && (r[c[j]] || 0) > 0).length;
      const score = cover * 10 - mix;
      if (score > sc) { sc = score; best = [c[i], c[j]]; }
    }
    return best;
  }, [data]);
  const ax = data.vocab.includes(wx) ? wx : pair[0], ay = data.vocab.includes(wy) ? wy : pair[1];
  const raw = { a: { x: ra[ax] || 0, y: ra[ay] || 0 }, b: { x: rb[ax] || 0, y: rb[ay] || 0 } };
  const k = 8 / Math.max(0.0001, ...data.matrix.map(r => Math.max(r[ax] || 0, r[ay] || 0)));
  const extra = docs.map((_, i) => i).filter(i => i !== ia && i !== ib).map(i => ({ p: { x: (data.matrix[i][ax] || 0) * k, y: (data.matrix[i][ay] || 0) * k }, color: COLORS[i % COLORS.length], label: docs[i].name }));
  const RA = { x: raw.a.x * k, y: raw.a.y * k }, RB = { x: raw.b.x * k, y: raw.b.y * k };
  const hits = data.vocab.filter(w => (ra[w] || 0) > 0 && (rb[w] || 0) > 0);
  const dk = 8 / Math.max(0.0001, la, lb), th = Math.acos(Math.min(1, Math.max(-1, sim)));
  const DA = { x: la * dk, y: 0 }, DB = { x: lb * dk * Math.cos(th), y: lb * dk * Math.sin(th) };
  const theta = (th * 180) / Math.PI;
  const [fa, fb] = free ? [pa, pb] : [RA, RB];
  const lFa = Math.hypot(fa.x, fa.y), lFb = Math.hypot(fb.x, fb.y);
  const simP = lFa && lFb ? (fa.x * fb.x + fa.y * fb.y) / (lFa * lFb) : 0, vP = verdict(simP);
  const angle = lFa && lFb ? (Math.acos(Math.min(1, Math.max(-1, simP))) * 180) / Math.PI : 0;

  const Picker = ({ value, onPick, color, skip }: { value: number; onPick: (i: number) => void; color: string; skip?: number }) => (
    <div className="vw-pick">{docs.map((x, i) => <button key={x.id} disabled={i === skip} className={i === value ? 'on' : ''} style={{ ['--c' as any]: color }} onClick={() => onPick(i)}>{x.name}</button>)}</div>
  );

  return (
    <section className="vw" id="vectorlab">
      <span className="vw-kicker">FROM WORDS TO VECTORS · 5 SHORT STEPS</span>
      <ol className="vw-steps" aria-label="Steps">
        {STEPS.map((s, i) => <li key={s.short}><button className={i === step ? 'now' : i < step ? 'done' : ''} onClick={() => setStep(i)}><b>{i + 1}</b><span>{s.short}</span></button></li>)}
      </ol>

      <h2 className="vw-title">{STEPS[step].title}</h2>

      {step === 0 && <div className="vw-body">
        <p className="vw-lead">Type or paste your own text. Each box is one <b>document</b> (a sentence, a message, a paragraph). Use at least <b>2</b>. Everything on the next steps is built from what you write here.</p>
        <div className="vw-docs">
          {texts.map((t, i) => <div key={i} className="vw-doc" style={{ ['--c' as any]: COLORS[i % COLORS.length] }}>
            <label htmlFor={`vw-doc-${i}`}>Document {i + 1}</label>
            <textarea id={`vw-doc-${i}`} rows={2} value={t} placeholder="Write something here…" onChange={e => setText(i, e.target.value)} />
            {texts.length > 2 && <button className="vw-x" aria-label={`Remove document ${i + 1}`} onClick={() => setTexts(x => x.filter((_, j) => j !== i))}>Remove</button>}
          </div>)}
        </div>
        <div className="vw-presets">
          {texts.length < MAXDOCS && <button onClick={() => setTexts(x => [...x, ''])}>+ Add document</button>}
          <button onClick={() => setTexts(initial.slice(0, MAXDOCS).map(x => x.text))}>Reset to examples</button>
        </div>
        <p className={`vw-note ${ready ? '' : 'vw-warn'}`}>{ready ? <>Ready: <b>{docs.length}</b> documents, <b>{data.vocab.length}</b> different words. Press <b>Next</b>.</> : 'Write text in at least 2 documents to continue.'}</p>
      </div>}

      {step > 0 && step < 4 && !ready && <div className="vw-body"><p className="vw-lead">Go back and write text in at least 2 documents first.</p></div>}

      {step === 1 && ready && <div className="vw-body">
        <p className="vw-lead">Pick a document. Each word gets a number that says <b>how important that word is here</b>. A long bar means important. A word gets <b>0</b> if it is missing from this document, or if it is in <b>every</b> document (like “the”), because then it cannot tell them apart.</p>
        <Picker value={d} onPick={setPick} color={COLORS[d % COLORS.length]} />
        <p className="vw-quote">“{docs[d].text || '…'}”</p>
        <ul className="vw-words">
          {shown.map(w => { const n = row[w] || 0; return (
            <li key={w} className={n === 0 ? 'zero' : ''}><b>{w}</b><span className="vw-bar"><i style={{ width: `${(n / top) * 100}%`, background: COLORS[d % COLORS.length] }} /></span><strong>{fmt(n)}</strong>{n === 0 && data.words[d]?.includes(w) && <em className="vw-why">in every document</em>}</li>); })}
        </ul>
      </div>}

      {step === 2 && ready && <div className="vw-body">
        <p className="vw-lead">Now line the numbers up in a row, always in the <b>same word order</b>. That row <b>is</b> the vector. Every document gets its own row.</p>
        <Picker value={d} onPick={setPick} color={COLORS[d % COLORS.length]} />
        <div className="vw-row" style={{ ['--c' as any]: COLORS[d % COLORS.length] }}>
          <span className="vw-br">[</span>
          {shown.map(w => { const n = row[w] || 0; return <div key={w} className={`vw-cell ${n === 0 ? 'zero' : ''}`}><small>{w}</small><strong>{fmt(n)}</strong></div>; })}
          <span className="vw-br">]</span>
        </div>
        <p className="vw-note">A vector is just a list of numbers, one per word. {docs[d].name} has <b>{data.vocab.length}</b> numbers because the collection has <b>{data.vocab.length}</b> different words.</p>
      </div>}

      {step === 3 && ready && <div className="vw-body">
        {docs.length < 2 ? <p className="vw-lead">Add a second document above to compare two.</p> : <>
          <p className="vw-lead">Pick two documents. We compare their rows of numbers. The more their <b>big numbers line up</b>, the more similar they are.</p>
          <div className="vw-two"><div><span style={{ color: A_COLOR }}>Document A</span><Picker value={ia} onPick={setA} color={A_COLOR} skip={ib} /></div><div><span style={{ color: B_COLOR }}>Document B</span><Picker value={ib} onPick={setB} color={B_COLOR} skip={ia} /></div></div>
          <div className="vw-cmp">
            {shown.map(w => <div key={w} className="vw-cmp-row"><b>{w}</b>
              <span className="vw-pair"><i style={{ width: `${((ra[w] || 0) / topAB) * 100}%`, background: A_COLOR }} /><i style={{ width: `${((rb[w] || 0) / topAB) * 100}%`, background: B_COLOR }} /></span>
              <small>{fmt(ra[w] || 0)} · {fmt(rb[w] || 0)}</small></div>)}
          </div>
          <div className={`vw-result ${v.tone}`}><span>SIMILARITY</span><strong>{Math.round(sim * 100)}%</strong><em>{v.word}</em></div>
          <button className="vw-link" onClick={() => setMath(!math)}>{math ? 'Hide the math' : 'Show the math'}</button>
          {math && <div className="vw-math">
            <p>1. Multiply the two numbers of each word, then add them all up: <b>{fmt(dot)}</b></p>
            <p>2. Length of A = <b>{fmt(la)}</b>, length of B = <b>{fmt(lb)}</b></p>
            <p>3. Similarity = {fmt(dot)} / ({fmt(la)} × {fmt(lb)}) = <b>{sim.toFixed(3)}</b></p>
            <p className="vw-small">This is called cosine similarity. 1 = same direction, 0 = nothing in common.</p>
          </div>}
        </>}
      </div>}

      {step === 4 && !ready && <div className="vw-body"><p className="vw-lead">Go back and write text in at least 2 documents first.</p></div>}
      {step === 4 && ready && <div className="vw-body">
        {free ? <>
          <p className="vw-lead">Free arrows: <b>drag the round tips</b>. This is a vector with only 2 numbers, so you can see it. The closer the arrows point the same way, the higher the similarity.</p>
          <div className="vw-free">
            <Arrows a={pa} b={pb} xl="number 1" yl="number 2" an="Vector A" bn="Vector B" onChange={(k, p) => (k === 'a' ? setPa(p) : setPb(p))} />
            <div>
              <div className="vw-presets"><span>Try:</span>
                <button onClick={() => { setPa({ x: 6, y: 3 }); setPb({ x: 3, y: 1.5 }); }}>Same direction</button>
                <button onClick={() => { setPa({ x: 8, y: 0 }); setPb({ x: 0, y: 8 }); }}>Nothing in common</button>
                <button onClick={() => { setPa({ x: 6, y: 3 }); setPb({ x: 3, y: 7 }); }}>In between</button>
              </div>
              <div className={`vw-result ${vP.tone}`}><span>SIMILARITY</span><strong>{Math.round(simP * 100)}%</strong><em>{vP.word}</em></div>
              <p className="vw-note">The angle between the arrows is <b>{angle.toFixed(0)}°</b>. A small angle means high similarity.</p>
            </div>
          </div>
        </> : <>
          <ol className="vw-sub">{CSTEPS.map((t, n) => <li key={t}><button className={n === cs ? 'now' : n < cs ? 'done' : ''} onClick={() => setCs(n)}>{n + 1}. {t}</button></li>)}</ol>
          {cs === 0 && <>
            <p className="vw-lead">Pick the two documents to compare. Each one is a vector: a row of numbers.</p>
            <div className="vw-two"><div><span style={{ color: A_COLOR }}>Vector A</span><Picker value={ia} onPick={setA} color={A_COLOR} skip={ib} /></div><div><span style={{ color: B_COLOR }}>Vector B</span><Picker value={ib} onPick={setB} color={B_COLOR} skip={ia} /></div></div>
            <div className="vw-vec"><span style={{ color: A_COLOR }}>A =</span> [ {data.vocab.map(w => fmt(ra[w] || 0)).join(', ')} ]</div>
            <div className="vw-vec"><span style={{ color: B_COLOR }}>B =</span> [ {data.vocab.map(w => fmt(rb[w] || 0)).join(', ')} ]</div>
          </>}
          {cs === 1 && <>
            <p className="vw-lead">We want to know: <b>do the two documents use the same important words?</b> So for every word, multiply A's number by B's number. If a word is missing in one of them, the result is 0.</p>
            <div className="vw-scroll"><table className="vw-tab vw-wide"><thead><tr><th>word</th><th>A</th><th></th><th>B</th><th></th><th>A × B</th></tr></thead><tbody>
              {data.vocab.map(w => { const x = ra[w] || 0, y = rb[w] || 0; const hit = x > 0 && y > 0; return <tr key={w} className={hit ? 'hit' : 'miss'}><td>{w}</td><td>{f4(x)}</td><td>×</td><td>{f4(y)}</td><td>=</td><td><b>{f4(x * y)}</b></td></tr>; })}
            </tbody></table></div>
            <p className="vw-note">Bright rows are words that <b>both</b> documents have. Only those add something.</p>
            <div className="vw-big">{hits.length ? hits.map(w => f4((ra[w] || 0) * (rb[w] || 0))).join(' + ') : '0'} = <b>{f4(dot)}</b><small>the “dot product”: how much A and B overlap</small></div>
          </>}
          {cs === 2 && <>
            <p className="vw-lead">Next we need the <b>size</b> of each vector, so that long documents do not win just for being long. Square each number, add the squares, take the square root.</p>
            <div className="vw-scroll"><table className="vw-tab vw-wide"><thead><tr><th>word</th><th>A × A</th><th>B × B</th></tr></thead><tbody>
              {data.vocab.map(w => <tr key={w} className={(ra[w] || rb[w]) ? 'hit' : 'miss'}><td>{w}</td><td>{f4((ra[w] || 0) ** 2)}</td><td>{f4((rb[w] || 0) ** 2)}</td></tr>)}
              <tr className="on"><td>Add up</td><td>{f4(la * la)}</td><td>{f4(lb * lb)}</td></tr>
            </tbody></table></div>
            <div className="vw-big"><span style={{ color: A_COLOR }}>|A|</span> = √{f4(la * la)} = <b>{f4(la)}</b></div>
            <div className="vw-big"><span style={{ color: B_COLOR }}>|B|</span> = √{f4(lb * lb)} = <b>{f4(lb)}</b></div>
          </>}
          {cs === 3 && <>
            <p className="vw-lead">Now put it together. Divide the overlap by the two sizes. The result is always between <b>0</b> (nothing in common) and <b>1</b> (same direction).</p>
            <div className="vw-big"><small>Top (overlap, from part 2)</small>{f4(dot)}</div>
            <div className="vw-big"><small>Bottom (size of A × size of B, from part 3)</small>{f4(la)} × {f4(lb)} = {f4(la * lb)}</div>
            <div className="vw-big"><small>Top / Bottom</small>{f4(dot)} / {f4(la * lb)} = <b>{sim.toFixed(3)}</b></div>
            <div className="vw-big"><small>As a percentage (× 100)</small>{sim.toFixed(3)} × 100 = <b>{(sim * 100).toFixed(1)}%</b></div>
            <div className={`vw-result ${v.tone}`}><span>SIMILARITY</span><strong>{Math.round(sim * 100)}%</strong><em>{v.word}</em></div>
          </>}
          {cs === 4 && <>
            <p className="vw-lead">The same two vectors as arrows. The <b>angle</b> between them is <b>{theta.toFixed(0)}°</b>. A small angle means similar documents.</p>
            <div className="vw-free">
              <Arrows a={DA} b={DB} ro xl="" yl="" an={docs[ia].name} bn={docs[ib].name} onChange={() => {}} />
              <div><div className={`vw-result ${v.tone}`}><span>SIMILARITY</span><strong>{Math.round(sim * 100)}%</strong><em>{v.word}</em></div>
                <p className="vw-note">Each arrow's length is the vector's length.</p></div>
            </div>
          </>}
          <div className="vw-subnav">
            <button disabled={cs === 0} onClick={() => setCs(cs - 1)}>← Previous</button>
            <button disabled={cs === CSTEPS.length - 1} onClick={() => setCs(cs + 1)}>Next part →</button>
          </div>
        </>}
        <button className="vw-link" onClick={() => setFree(!free)}>{free ? 'Back to the calculation' : 'See it as arrows (free sandbox)'}</button>
      </div>}

      <div className="vw-nav">
        <button className="vw-back" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={20} /> Back</button>
        <span>Step {step + 1} of {STEPS.length}</span>
        <button className="vw-next" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Next <ArrowRight size={20} /></button>
      </div>
    </section>
  );
}
