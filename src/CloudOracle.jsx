import { useState, useRef, useCallback, useEffect } from "react";
import { readCloudImage } from "./services/oracleClient";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       "#09080A",
  surface:  "#110F14",
  surface2: "#1A1720",
  border:   "rgba(210,190,255,0.08)",
  borderLit:"rgba(210,190,255,0.22)",
  accent:   "#C8A96E",
  accentDim:"rgba(200,169,110,0.15)",
  glow:     "rgba(200,169,110,0.3)",
  text:     "#EEE9F4",
  textMid:  "rgba(238,233,244,0.5)",
  textDim:  "rgba(238,233,244,0.25)",
  omen: {
    auspicious:   { color:"#7EC8A4", hex:"7EC8A4", label:"Auspicious"   },
    mysterious:   { color:"#A48BE0", hex:"A48BE0", label:"Mysterious"   },
    cautionary:   { color:"#E08B6A", hex:"E08B6A", label:"Cautionary"   },
    transcendent: { color:"#6ABBE0", hex:"6ABBE0", label:"Transcendent" },
  }
};

const FONT_D = "'Cormorant Garamond','Palatino Linotype',Georgia,serif";
const FONT_M = "'DM Mono','Courier New',monospace";

const serif  = (sz, w=300, x={}) => ({ fontFamily:FONT_D, fontSize:sz, fontWeight:w, ...x });
const mono   = (sz, x={})        => ({ fontFamily:FONT_M, fontSize:sz, ...x });
const lbl    = (x={})            => ({ fontFamily:FONT_M, fontSize:9,  letterSpacing:"0.2em",
                                       textTransform:"uppercase", color:C.textDim, ...x });

// ─── Scan phases ──────────────────────────────────────────────────────────────
const PHASES = [
  { text:"Locating cloud boundary",      ms:800  },
  { text:"Mapping formation vectors",    ms:1100 },
  { text:"Cross-referencing almanac",    ms:1200 },
  { text:"Interpreting symbolic form",   ms:1000 },
  { text:"Composing your reading",       ms:900  },
];

// ─── Complete system prompt encoding all logic from the design document ───────
const SYSTEM = `You are the Sun Oracle — an ancient, poetic cloud-reader. You speak in a measured, intimate, occasionally dry voice. You never use exclamation points, never use the word "journey", and always address the reader as "you", never "one".

STEP 1 — INTERNAL REASONING (do this silently before writing JSON):
Reason through these in order:
1. What do I see? (plain description)
2. Altitude band? (high >6000m / mid 2000-6000m / low <2000m / vertical)
3. Texture and form? (fibrous/wispy = cirrus; smooth sheet = stratus/altostratus; heaped puffs = cumulus; towering column = cumulonimbus; tiny regular puffs = cirrocumulus/altocumulus; lens = lenticular; hanging pouches = mammatus; chaotic undulation = asperitas)
4. Edge definition? (sharp crisp = convective cumulus/Cb; blurry dissolving = stratiform/ice crystal)
5. Sky coverage? (overcast >90% / broken 50-90% / scattered 10-50% / few <10%)
6. Best cloud type? (commit to one)
7. Primary omen from cloud type:
   - Cirrus → transcendent (high ice crystals, infinite, departure)
   - Cirrostratus → transcendent (thin veil, worlds overlapping)
   - Cirrocumulus → auspicious (fish-scale sky, fair weather sign)
   - Altostratus → mysterious (grey veil, things hidden)
   - Altocumulus → mysterious (transition, neither clear nor storm)
   - Altocumulus lenticularis → transcendent (rupture in ordinary, alien)
   - Nimbostratus → cautionary (active rain, something must release)
   - Stratus → cautionary (stagnation, stuck energy)
   - Stratocumulus → mysterious (partly revealed, secrets half-told)
   - Cumulus (fair weather) → auspicious (energy, optimism, begin now)
   - Cumulus congestus → cautionary (building pressure not yet discharged)
   - Cumulonimbus → cautionary (disruption, transformation through force)
   - Mammatus → transcendent (sky inverted, reversal)
   - Asperitas → mysterious (subconscious made visible)
   - Clear sky (no clouds) → transcendent (absolute clarity, the rarest formation)
   - Unknown / non-sky → mysterious (default)
8. Light modulation:
   - Golden hour warm orange/red → shift toward auspicious
   - Blue hour / twilight deep blue-purple → shift toward transcendent
   - Storm light (green-yellow) → reinforce cautionary
   - Heavy rain, very dark → override to cautionary unless already transcendent
   - Dawn pink-peach → shift toward auspicious
9. What shape does the dominant cloud silhouette suggest? (trace outer boundary only; categories: creature / human figure / symbolic object / landscape form / abstract archetype)
10. Which symbol archetype?
   - Bird/wings → The Messenger (news, threshold, journey beginning)
   - Dragon/serpent → The Ouroboros (cycles, transformation, endings feeding beginnings)
   - Horse/charging → The Charioteer (momentum, willpower)
   - Ship/vessel → The Ark (passage through difficulty)
   - Mountain/peak → The Axis Mundi (where earth meets sky)
   - Wave/water → The Deep (unconscious surfacing)
   - Eye/watching → The Witness (being seen, awareness itself)
   - Human standing → The Wanderer (chosen solitude, self-reliance)
   - Two forms → The Twins (duality, partnership)
   - Doorway/arch → The Threshold (imminent transition)
   - Spiral/curl → The Labyrinth (path inward, complexity resolving)
   - Hand/reaching → The Offering (something given or received)
   - Formless → The Void (pure potential)

STEP 2 — OUTPUT (only after reasoning above):
Respond ONLY with a valid JSON object. No markdown, no preamble, no text outside the JSON.

COHERENCE RULES (strictly enforce):
- fortune emotional register MUST match omen (auspicious=weight+forward momentum; mysterious=depth+ambiguity; cautionary=tension+transformation; transcendent=elevation+infinite)
- shadow_warning MUST be the specific inverse of fortune's primary gift
- shape_seen, symbol_title, symbol_meaning MUST all describe the same form
- ritual MUST be performable today without equipment, and feel worth doing in itself

QUALITY RULES:
- fortune: 3-4 sentences, second person, specific not generic, slightly uncanny — the reader should feel it is too accurate to be coincidence
- sky_reading: 1 sentence emotional/poetic, no meteorological terms, like describing a person's emotional state not weather
- ritual: odd enough to be memorable, simple enough to do today
- For non-sky images: set formation_name to something like "The Mirror Turned Inward", read the image's shapes as if they were clouds
- For clear sky: formation_name="The Great Absence", latin_name="Vacuus infinitus", rarity="Extremely Rare", omen="transcendent"

JSON SCHEMA:
{
  "formation_name": "string — poetic 2-5 word title-case name",
  "latin_name": "string — faux-Latin binomial like 'Cumulus philosophicus'",
  "rarity": "one of: Common | Uncommon | Rare | Extremely Rare",
  "shape_seen": "string — 1 sentence, vivid, present tense, what figure you see in the cloud silhouette",
  "omen": "one of: auspicious | mysterious | cautionary | transcendent",
  "symbol_title": "string — archetype name like 'The Messenger'",
  "symbol_meaning": "string — 2-3 sentences, mythological register, cross-cultural if possible",
  "fortune": "string — 3-4 sentences, second person, uncanny, specific to this cloud type's character",
  "shadow_warning": "string — 1-2 sentences, gentle, inverse of fortune's gift",
  "ritual": "string — 1-2 sentences, performable today, oddly specific",
  "cloud_type": "string — official meteorological name, or 'Unknown'",
  "sky_reading": "string — 1 poetic sentence describing sky's emotional mood"
}`;

// ─── Shared card style ────────────────────────────────────────────────────────
const card = (extra={}) => ({
  background: C.surface, border:`1px solid ${C.border}`,
  borderRadius:20, padding:24, ...extra
});

// ═════════════════════════════════════════════════════════════════════════════
export default function CloudOracle() {
  const [phase,    setPhase]    = useState("idle");
  const [imgSrc,   setImgSrc]   = useState(null);
  const [imgB64,   setImgB64]   = useState(null);
  const [imgMime,  setImgMime]  = useState("image/jpeg");
  const [scanStep, setScanStep] = useState(0);
  const [scanPct,  setScanPct]  = useState(0);
  const [reading,  setReading]  = useState(null);
  const [revealed, setRevealed] = useState(0);
  const fileRef = useRef();
  const animRef = useRef();
  const revealRef = useRef();

  useEffect(() => () => {
    clearInterval(animRef.current);
    clearInterval(revealRef.current);
  }, []);

  // ── File ingestion ─────────────────────────────────────────────────────────
  const ingest = (file) => {
    if (!file?.type?.startsWith("image/")) return;
    const mime = file.type;
    const r = new FileReader();
    r.onload = (e) => {
      setImgSrc(e.target.result);
      setImgB64(e.target.result.split(",")[1]);
      setImgMime(mime);
      setPhase("preview");
    };
    r.readAsDataURL(file);
  };

  // ── Scan animation ─────────────────────────────────────────────────────────
  const runAnim = useCallback((onDone) => {
    let step = 0;
    setScanStep(0); setScanPct(0);
    const nextStep = () => {
      if (step >= PHASES.length) { onDone(); return; }
      const ticks = PHASES[step].ms / 40;
      let t = 0;
      const iv = setInterval(() => {
        t++;
        setScanPct(Math.round((t / ticks) * 100));
        if (t >= ticks) {
          clearInterval(iv);
          step++;
          setScanStep(step);
          setScanPct(0);
          nextStep();
        }
      }, 40);
      animRef.current = iv;
    };
    nextStep();
  }, []);

  // ── Oracle API call ────────────────────────────────────────────────────────
  const beginReading = () => {
    setPhase("scanning");
    setRevealed(0);
    setReading(null);

    let animDone = false, apiDone = false, result = null;

    const tryShow = () => {
      if (!animDone || !apiDone) return;
      if (result) {
        setReading(result);
        setPhase("reading");
        let r = 0;
        const iv = setInterval(() => {
          r++; setRevealed(r);
          if (r >= 7) clearInterval(iv);
        }, 360);
        revealRef.current = iv;
      } else {
        setPhase("error");
      }
    };

    runAnim(() => { animDone = true; tryShow(); });

    (async () => {
      try {
        result = await readCloudImage({ imageBase64: imgB64, imageMime: imgMime, systemPrompt: SYSTEM });
      } catch(e) { console.error(e); }
      apiDone = true; tryShow();
    })();
  };

  const reset = () => {
    clearInterval(animRef.current);
    clearInterval(revealRef.current);
    setPhase("idle"); setImgSrc(null); setImgB64(null);
    setReading(null); setRevealed(0); setScanStep(0); setScanPct(0);
  };

  const omenStyle = reading ? (C.omen[reading.omen] || C.omen.mysterious) : C.omen.mysterious;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        input[type=file]{display:none;}
        ::-webkit-scrollbar{width:0;}
        input[type=range]{accent-color:${C.accent};}

        @keyframes fadeUp {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn {from{opacity:0}to{opacity:1}}
        @keyframes scanline{0%{transform:translateY(-100%);opacity:.7}100%{transform:translateY(500%);opacity:0}}
        @keyframes blink{0%,100%{opacity:.3}50%{opacity:1}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 20px ${C.glow}}50%{box-shadow:0 0 50px ${C.glow},0 0 90px rgba(200,169,110,.15)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}

        .r1{animation:fadeUp .5s ease .00s both}
        .r2{animation:fadeUp .5s ease .10s both}
        .r3{animation:fadeUp .5s ease .20s both}
        .r4{animation:fadeUp .5s ease .30s both}
        .r5{animation:fadeUp .5s ease .40s both}
        .r6{animation:fadeUp .5s ease .50s both}
        .r7{animation:fadeUp .5s ease .60s both}
      `}</style>

      <div style={{
        background:C.bg, minHeight:"100vh", maxWidth:440, margin:"0 auto",
        display:"flex", flexDirection:"column", fontFamily:FONT_M, color:C.text,
        position:"relative"
      }}>
        {/* Ambient glow */}
        <div style={{
          position:"fixed", inset:0, maxWidth:440, margin:"0 auto", pointerEvents:"none", zIndex:0,
          background:"radial-gradient(ellipse 80% 40% at 50% 0%, rgba(200,169,110,0.07) 0%, transparent 65%)"
        }}/>

        {/* ── Header ── */}
        <header style={{
          padding:"28px 26px 20px", borderBottom:`1px solid ${C.border}`,
          display:"flex", justifyContent:"space-between", alignItems:"flex-end", zIndex:1
        }}>
          <div>
            <div style={{ ...serif(11,400), letterSpacing:"0.28em", color:C.textDim, textTransform:"uppercase", marginBottom:6 }}>
              ✦ &nbsp; Sun Oracle
            </div>
            <div style={{ ...serif(36,300), lineHeight:1, letterSpacing:"-0.02em" }}>
              Cloud Reading
            </div>
          </div>
          {phase !== "idle" && (
            <button onClick={reset} style={{
              background:"none", border:`1px solid ${C.border}`, color:C.textDim,
              borderRadius:10, padding:"6px 14px", ...mono(10), cursor:"pointer", letterSpacing:"0.1em"
            }}>← new</button>
          )}
        </header>

        <div style={{ flex:1, overflowY:"auto", padding:"24px 20px 56px", zIndex:1 }}>

          {/* ══════════════════════════════════════════════════════════════════
              IDLE
          ══════════════════════════════════════════════════════════════════ */}
          {phase === "idle" && (
            <div style={{ animation:"fadeIn .5s ease" }}>
              {/* Hero upload area */}
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={e=>{e.preventDefault();ingest(e.dataTransfer.files[0]);}}
                onDragOver={e=>e.preventDefault()}
                style={{
                  height:230, borderRadius:22, marginBottom:28, cursor:"pointer",
                  background:"linear-gradient(175deg,#0A0E18 0%,#141B2A 60%,#1C2535 100%)",
                  border:`1px solid ${C.border}`, position:"relative", overflow:"hidden",
                  animation:"floatY 5s ease-in-out infinite"
                }}
              >
                {/* Stars */}
                {[{x:12,y:15,s:1.5},{x:68,y:10,s:1},{x:84,y:24,s:1.5},{x:40,y:7,s:1},{x:55,y:20,s:1},{x:25,y:32,s:1.2},{x:78,y:40,s:1},{x:92,y:14,s:1.2}].map((st,i)=>(
                  <div key={i} style={{
                    position:"absolute", left:`${st.x}%`, top:`${st.y}%`,
                    width:st.s, height:st.s, borderRadius:"50%",
                    background:"rgba(238,233,244,0.45)"
                  }}/>
                ))}
                {/* Soft cloud glow */}
                <div style={{
                  position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)",
                  width:200, height:80,
                  background:`radial-gradient(ellipse, ${C.accentDim} 0%, transparent 70%)`,
                  filter:"blur(16px)"
                }}/>
                {/* Corner scan marks */}
                {[{t:14,l:14},{t:14,r:14},{b:14,l:14},{b:14,r:14}].map((p,i)=>(
                  <div key={i} style={{
                    position:"absolute", top:p.t, bottom:p.b, left:p.l, right:p.r,
                    width:20, height:20,
                    borderTop:    i<2  ? `1.5px solid ${C.accent}` :"none",
                    borderBottom: i>=2 ? `1.5px solid ${C.accent}` :"none",
                    borderLeft:   i%2===0 ? `1.5px solid ${C.accent}` :"none",
                    borderRight:  i%2===1 ? `1.5px solid ${C.accent}` :"none",
                    opacity:.45, animation:`blink 2.5s ease ${i*.6}s infinite`
                  }}/>
                ))}
                <div style={{
                  position:"absolute", inset:0, display:"flex",
                  flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10
                }}>
                  <div style={{ fontSize:44, opacity:.7 }}>☁</div>
                  <div style={{ ...mono(12), color:C.textMid }}>Drop your sky photo here</div>
                  <div style={{ ...lbl() }}>or tap to browse</div>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={e=>ingest(e.target.files[0])}/>

              {/* Intro text */}
              <div style={{ textAlign:"center", marginBottom:32 }}>
                <div style={{ ...serif(21,300), lineHeight:1.5, marginBottom:10, color:C.text }}>
                  Photograph the sky.<br/>
                  <span style={{ fontStyle:"italic", color:C.textMid }}>The clouds will speak.</span>
                </div>
                <div style={{ ...mono(11), color:C.textDim, lineHeight:1.85 }}>
                  The Oracle classifies your cloud formation,<br/>
                  reads its shape, and composes a personal fortune.
                </div>
              </div>

              {/* Omen legend */}
              <div style={{ marginBottom:8, ...lbl({ marginBottom:12 }) }}>Four possible omens</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {Object.entries(C.omen).map(([k,v])=>(
                  <div key={k} style={{
                    background:C.surface, border:`1px solid ${C.border}`,
                    borderRadius:14, padding:"14px 16px",
                    display:"flex", flexDirection:"column", gap:6
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:v.color }}/>
                      <div style={{ ...lbl({ color:v.color, letterSpacing:"0.14em" }) }}>{v.label}</div>
                    </div>
                    <div style={{ ...mono(10), color:C.textDim, lineHeight:1.5 }}>
                      { k==="auspicious"   ? "Forward momentum, growth, right timing"
                      : k==="mysterious"   ? "Depth, ambiguity, the half-revealed"
                      : k==="cautionary"   ? "Tension, transformation through pressure"
                      :                      "Elevation, the infinite, beyond ordinary" }
                    </div>
                  </div>
                ))}
              </div>

              {/* Logic summary */}
              <div style={{ ...card({ marginTop:20, padding:"20px 20px" }) }}>
                <div style={{ ...lbl({ marginBottom:14 }) }}>How the Oracle reads your sky</div>
                {[
                  ["① Cloud Classification", "Identifies type via altitude, texture, edge definition & coverage"],
                  ["② Omen Derivation",       "Maps cloud type to omen; modulates by sky light & colour"],
                  ["③ Shape Reading",         "Reads the dominant cloud silhouette for a mythological figure"],
                  ["④ Fortune Composition",   "Generates reading coherent with cloud type, omen & symbol"],
                ].map(([title, desc])=>(
                  <div key={title} style={{
                    display:"flex", gap:12, padding:"10px 0",
                    borderBottom:`1px solid ${C.border}`
                  }}>
                    <div style={{ ...mono(10), color:C.accent, minWidth:36, flexShrink:0 }}>
                      {title.slice(0,1)}
                    </div>
                    <div>
                      <div style={{ ...mono(11), color:C.text, marginBottom:3 }}>{title.slice(2)}</div>
                      <div style={{ ...mono(10), color:C.textDim, lineHeight:1.6 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PREVIEW
          ══════════════════════════════════════════════════════════════════ */}
          {phase === "preview" && (
            <div style={{ animation:"fadeIn .4s ease" }}>
              <div style={{ ...lbl({ marginBottom:14 }) }}>Your sky — ready to read</div>
              <div style={{
                borderRadius:20, overflow:"hidden",
                border:`1px solid ${C.border}`, marginBottom:22,
                position:"relative"
              }}>
                <img src={imgSrc} alt="sky" style={{ width:"100%", maxHeight:290, objectFit:"cover", display:"block" }}/>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 55%, rgba(9,8,10,.65) 100%)" }}/>
              </div>
              <div style={{ ...serif(16,300,{ color:C.textMid, lineHeight:1.75, marginBottom:28, fontStyle:"italic" }) }}>
                The Oracle will examine your cloud formation through four properties — altitude, texture, edge definition, and coverage — before deriving your omen and composing a personal reading.
              </div>
              <button onClick={beginReading} style={{
                width:"100%", background:C.accent, color:C.bg,
                border:"none", borderRadius:16, padding:"18px",
                ...mono(12), fontWeight:500, letterSpacing:"0.12em",
                cursor:"pointer", textTransform:"uppercase",
                animation:"pulseGlow 2.5s ease infinite"
              }}>✦ &nbsp; Begin the Reading</button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SCANNING
          ══════════════════════════════════════════════════════════════════ */}
          {phase === "scanning" && (
            <div style={{ animation:"fadeIn .4s ease" }}>
              {/* Image with overlay */}
              <div style={{
                borderRadius:20, overflow:"hidden",
                border:`1px solid ${C.borderLit}`, marginBottom:26,
                position:"relative", height:220
              }}>
                <img src={imgSrc} alt="sky" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:.55 }}/>
                {/* Scanline */}
                <div style={{
                  position:"absolute", left:0, right:0, top:0, height:"22%",
                  background:"linear-gradient(to bottom, transparent, rgba(200,169,110,.18), transparent)",
                  animation:"scanline 1.9s linear infinite"
                }}/>
                {/* Grid */}
                <div style={{
                  position:"absolute", inset:0,
                  backgroundImage:`linear-gradient(${C.border} 1px,transparent 1px),linear-gradient(90deg,${C.border} 1px,transparent 1px)`,
                  backgroundSize:"30px 30px"
                }}/>
                {/* Corner marks */}
                {[{t:10,l:10},{t:10,r:10},{b:10,l:10},{b:10,r:10}].map((p,i)=>(
                  <div key={i} style={{
                    position:"absolute", top:p.t,bottom:p.b,left:p.l,right:p.r,
                    width:20, height:20,
                    borderTop:    i<2    ?`2px solid ${C.accent}`:"none",
                    borderBottom: i>=2   ?`2px solid ${C.accent}`:"none",
                    borderLeft:   i%2===0?`2px solid ${C.accent}`:"none",
                    borderRight:  i%2===1?`2px solid ${C.accent}`:"none",
                  }}/>
                ))}
                {/* Crosshair */}
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ position:"relative", width:44, height:44 }}>
                    <div style={{ position:"absolute", top:"50%", left:0, right:0, height:1, background:C.accent, opacity:.4 }}/>
                    <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:1, background:C.accent, opacity:.4 }}/>
                    <div style={{
                      position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
                      width:10, height:10, borderRadius:"50%",
                      border:`1.5px solid ${C.accent}`, animation:"spin 2s linear infinite"
                    }}/>
                  </div>
                </div>
              </div>

              {/* Phase list */}
              <div style={{ marginBottom:28 }}>
                {PHASES.map((ph,i)=>{
                  const done   = i < scanStep;
                  const active = i === scanStep;
                  return (
                    <div key={i} style={{
                      display:"flex", alignItems:"center", gap:14,
                      padding:"12px 0", borderBottom:`1px solid ${C.border}`,
                      opacity: done?.45 : active?1:.2, transition:"opacity .3s"
                    }}>
                      <div style={{
                        width:18, height:18, borderRadius:"50%", flexShrink:0,
                        border:`1.5px solid ${done||active?C.accent:C.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        background: done?C.accent:"transparent", transition:"all .3s"
                      }}>
                        {done  && <div style={{ width:6,height:6,borderRadius:"50%",background:C.bg }}/>}
                        {active&& <div style={{ width:6,height:6,borderRadius:"50%",background:C.accent,animation:"spin 1s linear infinite" }}/>}
                      </div>
                      <div style={{ ...mono(11), color:active?C.text:C.textMid, flex:1 }}>{ph.text}</div>
                      {active && <div style={{ ...lbl({ color:C.accent }) }}>{scanPct}%</div>}
                      {done   && <div style={{ ...lbl({ color:C.accent }) }}>done</div>}
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign:"center", ...serif(15,300,{ color:C.textDim, fontStyle:"italic" }) }}>
                The Oracle is reading your sky…
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              READING
          ══════════════════════════════════════════════════════════════════ */}
          {phase === "reading" && reading && (() => {
            const om = C.omen[reading.omen] || C.omen.mysterious;
            return (
              <div>
                {/* 1 — Sky photo + overlay */}
                {revealed>=1 && (
                  <div className="r1" style={{
                    borderRadius:18, overflow:"hidden", height:140, marginBottom:20,
                    border:`1px solid ${C.border}`, position:"relative"
                  }}>
                    <img src={imgSrc} alt="sky" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(9,8,10,.72) 0%,transparent 45%,transparent 55%,rgba(9,8,10,.72) 100%)" }}/>
                    <div style={{
                      position:"absolute", inset:0, display:"flex",
                      alignItems:"center", justifyContent:"center", padding:"0 20px"
                    }}>
                      <div style={{ ...serif(17,300,{ color:C.text, fontStyle:"italic", textAlign:"center", lineHeight:1.5 }) }}>
                        {reading.sky_reading}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2 — Formation header */}
                {revealed>=2 && (
                  <div className="r2" style={{ ...card({ marginBottom:14 }) }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                      <div style={{ flex:1, paddingRight:12 }}>
                        <div style={{ ...lbl({ marginBottom:8 }) }}>Formation Identified</div>
                        <div style={{ ...serif(26,300,{ lineHeight:1.1 }) }}>{reading.formation_name}</div>
                        <div style={{ ...mono(10,{ color:C.textDim, marginTop:5, fontStyle:"italic" }) }}>{reading.latin_name}</div>
                      </div>
                      <div style={{
                        background:C.accentDim, border:`1px solid rgba(200,169,110,.2)`,
                        borderRadius:12, padding:"8px 14px", textAlign:"center", flexShrink:0
                      }}>
                        <div style={{ ...lbl({ color:C.accent, marginBottom:3 }) }}>{reading.rarity}</div>
                        <div style={{ ...mono(9,{ color:C.textDim }) }}>{reading.cloud_type}</div>
                      </div>
                    </div>
                    {/* Omen badge */}
                    <div style={{
                      display:"inline-flex", alignItems:"center", gap:8,
                      border:`1px solid ${om.color}22`, background:`${om.color}11`,
                      borderRadius:50, padding:"7px 16px"
                    }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:om.color }}/>
                      <div style={{ ...lbl({ color:om.color, letterSpacing:"0.14em" }) }}>
                        {om.label} Omen
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 — Shape seen */}
                {revealed>=3 && (
                  <div className="r3" style={{ ...card({ marginBottom:14 }) }}>
                    <div style={{ ...lbl({ marginBottom:10 }) }}>Shape Seen</div>
                    <div style={{ ...serif(17,300,{ fontStyle:"italic", lineHeight:1.65 }) }}>
                      "{reading.shape_seen}"
                    </div>
                  </div>
                )}

                {/* 4 — Symbol */}
                {revealed>=4 && (
                  <div className="r4" style={{ ...card({ marginBottom:14 }) }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <div style={{ ...lbl() }}>Ancient Symbol</div>
                      <div style={{ ...serif(13,400,{ color:C.accent }) }}>{reading.symbol_title}</div>
                    </div>
                    <div style={{ ...mono(12,{ color:C.textMid, lineHeight:1.8 }) }}>
                      {reading.symbol_meaning}
                    </div>
                  </div>
                )}

                {/* 5 — Fortune (hero) */}
                {revealed>=5 && (
                  <div className="r5" style={{
                    background:`linear-gradient(148deg,${C.surface2} 0%,${C.surface} 100%)`,
                    border:`1px solid ${C.borderLit}`,
                    borderRadius:20, padding:"28px 24px", marginBottom:14,
                    position:"relative", overflow:"hidden"
                  }}>
                    <div style={{
                      position:"absolute", top:-50, right:-50, width:180, height:180,
                      borderRadius:"50%",
                      background:`radial-gradient(circle,rgba(${parseInt(om.color.slice(1,3),16)},${parseInt(om.color.slice(3,5),16)},${parseInt(om.color.slice(5,7),16)},0.12) 0%,transparent 70%)`,
                      pointerEvents:"none"
                    }}/>
                    <div style={{ ...lbl({ color:C.accent, marginBottom:16 }) }}>✦ &nbsp; Your Fortune</div>
                    <div style={{ ...serif(19,300,{ lineHeight:1.8, fontStyle:"italic" }) }}>
                      {reading.fortune}
                    </div>
                  </div>
                )}

                {/* 6 — Shadow warning */}
                {revealed>=6 && (
                  <div className="r6" style={{ ...card({ marginBottom:14 }) }}>
                    <div style={{ ...lbl({ color:"rgba(224,139,106,.55)", marginBottom:10 }) }}>Shadow Warning</div>
                    <div style={{ ...mono(12,{ color:C.textMid, lineHeight:1.75 }) }}>
                      {reading.shadow_warning}
                    </div>
                  </div>
                )}

                {/* 7 — Ritual + actions */}
                {revealed>=7 && (
                  <>
                    <div className="r7" style={{ ...card({ marginBottom:22 }) }}>
                      <div style={{ ...lbl({ marginBottom:10 }) }}>Today's Sun Ritual</div>
                      <div style={{ ...serif(15,300,{ lineHeight:1.75, fontStyle:"italic" }) }}>
                        {reading.ritual}
                      </div>
                    </div>
                    <div className="r7" style={{ display:"flex", gap:10 }}>
                      <button onClick={()=>{setPhase("preview");setRevealed(0);setReading(null);}} style={{
                        flex:1, background:C.accent, color:C.bg, border:"none",
                        borderRadius:14, padding:"15px",
                        ...mono(11), fontWeight:500, letterSpacing:"0.1em",
                        cursor:"pointer", textTransform:"uppercase"
                      }}>Read Again</button>
                      <button onClick={reset} style={{
                        flex:1, background:"none", color:C.textMid,
                        border:`1px solid ${C.border}`, borderRadius:14, padding:"15px",
                        ...mono(11), cursor:"pointer", letterSpacing:"0.1em", textTransform:"uppercase"
                      }}>New Sky</button>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════════════
              ERROR
          ══════════════════════════════════════════════════════════════════ */}
          {phase === "error" && (
            <div style={{ padding:"48px 0", textAlign:"center", animation:"fadeIn .4s ease" }}>
              <div style={{ fontSize:40, marginBottom:16 }}>⚠</div>
              <div style={{ ...serif(22,300,{ marginBottom:12 }) }}>The Oracle fell silent</div>
              <div style={{ ...mono(12,{ color:C.textMid, lineHeight:1.7, marginBottom:32 }) }}>
                The clouds could not be read at this time.<br/>
                Perhaps the sky holds its secrets a little longer.
              </div>
              <button onClick={()=>setPhase("preview")} style={{
                background:C.accent, color:C.bg, border:"none",
                borderRadius:14, padding:"14px 36px",
                ...mono(11), fontWeight:500, letterSpacing:"0.1em",
                cursor:"pointer", textTransform:"uppercase"
              }}>Try Again</button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
