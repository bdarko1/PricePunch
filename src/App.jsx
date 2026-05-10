import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase ─────────────────────────────────────────────────────────────────

const supabase = createClient(
  "https://gsvxwxdyuqlrlphwxquz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzdnh3eGR5dXFscmxwaHd4cXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzU5MTAsImV4cCI6MjA5MDMxMTkxMH0.WIQoECMsIfcT-o-tNcRqc1q4MEnWEF6jkzel-UzPo5k"
);

// ─── Auth Modal ───────────────────────────────────────────────────────────────

function AuthModal({ onAuth, trigger }) {
  const [mode, setMode]         = useState("signup"); // signup | login
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const triggerMessages = {
    punches:     "Save your PUNCHES before they disappear!",
    streak:      "You're on a streak! Save it before you lose it.",
    leaderboard: "Create an account to appear on the leaderboard.",
    prediction:  "Sign up to save your predictions and earn PUNCHES 🥊",
    default:     "Create a free account to save your progress.",
  };

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        // Check username not taken
        const { data: existing } = await supabase
          .from("pp_users")
          .select("id")
          .eq("username", username.trim())
          .single();
        if (existing) { setError("Username taken — try another"); setLoading(false); return; }

        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        // Create profile
        await supabase.from("pp_users").insert({
          id: data.user.id,
          username: username.trim(),
          punches: 100, // 100 welcome PUNCHES
          streak: 0,
        });
        onAuth({ id: data.user.id, username: username.trim(), punches: 100, streak: 0 });
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        const { data: profile } = await supabase.from("pp_users").select("*").eq("id", data.user.id).single();
        onAuth(profile);
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:600, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:"430px", background:"#fffef5", borderRadius:"24px 24px 0 0", padding:"28px 24px 40px", fontFamily:FONT_BODY, animation:"slideIn 0.35s ease" }}>

        {/* PUNCHES at stake */}
        <div style={{ background:NAVY, borderRadius:"14px", padding:"14px 16px", marginBottom:"20px", display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ fontSize:"28px" }}>🥊</div>
          <div>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"20px", color:GOLD, letterSpacing:"0.06em" }}>
              {triggerMessages[trigger] || triggerMessages.default}
            </div>
            <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.5)", marginTop:"2px" }}>
              Free forever · No credit card needed
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display:"flex", background:"#f0ede6", borderRadius:"12px", padding:"4px", marginBottom:"20px" }}>
          {["signup","login"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex:1, padding:"10px", borderRadius:"10px",
              border:"none", cursor:"pointer", fontFamily:FONT_BODY,
              fontSize:"13px", fontWeight:800,
              background: mode===m ? "white" : "transparent",
              color: mode===m ? NAVY : "#888",
              boxShadow: mode===m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition:"all 0.15s",
              textTransform:"uppercase", letterSpacing:"0.06em",
            }}>
              {m === "signup" ? "Create Account" : "Log In"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"16px" }}>
          {mode === "signup" && (
            <input
              type="text" placeholder="Username (shown on leaderboard)"
              value={username} onChange={e => setUsername(e.target.value)}
              style={{ padding:"13px 16px", borderRadius:"12px", border:"2.5px solid #ddd", fontSize:"14px", fontFamily:FONT_BODY, outline:"none" }}
            />
          )}
          <input
            type="email" placeholder="Email address"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding:"13px 16px", borderRadius:"12px", border:"2.5px solid #ddd", fontSize:"14px", fontFamily:FONT_BODY, outline:"none" }}
          />
          <input
            type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)}
            style={{ padding:"13px 16px", borderRadius:"12px", border:"2.5px solid #ddd", fontSize:"14px", fontFamily:FONT_BODY, outline:"none" }}
          />
        </div>

        {error && (
          <div style={{ background:"#fff0f0", border:"1.5px solid #ffaaaa", borderRadius:"10px", padding:"10px 14px", fontSize:"12px", color:"#cc3300", marginBottom:"14px", fontFamily:FONT_BODY }}>
            {error}
          </div>
        )}

        {mode === "signup" && (
          <div style={{ background:"#f0fff4", border:"1.5px solid #00cc6633", borderRadius:"10px", padding:"10px 14px", fontSize:"11px", color:"#1a7a3a", marginBottom:"14px", fontFamily:FONT_BODY, display:"flex", alignItems:"center", gap:"8px" }}>
            <span>🎁</span>
            <span>You'll get <strong>100 welcome PUNCHES</strong> just for signing up</span>
          </div>
        )}

        <CtaBtn disabled={loading || !email || !password || (mode==="signup" && !username)} onClick={handleSubmit}>
          {loading ? "..." : mode === "signup" ? "🥊 Create My Account" : "Log In"}
        </CtaBtn>

        <button onClick={() => onAuth(null)} style={{ display:"block", margin:"14px auto 0", background:"none", border:"none", fontSize:"12px", color:"#bbb", cursor:"pointer", fontFamily:FONT_BODY }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}


// Static item metadata (emojis + categories stay hardcoded, prices come from Supabase)
const ITEM_META = {
  eggs:    { emoji: "🥚", category: "Dairy" },
  milk:    { emoji: "🥛", category: "Dairy" },
  bread:   { emoji: "🍞", category: "Bakery" },
  butter:  { emoji: "🧈", category: "Dairy" },
  chicken: { emoji: "🍗", category: "Meat" },
  coffee:  { emoji: "☕", category: "Drinks" },
  pasta:   { emoji: "🍝", category: "Pantry" },
  cheese:  { emoji: "🧀", category: "Dairy" },
  bananas: { emoji: "🍌", category: "Fruit" },
};

// Fallback prices if Supabase is slow
const ITEMS_FALLBACK = [
  { id: "eggs",    name: "Free Range Eggs (12)", emoji: "🥚", price: 3.31, category: "Dairy" },
  { id: "milk",    name: "Semi-Skimmed Milk (2L)", emoji: "🥛", price: 1.43, category: "Dairy" },
  { id: "bread",   name: "White Sliced Bread",   emoji: "🍞", price: 1.15, category: "Bakery" },
  { id: "butter",  name: "Salted Butter (250g)", emoji: "🧈", price: 2.01, category: "Dairy" },
  { id: "chicken", name: "Chicken Breast (500g)",emoji: "🍗", price: 4.69, category: "Meat" },
  { id: "coffee",  name: "Instant Coffee (200g)",emoji: "☕", price: 4.89, category: "Drinks" },
  { id: "pasta",   name: "Spaghetti (500g)",     emoji: "🍝", price: 0.89, category: "Pantry" },
  { id: "cheese",  name: "Cheddar Cheese (400g)",emoji: "🧀", price: 3.60, category: "Dairy" },
  { id: "bananas", name: "Bananas (5 pack)",     emoji: "🍌", price: 0.68, category: "Fruit" },
];

const MOVES = [
  { label: "UP a lot",   pct:  0.10, dir: "up",   color: "#cc3300", bg: "#fff0eb", arrow: "↑↑" },
  { label: "UP a bit",   pct:  0.03, dir: "up",   color: "#e06020", bg: "#fff5f0", arrow: "↑"  },
  { label: "No change",  pct:  0,    dir: "same",  color: "#888",    bg: "#f5f5f5", arrow: "→"  },
  { label: "DOWN a bit", pct: -0.03, dir: "down",  color: "#1a7a3a", bg: "#f0fff4", arrow: "↓"  },
  { label: "DOWN a lot", pct: -0.10, dir: "down",  color: "#0a5a28", bg: "#eaffef", arrow: "↓↓" },
];

const TIMEFRAMES = [
  { label: "1 Week",   days: 7,  mult: 1.0, icon: "⚡" },
  { label: "1 Month",  days: 30, mult: 2.5, icon: "📅" },
  { label: "3 Months", days: 90, mult: 5.0, icon: "🗓️" },
];

const SETTLED = [
  {
    id: 1,
    item: ITEMS[0],
    predDir: "up", predLabel: "UP a lot",
    actualDir: "up", actualPct: 12.3,
    startPrice: 3.25, actualPrice: 3.65, predPrice: 3.58,
    timeframe: "1 month", correct: true, accuracy: 88, points: 420,
    crowd: { up: 71, same: 11, down: 18 },
    explainer: {
      headline: "Avian flu wiped out 4.2M hens in Q1",
      summary: "A fresh H5N1 outbreak cut UK laying hen populations sharply, tightening supply while demand held steady heading into Easter.",
      bullets: [
        { icon: "🦠", label: "Supply shock",  text: "4.2 million hens culled across Norfolk and Yorkshire farms between January and March 2026." },
        { icon: "🌽", label: "Feed costs up", text: "Grain prices rose 12% after a poor Ukrainian wheat harvest, pushing production costs higher." },
        { icon: "📦", label: "Import lag",    text: "EU imports took 6–8 weeks to scale up, keeping shelves tight and letting retailers raise prices." },
      ],
    },
  },
  {
    id: 2,
    item: ITEMS[3],
    predDir: "up", predLabel: "UP a bit",
    actualDir: "down", actualPct: -5.7,
    startPrice: 2.10, actualPrice: 1.98, predPrice: 2.16,
    timeframe: "1 week", correct: false, accuracy: 22, points: 0,
    crowd: { up: 58, same: 20, down: 22 },
    explainer: {
      headline: "EU dairy surplus drove butter prices down",
      summary: "Strong spring milk output from Ireland and the Netherlands flooded the market, catching most predictors off guard.",
      bullets: [
        { icon: "🐄", label: "Record output",   text: "Irish herds produced 11% more milk in April 2026 — an unusually warm, wet spring season." },
        { icon: "🇪🇺", label: "EU surplus",    text: "EU intervention stocks hit a 5-year high, with excess butter flowing into UK supermarkets." },
        { icon: "🛒", label: "Price war",       text: "Aldi and Lidl cut butter by 8p to win basket share, forcing Tesco and Sainsbury's to match." },
      ],
    },
  },
];

// ─── Daily Flash data ────────────────────────────────────────────────────────

// FLASH_MOVES ranges update dynamically based on live price
function getFlashMoves(current) {
  const p = current;
  return [
    { id:"up_lot",   label:"Higher",          sub:`above ${(p*1.009).toFixed(1)}p`,                   pct: 0.009,  color:"#e03000", bg:"#fff0eb", arrow:"↑↑", pts:250 },
    { id:"up_bit",   label:"Slightly higher",  sub:`${(p*1.001).toFixed(1)}–${(p*1.009).toFixed(1)}p`, pct: 0.004,  color:"#e06020", bg:"#fff5f0", arrow:"↑",  pts:150 },
    { id:"same",     label:"About the same",   sub:`${(p*0.997).toFixed(1)}–${(p*1.001).toFixed(1)}p`, pct: 0,      color:"#888",    bg:"#f5f5f5", arrow:"→",  pts:100 },
    { id:"down_bit", label:"Slightly lower",   sub:`${(p*0.991).toFixed(1)}–${(p*0.997).toFixed(1)}p`, pct:-0.004,  color:"#1a7a3a", bg:"#f0fff4", arrow:"↓",  pts:150 },
    { id:"down_lot", label:"Lower",            sub:`below ${(p*0.991).toFixed(1)}p`,                   pct:-0.009,  color:"#0a5a28", bg:"#eaffef", arrow:"↓↓", pts:250 },
  ];
}

const FLASH_CROWD = { up_lot:28, up_bit:36, same:14, down_bit:15, down_lot:7 };

// ─── Utils ───────────────────────────────────────────────────────────────────

function fmt(p) { return p < 1 ? `${Math.round(p * 100)}p` : `£${p.toFixed(2)}`; }
function calcPts(movePct, tfMult, streak) {
  const mag = Math.abs(movePct) === 0 ? 0.5 : Math.abs(movePct);
  return Math.round(100 * tfMult * (1 + mag * 5) * (1 + streak * 0.1));
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Bebas Neue', sans-serif";
const FONT_MONO    = "'Courier Prime', 'Courier New', monospace";
const FONT_BODY    = "'Outfit', sans-serif";
const NAVY  = "#1a1a2e";
const GOLD  = "#f7e94e";
const CREAM = "#f0ede6";

// ─── Receipt share card ──────────────────────────────────────────────────────

function ReceiptCard({ pred }) {
  const { item, predDir, predLabel, actualDir, actualPct, startPrice, actualPrice,
          predPrice, timeframe, correct, accuracy, points, crowd } = pred;
  const diffAbs = Math.abs(actualPct).toFixed(1);
  const crowdSentence = crowd.up > 50
    ? `${crowd.up}% of players also predicted a rise`
    : crowd.down > 50
    ? `${crowd.down}% of players also predicted a fall`
    : "The crowd was split on this one";

  return (
    <div style={{ width: "290px", background: "#fffef5", fontFamily: FONT_MONO, borderRadius: "3px", boxShadow: "0 12px 50px rgba(0,0,0,0.35)" }}>
      {/* torn top */}
      <div style={{ height: "16px", background: "#fffef5", clipPath: "polygon(0% 100%,2.5% 0%,5% 100%,7.5% 0%,10% 100%,12.5% 0%,15% 100%,17.5% 0%,20% 100%,22.5% 0%,25% 100%,27.5% 0%,30% 100%,32.5% 0%,35% 100%,37.5% 0%,40% 100%,42.5% 0%,45% 100%,47.5% 0%,50% 100%,52.5% 0%,55% 100%,57.5% 0%,60% 100%,62.5% 0%,65% 100%,67.5% 0%,70% 100%,72.5% 0%,75% 100%,77.5% 0%,80% 100%,82.5% 0%,85% 100%,87.5% 0%,90% 100%,92.5% 0%,95% 100%,97.5% 0%,100% 100%)", borderBottom: "1.5px dashed #ccc" }} />
      <div style={{ padding: "14px 20px 4px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "0.18em", color: "#1a1a1a" }}>PRICEPUNCH</div>
          <div style={{ fontSize: "8px", color: "#bbb", letterSpacing: "0.12em", marginTop: "1px" }}>── PRICE PREDICTION RECEIPT ──</div>
          <div style={{ fontSize: "8px", color: "#ccc", marginTop: "2px" }}>{new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}).toUpperCase()} · {timeframe.toUpperCase()}</div>
        </div>
        <div style={{ borderTop: "1.5px dashed #ddd", marginBottom: "12px" }} />

        {/* Plain English story */}
        <div style={{ background: "#f7f4ea", border: "1.5px solid #e0d9c0", borderRadius: "3px", padding: "12px", marginBottom: "12px" }}>
          <div style={{ fontSize: "12px", color: "#555", marginBottom: "6px", lineHeight: 1.5 }}>I predicted the price of</div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }}>
            <span style={{ fontSize: "24px" }}>{item.emoji}</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>{item.name}</span>
          </div>
          <div style={{ fontSize: "12px", color: "#555", marginBottom: "8px", lineHeight: 1.5 }}>
            would{" "}
            <span style={{ fontWeight: 700, color: predDir === "up" ? "#cc4400" : predDir === "down" ? "#006622" : "#888", fontSize: "13px" }}>
              go {predDir === "up" ? "UP ↑" : predDir === "down" ? "DOWN ↓" : "STAY THE SAME →"}
            </span>
            {" "}in {timeframe}.
          </div>
          <div style={{ borderTop: "1px dashed #ccc", marginBottom: "8px" }} />
          <div style={{ fontSize: "12px", color: "#555", marginBottom: "3px" }}>It actually</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "17px", fontWeight: 700, color: actualDir === "up" ? "#cc4400" : "#006622" }}>
              {actualDir === "up" ? "went UP ↑" : "went DOWN ↓"}
            </span>
            <span style={{ fontSize: "11px", color: "#999" }}>by {diffAbs}%</span>
          </div>
        </div>

        {/* Prices */}
        <div style={{ marginBottom: "10px" }}>
          {[["Started at", fmt(startPrice), "#888"],["I predicted", fmt(predPrice), "#666"],].map(([l,v,c])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:c, marginBottom:"4px" }}>
              <span>{l}</span><span style={{ fontWeight:700 }}>{v}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px dashed #ddd", margin: "5px 0" }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px" }}>
            <span style={{ fontWeight:700, color:"#1a1a1a" }}>Actual price</span>
            <span style={{ fontWeight:700, color: actualDir==="up"?"#cc4400":"#006622" }}>{fmt(actualPrice)}</span>
          </div>
        </div>

        {/* Verdict */}
        <div style={{ border:`2.5px solid ${correct?"#1a6a1a":"#aa1111"}`, borderRadius:"3px", padding:"9px", textAlign:"center", marginBottom:"12px", background:correct?"#f0fff0":"#fff0f0" }}>
          <div style={{ fontSize:"17px", fontWeight:700, color:correct?"#1a6a1a":"#aa1111", letterSpacing:"0.1em" }}>
            {correct ? "✓ I GOT IT RIGHT!" : "✗ I GOT IT WRONG"}
          </div>
          <div style={{ fontSize:"10px", color:correct?"#1a6a1a":"#aa1111", marginTop:"2px", opacity:0.8 }}>
            {correct ? `${accuracy}% accurate · +${points} pts 🌟` : `${accuracy}% accuracy · back to the shop floor 😅`}
          </div>
        </div>

        {/* Crowd */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize:"8px", color:"#bbb", letterSpacing:"0.1em", marginBottom:"6px", textAlign:"center" }}>── WHAT OTHERS PREDICTED ──</div>
          <div style={{ display:"flex", gap:"2px", height:"18px", borderRadius:"2px", overflow:"hidden", marginBottom:"5px" }}>
            {[{pct:crowd.up,color:"#cc4400",lbl:`↑ ${crowd.up}%`},{pct:crowd.same,color:"#999",lbl:`→`},{pct:crowd.down,color:"#006622",lbl:`↓ ${crowd.down}%`}].map((s,i)=>(
              <div key={i} style={{ flex:s.pct, background:s.color+"22", border:`1px solid ${s.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"8px", color:s.color, fontWeight:700 }}>
                {s.pct>18?s.lbl:s.pct>10?`${s.pct}%`:""}
              </div>
            ))}
          </div>
          <div style={{ fontSize:"9px", color:"#bbb", textAlign:"center" }}>{crowdSentence}</div>
        </div>

        <div style={{ background:NAVY, color:GOLD, borderRadius:"3px", padding:"8px", textAlign:"center", fontSize:"10px", fontWeight:700, letterSpacing:"0.08em", marginBottom:"6px" }}>
          👀 CAN YOU DO BETTER? · PRICEPUNCH.APP
        </div>
        <div style={{ textAlign:"center", fontSize:"8px", color:"#ccc", marginBottom:"4px" }}>Predict · Learn · Win</div>
      </div>
      {/* torn bottom */}
      <div style={{ height:"16px", background:"#fffef5", clipPath:"polygon(0% 0%,2.5% 100%,5% 0%,7.5% 100%,10% 0%,12.5% 100%,15% 0%,17.5% 100%,20% 0%,22.5% 100%,25% 0%,27.5% 100%,30% 0%,32.5% 100%,35% 0%,37.5% 100%,40% 0%,42.5% 100%,45% 0%,47.5% 100%,50% 0%,52.5% 100%,55% 0%,57.5% 100%,60% 0%,62.5% 100%,65% 0%,67.5% 100%,70% 0%,72.5% 100%,75% 0%,77.5% 100%,80% 0%,82.5% 100%,85% 0%,87.5% 100%,90% 0%,92.5% 100%,95% 0%,97.5% 100%,100% 0%)", borderTop:"1.5px dashed #ccc" }} />
    </div>
  );
}

// ─── Share modal ─────────────────────────────────────────────────────────────

function ShareModal({ pred, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px", overflowY:"auto" }}>
      <ReceiptCard pred={pred} />
      <div style={{ marginTop:"18px", display:"flex", flexDirection:"column", gap:"8px", width:"290px" }}>
        {[
          { label:"📸  Share to Instagram Stories", bg:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)" },
          { label:"🐦  Post to X / Twitter", bg:"#000", border:"1px solid #333" },
          { label:"💬  Send on WhatsApp", bg:"#25d366" },
        ].map(b=>(
          <button key={b.label} style={{ padding:"13px", borderRadius:"8px", border:b.border||"none", background:b.bg, color:"white", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:FONT_MONO, letterSpacing:"0.04em" }}>
            {b.label}
          </button>
        ))}
        <button onClick={onClose} style={{ padding:"11px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.15)", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:"12px", cursor:"pointer", fontFamily:FONT_MONO }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Confetti ────────────────────────────────────────────────────────────────

function Confetti() {
  return (
    <>
      {Array.from({length:28}).map((_,i)=>(
        <div key={i} style={{
          position:"fixed", top:"-10px",
          left:`${Math.random()*100}vw`,
          width:`${6+Math.random()*7}px`, height:`${6+Math.random()*7}px`,
          background:[GOLD,"#ff3d3d","#0099ff","#00c9a7","#ff8c42"][i%5],
          borderRadius:Math.random()>.5?"50%":"2px",
          animation:`confettiFall ${1.2+Math.random()*.8}s ease-in ${Math.random()*.5}s forwards`,
          zIndex:300, pointerEvents:"none",
        }} />
      ))}
    </>
  );
}

// ─── SCREEN 1 — Predict ──────────────────────────────────────────────────────

// Hot items: most predicted this week, with crowd sentiment lean
const HOT_ITEMS = [
  { id:"eggs",    predictions: 2841, lean:"up",   leanPct: 71, hot: true  },
  { id:"petrol",  predictions: 2103, lean:"up",   leanPct: 64, hot: true  },
  { id:"butter",  predictions: 1876, lean:"down",  leanPct: 53, hot: false },
  { id:"chicken", predictions: 1590, lean:"up",   leanPct: 58, hot: false },
];

function HotStrip({ onPick, selectedId, items }) {
  const liveItems = items || ITEMS_FALLBACK;
  return (
    <div style={{ marginBottom:"18px" }}>
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
          <div style={{ background:"#ff3d3d", borderRadius:"5px", padding:"2px 8px", fontSize:"9px", fontWeight:800, color:"white", textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FONT_BODY }}>
            🔥 Hot This Week
          </div>
        </div>
        <div style={{ fontSize:"10px", color:"#aaa", fontFamily:FONT_BODY }}>Most predicted</div>
      </div>

      {/* Horizontal scroll row */}
      <div style={{ display:"flex", gap:"9px", overflowX:"auto", paddingBottom:"4px" }}>
        {HOT_ITEMS.map((h, idx) => {
          const it = liveItems.find(i => i.id === h.id);
          const sel = selectedId === it.id;
          const leanColor = h.lean === "up" ? "#cc3300" : "#1a7a3a";
          const leanArrow = h.lean === "up" ? "↑" : "↓";

          return (
            <button key={it.id} onClick={() => onPick(it)} style={{
              flexShrink: 0,
              width: "130px",
              background: sel ? GOLD : "white",
              border: sel ? `3px solid ${NAVY}` : "3px solid transparent",
              borderRadius: "14px",
              padding: "12px 10px",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: sel ? `4px 4px 0 ${NAVY}` : "2px 2px 0 #e0e0e8",
              transform: sel ? "translateY(-2px)" : "none",
              transition: "all 0.15s",
              position: "relative",
            }}>
              {/* Hot badge on first two */}
              {h.hot && (
                <div style={{ position:"absolute", top:"8px", right:"8px", fontSize:"10px" }}>🔥</div>
              )}

              {/* Rank number */}
              <div style={{ fontSize:"9px", fontWeight:800, color:"#ccc", fontFamily:FONT_BODY, marginBottom:"4px" }}>
                #{idx + 1}
              </div>

              {/* Emoji + name */}
              <div style={{ fontSize:"1.6rem", marginBottom:"4px" }}>{it.emoji}</div>
              <div style={{ fontSize:"10px", fontWeight:800, color:NAVY, textTransform:"uppercase", letterSpacing:"0.04em", lineHeight:1.25, fontFamily:FONT_BODY, marginBottom:"6px" }}>
                {it.name}
              </div>

              {/* Crowd lean pill */}
              <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                <div style={{
                  background: leanColor + "18",
                  border: `1.5px solid ${leanColor}33`,
                  borderRadius: "20px",
                  padding: "2px 7px",
                  fontSize: "9px",
                  fontWeight: 800,
                  color: leanColor,
                  fontFamily: FONT_BODY,
                }}>
                  {leanArrow} {h.leanPct}% say {h.lean}
                </div>
              </div>

              {/* Prediction count */}
              <div style={{ fontSize:"9px", color:"#bbb", fontFamily:FONT_BODY, marginTop:"5px" }}>
                {h.predictions.toLocaleString()} predictions
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PredictScreen({ onSubmit, score, streak }) {
  const [step, setStep]   = useState(1);
  const [item, setItem]   = useState(null);
  const [move, setMove]   = useState(null);
  const [tf, setTf]       = useState(null);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState(ITEMS_FALLBACK);
  const [pricesLoaded, setPricesLoaded] = useState(false);

  useEffect(() => {
    async function fetchPrices() {
      const { data } = await supabase
        .from("pp_grocery_prices")
        .select("*")
        .order("item_id");
      if (data && data.length > 0) {
        const live = data.map(row => ({
          id: row.item_id,
          name: row.item_name,
          emoji: ITEM_META[row.item_id]?.emoji || "🛒",
          price: +row.price_gbp,
          previousPrice: +row.previous_gbp,
          category: ITEM_META[row.item_id]?.category || "Other",
          source: row.source,
          monthYear: row.month_year,
        }));
        setItems(live);
        setPricesLoaded(true);
      }
    }
    fetchPrices();
  }, []);

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const pts = move && tf ? calcPts(move.pct, tf.mult, streak) : 0;

  function submit() {
    onSubmit({ item, move, tf, pts });
    setStep(1); setItem(null); setMove(null); setTf(null);
  }

  return (
    <div style={{ padding:"0 16px 100px" }}>
      {/* Step 1 */}
      {step===1 && <>
        <div style={{ marginBottom:"6px" }}><StepPill n={1} label="Pick an item" /></div>
        <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"26px", color:NAVY, letterSpacing:"0.04em", marginBottom:"14px" }}>WHAT'S CHANGING PRICE?</h2>

        {/* Hot items strip */}
        <HotStrip onPick={setItem} selectedId={item?.id} items={items} />

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
          <div style={{ flex:1, height:"1px", background:"#e0ddd6" }} />
          <div style={{ fontSize:"9px", fontWeight:800, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FONT_BODY }}>Or browse all</div>
          <div style={{ flex:1, height:"1px", background:"#e0ddd6" }} />
        </div>

        {/* Data source badge */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", marginBottom:"8px" }}>
          <div style={{ fontSize:"9px", color:"#aaa", fontFamily:FONT_BODY }}>
            {pricesLoaded ? "✓ Live prices · Trolley.co.uk" : "Loading live prices..."}
          </div>
        </div>

        <input type="text" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ width:"100%", padding:"11px 14px", borderRadius:"10px", border:"2.5px solid #ddd", fontSize:"13px", fontFamily:FONT_BODY, marginBottom:"12px", outline:"none" }} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"9px", marginBottom:"18px" }}>
          {filtered.map(it=>(
            <button key={it.id} onClick={()=>setItem(it)} style={{
              background: item?.id===it.id ? GOLD : "white",
              border: item?.id===it.id ? `3px solid ${NAVY}` : "3px solid transparent",
              borderRadius:"14px", padding:"14px 8px", cursor:"pointer",
              transform: item?.id===it.id ? "scale(1.04) translateY(-2px)" : "scale(1)",
              boxShadow: item?.id===it.id ? `4px 4px 0 ${NAVY}` : "2px 2px 0 #e0e0e8",
              transition:"all 0.15s", textAlign:"center",
            }}>
              <div style={{ fontSize:"1.8rem" }}>{it.emoji}</div>
              <div style={{ fontSize:"10px", fontWeight:800, color:NAVY, textTransform:"uppercase", letterSpacing:"0.05em", marginTop:"4px", lineHeight:1.2, fontFamily:FONT_BODY }}>{it.name}</div>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:"15px", color:NAVY, marginTop:"3px" }}>{fmt(it.price)}</div>
            </button>
          ))}
        </div>
        <CtaBtn disabled={!item} onClick={()=>setStep(2)}>{item?`${item.emoji} Next →`:"Pick an item first"}</CtaBtn>
      </>}

      {/* Step 2 */}
      {step===2 && <>
        <BackBtn onClick={()=>setStep(1)} />
        <div style={{ marginBottom:"6px" }}><StepPill n={2} label="Which direction?" /></div>
        <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"26px", color:NAVY, letterSpacing:"0.04em", marginBottom:"14px" }}>WHERE'S IT GOING?</h2>
        <div style={{ background:"white", border:`3px solid ${NAVY}`, borderRadius:"14px", padding:"14px", marginBottom:"16px", display:"flex", alignItems:"center", gap:"12px", boxShadow:`4px 4px 0 ${NAVY}` }}>
          <div style={{ fontSize:"2rem" }}>{item.emoji}</div>
          <div>
            <div style={{ fontSize:"12px", fontWeight:800, color:NAVY, fontFamily:FONT_BODY }}>{item.name}</div>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"18px", color:NAVY, marginTop:"2px" }}>Today: {fmt(item.price)}</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"9px", marginBottom:"18px" }}>
          {MOVES.map(m=>{
            const pred = item.price*(1+m.pct);
            const sel  = move?.label===m.label;
            return (
              <button key={m.label} onClick={()=>setMove(m)} style={{
                width:"100%", padding:"13px 14px", borderRadius:"12px",
                border:`3px solid ${sel?NAVY:"transparent"}`,
                background: sel ? m.bg : "white",
                cursor:"pointer", display:"flex", alignItems:"center", gap:"11px",
                transform: sel?"translateX(5px)":"none",
                boxShadow: sel?`4px 0 0 ${NAVY}`:"none",
                transition:"all 0.12s", fontFamily:FONT_BODY,
              }}>
                <div style={{ width:"38px", height:"38px", borderRadius:"9px", background:m.color, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"14px", fontWeight:800, flexShrink:0 }}>{m.arrow}</div>
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ fontWeight:800, fontSize:"14px", color:NAVY }}>{m.label}</div>
                  <div style={{ fontSize:"11px", color:"#888", marginTop:"2px" }}>
                    {m.pct===0 ? "No change expected" : `~${m.pct>0?"+":""}${Math.round(m.pct*100)}% · target ${fmt(pred)}`}
                  </div>
                </div>
                {m.pct!==0 && <div style={{ fontFamily:FONT_DISPLAY, fontSize:"17px", color:m.color }}>{fmt(pred)}</div>}
              </button>
            );
          })}
        </div>
        <CtaBtn disabled={!move} onClick={()=>setStep(3)}>{move?`${move.arrow} Next →`:"Pick a direction"}</CtaBtn>
      </>}

      {/* Step 3 */}
      {step===3 && <>
        <BackBtn onClick={()=>setStep(2)} />
        <div style={{ marginBottom:"6px" }}><StepPill n={3} label="How soon?" /></div>
        <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"26px", color:NAVY, letterSpacing:"0.04em", marginBottom:"14px" }}>HOW SOON?</h2>
        {/* Summary pill */}
        <div style={{ background:NAVY, borderRadius:"14px", padding:"14px 16px", marginBottom:"18px", display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ fontSize:"1.8rem" }}>{item.emoji}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"10px", color:"#888", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FONT_BODY }}>{item.name}</div>
            <div style={{ fontSize:"12px", color:"white", fontWeight:700, marginTop:"3px", fontFamily:FONT_BODY }}>
              Will go <span style={{ color:move.color }}>{move.label}</span>
            </div>
          </div>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:"20px", color:GOLD }}>{fmt(item.price)}</div>
        </div>
        <div style={{ display:"flex", gap:"9px", marginBottom:"18px" }}>
          {TIMEFRAMES.map(t=>{
            const p = calcPts(move.pct, t.mult, streak);
            const sel = tf?.label===t.label;
            return (
              <button key={t.label} onClick={()=>setTf(t)} style={{
                flex:1, padding:"14px 8px", borderRadius:"12px",
                border:`3px solid ${sel?NAVY:"transparent"}`,
                background: sel?GOLD:"white",
                cursor:"pointer", textAlign:"center",
                transform: sel?"translateY(-2px)":"none",
                boxShadow: sel?`4px 4px 0 ${NAVY}`:"2px 2px 0 #e0e0e8",
                transition:"all 0.12s", fontFamily:FONT_BODY,
              }}>
                <div style={{ fontSize:"20px", marginBottom:"4px" }}>{t.icon}</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:"17px", color:NAVY, letterSpacing:"0.04em" }}>{t.label}</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:"16px", color:sel?NAVY:GOLD, background:NAVY, borderRadius:"6px", padding:"2px 6px", marginTop:"6px" }}>+{p}pts</div>
              </button>
            );
          })}
        </div>
        {tf && (
          <div style={{ background:"white", borderRadius:"12px", border:"2px solid #eee", padding:"13px 15px", marginBottom:"16px", animation:"slideIn 0.2s ease" }}>
            <div style={{ fontSize:"10px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"#aaa", marginBottom:"8px", fontFamily:FONT_BODY }}>If you're right you'll earn</div>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"32px", color:NAVY, letterSpacing:"0.04em" }}>+{pts} POINTS</div>
            <div style={{ fontSize:"11px", color:"#aaa", marginTop:"2px", fontFamily:FONT_BODY }}>🔥 Streak ×{streak} bonus included</div>
          </div>
        )}
        <CtaBtn disabled={!tf} onClick={submit}>🎯 Lock In My Prediction</CtaBtn>
      </>}
    </div>
  );
}

// ─── SCREEN 2 — My Calls (active) ───────────────────────────────────────────

function MyCallsScreen({ predictions, onGoPredict }) {
  return (
    <div style={{ padding:"0 16px 100px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"18px" }}>
        <div>
          <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"30px", color:NAVY, letterSpacing:"0.04em", lineHeight:1 }}>MY CALLS</h2>
          <div style={{ fontSize:"12px", color:"#888", fontFamily:FONT_BODY, marginTop:"3px" }}>{predictions.length} active · settling soon</div>
        </div>
        <button onClick={onGoPredict} style={{ background:GOLD, border:`2.5px solid ${NAVY}`, borderRadius:"10px", padding:"9px 14px", fontWeight:800, fontSize:"12px", cursor:"pointer", fontFamily:FONT_BODY, boxShadow:`3px 3px 0 ${NAVY}` }}>
          + New
        </button>
      </div>

      {predictions.length===0 ? (
        <div style={{ background:"white", borderRadius:"18px", padding:"44px 20px", textAlign:"center", border:"3px dashed #ddd" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"10px" }}>🎯</div>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:"20px", color:NAVY, marginBottom:"8px" }}>NO PREDICTIONS YET</div>
          <div style={{ fontSize:"13px", color:"#888", marginBottom:"18px", fontFamily:FONT_BODY }}>Make your first call on everyday prices</div>
          <CtaBtn onClick={onGoPredict}>Make a Prediction</CtaBtn>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"11px" }}>
          {predictions.map(p=>{
            const tf = TIMEFRAMES.find(t=>t.label===p.tf.label);
            const settle = new Date(Date.now()+tf.days*86400000);
            return (
              <div key={p.id} style={{ background:"white", border:`3px solid ${NAVY}`, borderRadius:"16px", padding:"15px", boxShadow:`4px 4px 0 ${NAVY}`, display:"flex", alignItems:"center", gap:"13px", animation:"slideIn 0.3s ease" }}>
                <div style={{ fontSize:"2rem" }}>{p.item.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"11px", fontWeight:800, color:"#888", textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:FONT_BODY }}>{p.item.name}</div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:NAVY, marginTop:"3px", fontFamily:FONT_BODY }}>
                    Will <span style={{ color:p.move.color }}>{p.move.label}</span> · {p.tf.label}
                  </div>
                  <div style={{ fontSize:"10px", color:"#bbb", marginTop:"2px", fontFamily:FONT_BODY }}>
                    Settles {settle.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"9px", color:"#aaa", fontFamily:FONT_BODY }}>POTENTIAL</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontSize:"20px", color:GOLD, background:NAVY, padding:"3px 9px", borderRadius:"7px" }}>+{p.pts}pts</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SCREEN 3 — Settled (explainer + share) ──────────────────────────────────

function SettledScreen() {
  const [shareTarget, setShareTarget] = useState(null);

  return (
    <div style={{ padding:"0 16px 100px" }}>
      {shareTarget && <ShareModal pred={shareTarget} onClose={()=>setShareTarget(null)} />}

      {/* Stats bar */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"18px" }}>
        {[{l:"Correct",v:`${SETTLED.filter(s=>s.correct).length}/${SETTLED.length}`},{l:"Points",v:SETTLED.filter(s=>s.correct).reduce((a,s)=>a+s.points,0)},{l:"Avg Acc.",v:`${Math.round(SETTLED.reduce((a,s)=>a+s.accuracy,0)/SETTLED.length)}%`}].map(s=>(
          <div key={s.l} style={{ background:NAVY, borderRadius:"12px", padding:"12px", textAlign:"center" }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"22px", color:GOLD, letterSpacing:"0.04em" }}>{s.v}</div>
            <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FONT_BODY, marginTop:"2px" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {SETTLED.map((pred,idx)=>{
        const { item, predDir, predLabel, actualDir, actualPct, startPrice, actualPrice,
                predPrice, timeframe, correct, accuracy, points, crowd, explainer } = pred;
        return (
          <div key={pred.id} style={{ background:"white", borderRadius:"20px", overflow:"hidden", border:`3px solid ${NAVY}`, boxShadow:`5px 5px 0 ${NAVY}`, marginBottom:"18px", animation:`slideIn ${0.2+idx*0.1}s ease` }}>

            {/* Outcome banner */}
            <div style={{ background:correct?"#0d3321":"#330d0d", padding:"15px 18px", display:"flex", alignItems:"center", gap:"13px" }}>
              <div style={{ fontSize:"2rem" }}>{item.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"10px", color:correct?"#00cc66":"#ff6666", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FONT_BODY }}>
                  {correct?"✓ You called it right":"✗ Prediction missed"}
                </div>
                <div style={{ fontSize:"13px", fontWeight:700, color:"white", fontFamily:FONT_MONO, marginTop:"2px" }}>{item.name}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.35)", fontFamily:FONT_BODY }}>ACTUAL</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:"24px", color:correct?"#00ff88":"#ff6666", letterSpacing:"0.04em" }}>{fmt(actualPrice)}</div>
              </div>
            </div>

            {/* Plain English summary */}
            <div style={{ background:"#f8f7f2", padding:"13px 18px", borderBottom:"2px solid #eee" }}>
              <div style={{ fontSize:"14px", color:"#555", lineHeight:1.65, fontFamily:FONT_MONO }}>
                I predicted{" "}
                <span style={{ fontWeight:700, color:NAVY }}>{item.name}</span>
                {" "}would{" "}
                <span style={{ fontWeight:700, color:predDir==="up"?"#cc4400":"#006622" }}>
                  go {predDir==="up"?"UP ↑":"DOWN ↓"}
                </span>
                {" "}in {timeframe}. It actually{" "}
                <span style={{ fontWeight:700, color:actualDir==="up"?"#cc4400":"#006622" }}>
                  went {actualDir==="up"?"UP ↑":"DOWN ↓"}
                </span>
                {" "}by {Math.abs(actualPct).toFixed(1)}%.
              </div>
            </div>

            {/* Price grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", borderBottom:"2px solid #eee" }}>
              {[["Started",fmt(startPrice),"#555"],["I said",fmt(predPrice),"#888"],["Actual",fmt(actualPrice),correct?"#1a7a3a":"#aa2222"]].map(([l,v,c])=>(
                <div key={l} style={{ padding:"11px 8px", textAlign:"center", borderRight:"1px solid #eee" }}>
                  <div style={{ fontSize:"8px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"#bbb", fontFamily:FONT_BODY, marginBottom:"3px" }}>{l}</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontSize:"18px", color:c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Accuracy bar */}
            <div style={{ padding:"12px 18px", borderBottom:"2px solid #eee" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                <span style={{ fontSize:"10px", fontWeight:800, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FONT_BODY }}>Accuracy</span>
                <span style={{ fontSize:"10px", fontWeight:800, color:correct?"#1a7a3a":"#aa2222", fontFamily:FONT_BODY }}>{accuracy}%</span>
              </div>
              <div style={{ height:"7px", background:"#eee", borderRadius:"4px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${accuracy}%`, background:correct?"linear-gradient(90deg,#1a7a3a,#00ff88)":"linear-gradient(90deg,#aa2222,#ff6666)", borderRadius:"4px" }} />
              </div>
              {correct && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"7px", marginTop:"9px" }}>
                  <div style={{ background:GOLD, border:`2px solid ${NAVY}`, borderRadius:"8px", padding:"4px 13px", fontFamily:FONT_DISPLAY, fontSize:"18px", color:NAVY }}>+{points} pts</div>
                  <span style={{ fontSize:"11px", color:"#aaa", fontFamily:FONT_BODY }}>added to your score</span>
                </div>
              )}
            </div>

            {/* WHY explainer */}
            <div style={{ padding:"16px 18px" }}>
              <div style={{ display:"inline-flex", alignItems:"center", background:NAVY, color:GOLD, fontSize:"9px", fontWeight:800, padding:"4px 10px", borderRadius:"5px", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"10px", fontFamily:FONT_BODY }}>
                Why did this happen?
              </div>
              <div style={{ fontFamily:FONT_MONO, fontSize:"13px", fontWeight:700, color:NAVY, marginBottom:"8px", lineHeight:1.4 }}>
                "{explainer.headline}"
              </div>
              <p style={{ fontSize:"14px", color:"#666", lineHeight:1.6, marginBottom:"12px", fontFamily:FONT_MONO }}>
                {explainer.summary}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"13px" }}>
                {explainer.bullets.map((b,i)=>(
                  <div key={i} style={{ display:"flex", gap:"10px", padding:"11px", background:"#f8f7f2", borderRadius:"11px", border:"1.5px solid #ece9e0", animation:`slideIn ${0.3+i*0.08}s ease` }}>
                    <div style={{ width:"34px", height:"34px", background:"white", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0, border:"1.5px solid #eee" }}>{b.icon}</div>
                    <div>
                      <div style={{ fontSize:"10px", fontWeight:800, color:NAVY, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"2px", fontFamily:FONT_BODY }}>{b.label}</div>
                      <div style={{ fontSize:"13px", color:"#666", lineHeight:1.5, fontFamily:FONT_MONO }}>{b.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Crowd bar */}
              <div style={{ marginBottom:"14px" }}>
                <div style={{ fontSize:"10px", fontWeight:800, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"7px", fontFamily:FONT_BODY }}>What the crowd predicted</div>
                <div style={{ display:"flex", gap:"3px", height:"28px", borderRadius:"8px", overflow:"hidden", marginBottom:"5px" }}>
                  {[{pct:crowd.up,color:"#cc4400",lbl:`↑ ${crowd.up}%`},{pct:crowd.same,color:"#aaa",lbl:`→`},{pct:crowd.down,color:"#006622",lbl:`↓ ${crowd.down}%`}].map((s,i)=>(
                    <div key={i} style={{ flex:s.pct, background:s.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:800, color:s.color, fontFamily:FONT_BODY }}>
                      {s.pct>15?s.lbl:""}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:"10px", color:"#ccc", fontFamily:FONT_MONO }}>
                  {crowd.up>50?`${crowd.up}% of players predicted a rise`:crowd.down>50?`${crowd.down}% of players predicted a fall`:"The crowd was split on this one"}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display:"flex", gap:"9px" }}>
                <button onClick={()=>setShareTarget(pred)} style={{ flex:1, padding:"13px", background:NAVY, color:GOLD, border:"none", borderRadius:"12px", fontFamily:FONT_DISPLAY, fontSize:"16px", letterSpacing:"0.08em", cursor:"pointer", boxShadow:`3px 3px 0 ${GOLD}`, transition:"all 0.1s", display:"flex", alignItems:"center", justifyContent:"center", gap:"7px" }}>
                  📤 Share My Call
                </button>
                <button style={{ padding:"13px 15px", background:"#f0ede6", border:"2px solid #ddd", borderRadius:"12px", fontSize:"17px", cursor:"pointer" }}>🔖</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SCREEN 4 — Leaderboard ──────────────────────────────────────────────────

function LeaderboardScreen({ score, user, onAuthTrigger }) {
  const board = [
    { name:"TraderJoe92",   score:2840, streak:12, acc:89 },
    { name:"InflationHawk", score:2210, streak:7,  acc:76 },
    { name:"BudgetQueen",   score:1990, streak:5,  acc:71 },
    { name:"ShelfWatcher",  score:1650, streak:3,  acc:64 },
    { name:"PriceNinja",    score:1340, streak:1,  acc:58 },
  ];
  const medals = ["🥇","🥈","🥉","4","5"];
  const medalBg = [GOLD,"#e0e0e8","#ffddcc","white","white"];

  return (
    <div style={{ padding:"0 16px 100px" }}>
      {/* Prize banner */}
      <div style={{ background:`linear-gradient(135deg,${NAVY} 0%,#2d2d5e 100%)`, borderRadius:"18px", padding:"18px", marginBottom:"18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:"24px", color:GOLD, letterSpacing:"0.06em" }}>THIS WEEK'S PRIZE</div>
          <div style={{ fontSize:"12px", color:"white", fontWeight:600, marginTop:"3px", fontFamily:FONT_BODY }}>Top 3 predictors win</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:"2rem" }}>🏆</div>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:"20px", color:GOLD }}>£50</div>
        </div>
      </div>

      {board.map((e,i)=>(
        <div key={e.name} style={{ background:medalBg[i], border:i<3?`3px solid ${NAVY}`:"2px solid #eee", borderRadius:"14px", padding:"13px 15px", marginBottom:"9px", display:"flex", alignItems:"center", gap:"13px", boxShadow:i<3?`4px 4px 0 ${NAVY}`:"none" }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:i<3?"22px":"18px", width:"30px", textAlign:"center" }}>{medals[i]}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:"14px", color:NAVY, fontFamily:FONT_BODY }}>{e.name}</div>
            <div style={{ fontSize:"10px", color:"#888", marginTop:"1px", fontFamily:FONT_BODY }}>{e.acc}% accuracy · 🔥 {e.streak} streak</div>
          </div>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:"20px", color:i===0?NAVY:"#888" }}>{e.score.toLocaleString()}</div>
        </div>
      ))}

      {/* Your position */}
      {user ? (
        <div style={{ background:NAVY, borderRadius:"14px", padding:"13px 15px", marginTop:"14px", display:"flex", alignItems:"center", gap:"13px", border:`3px solid ${GOLD}` }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:"18px", color:GOLD, width:"30px", textAlign:"center" }}>#42</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:"14px", color:"white", fontFamily:FONT_BODY }}>@{user.username}</div>
            <div style={{ fontSize:"10px", color:"#888", fontFamily:FONT_BODY }}>Keep predicting to climb! 🎯</div>
          </div>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:"20px", color:GOLD }}>🥊 {score}</div>
        </div>
      ) : (
        <div onClick={() => onAuthTrigger("leaderboard")} style={{ background:"rgba(247,233,78,0.1)", border:`2px dashed ${GOLD}`, borderRadius:"14px", padding:"16px", marginTop:"14px", textAlign:"center", cursor:"pointer" }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:"18px", color:GOLD, marginBottom:"4px" }}>APPEAR ON THE LEADERBOARD</div>
          <div style={{ fontSize:"12px", color:"#888", fontFamily:FONT_BODY }}>Create a free account to save your score 🥊</div>
        </div>
      )}
    </div>
  );
}

// ─── Small reusable components ───────────────────────────────────────────────

function StepPill({ n, label }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"3px 11px", borderRadius:"20px", background:NAVY, color:GOLD, fontSize:"10px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FONT_BODY }}>
      Step {n} of 3 · {label}
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:700, color:"#888", fontFamily:FONT_BODY, display:"flex", alignItems:"center", gap:"4px", padding:"0", marginBottom:"14px" }}>
      ← Back
    </button>
  );
}

function CtaBtn({ children, disabled, onClick }) {
  return (
    <button disabled={disabled} onClick={onClick} style={{ width:"100%", padding:"17px", borderRadius:"14px", border:`3px solid ${NAVY}`, background:disabled?"#e0e0e0":GOLD, color:NAVY, fontSize:"17px", fontWeight:900, fontFamily:FONT_DISPLAY, letterSpacing:"0.1em", cursor:disabled?"not-allowed":"pointer", boxShadow:disabled?"none":`4px 4px 0 ${NAVY}`, transition:"all 0.1s", opacity:disabled?0.5:1 }}>
      {children}
    </button>
  );
}

// ─── Daily Flash components ──────────────────────────────────────────────────

function SparkLine({ data, color }) {
  const w = 120, h = 36, pad = 4;
  const min = Math.min(...data) - 0.5;
  const max = Math.max(...data) + 0.5;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + ((max - v) / (max - min)) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const last = pts.split(" ").pop().split(",");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

function LiveTicker({ current, change }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 2000); return () => clearInterval(t); }, []);
  const live = current ? (current + Math.sin(tick * 0.4) * 0.1).toFixed(1) : "---";
  return (
    <div style={{ display:"flex", alignItems:"baseline", gap:"8px" }}>
      <div style={{ fontFamily:FONT_DISPLAY, fontSize:"52px", color:"white", letterSpacing:"0.02em", lineHeight:1 }}>
        {live}<span style={{ fontSize:"28px", color:"rgba(255,255,255,0.6)" }}>p</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
          <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:GOLD, animation:"pulse 1.5s infinite" }} />
          <span style={{ fontSize:"9px", color:GOLD, fontWeight:700, letterSpacing:"0.1em", fontFamily:FONT_BODY }}>LIVE</span>
        </div>
        <div style={{ fontSize:"12px", color: change >= 0 ? "#ff8c42" : "#00cc66", fontWeight:700, fontFamily:"'DM Mono', monospace" }}>
          {change >= 0 ? "+" : ""}{change}p vs last week
        </div>
      </div>
    </div>
  );
}

function FlashCrowdBar({ selected }) {
  const total = Object.values(FLASH_CROWD).reduce((a, b) => a + b, 0);
  return (
    <div style={{ marginBottom:"14px" }}>
      <div style={{ fontSize:"10px", fontWeight:800, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"8px", fontFamily:FONT_BODY }}>
        {total * 47}+ players predicted today
      </div>
      <div style={{ display:"flex", gap:"2px", height:"20px", borderRadius:"6px", overflow:"hidden" }}>
        {FLASH_MOVES.map(m => {
          const pct = Math.round((FLASH_CROWD[m.id] / total) * 100);
          const isSel = selected?.id === m.id;
          return (
            <div key={m.id} style={{ flex:FLASH_CROWD[m.id], background: isSel ? m.color : m.color+"55", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", color:"white", fontWeight:800, transition:"all 0.3s", fontFamily:FONT_BODY }}>
              {pct > 12 ? `${m.arrow} ${pct}%` : pct > 7 ? `${pct}%` : ""}
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"5px" }}>
        <span style={{ fontSize:"9px", color:"rgba(255,255,255,0.4)", fontFamily:FONT_BODY }}>↑↑ Very high</span>
        <span style={{ fontSize:"9px", color:"rgba(255,255,255,0.4)", fontFamily:FONT_BODY }}>Very low ↓↓</span>
      </div>
    </div>
  );
}

function FlashCountdown() {
  const calc = () => { const now = new Date(), mid = new Date(); mid.setHours(24,0,0,0); const d = mid - now; return { h:Math.floor(d/3600000), m:Math.floor((d%3600000)/60000), s:Math.floor((d%60000)/1000) }; };
  const [time, setTime] = useState(calc());
  useEffect(() => { const t = setInterval(() => setTime(calc()), 1000); return () => clearInterval(t); }, []);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
      <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)", fontFamily:FONT_BODY }}>Settles in</span>
      <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"13px", color:GOLD, fontWeight:700 }}>
        {String(time.h).padStart(2,"0")}:{String(time.m).padStart(2,"0")}:{String(time.s).padStart(2,"0")}
      </div>
    </div>
  );
}

function FlashResultCard({ move, onReset }) {
  return (
    <div style={{ animation:"slideIn 0.4s ease" }}>
      <div style={{ background:"white", border:`3px solid ${NAVY}`, borderRadius:"20px", padding:"24px", textAlign:"center", marginBottom:"16px", boxShadow:`5px 5px 0 ${NAVY}` }}>
        <div style={{ fontSize:"48px", marginBottom:"10px" }}>⛽</div>
        <div style={{ fontFamily:FONT_DISPLAY, fontSize:"26px", color:NAVY, letterSpacing:"0.06em", marginBottom:"6px" }}>CALL LOCKED IN</div>
        <div style={{ fontSize:"14px", color:"#888", fontFamily:FONT_BODY, marginBottom:"16px" }}>You predicted petrol will be</div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:"10px", background:move.bg, border:`3px solid ${NAVY}`, borderRadius:"12px", padding:"10px 20px", marginBottom:"16px", boxShadow:`3px 3px 0 ${NAVY}` }}>
          <span style={{ fontSize:"24px", color:move.color, fontWeight:800 }}>{move.arrow}</span>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontWeight:800, fontSize:"16px", color:NAVY, fontFamily:FONT_BODY }}>{move.label}</div>
            <div style={{ fontSize:"12px", color:"#888", fontFamily:FONT_BODY }}>{move.sub} tomorrow</div>
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:"20px" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"28px", color:NAVY, background:GOLD, padding:"4px 14px", borderRadius:"8px" }}>{move.pts}</div>
            <div style={{ fontSize:"9px", color:"#aaa", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FONT_BODY, marginTop:"4px" }}>Potential pts</div>
          </div>
          <div style={{ width:"1px", background:"#eee" }} />
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"28px", color:"#1a7a3a" }}>24h</div>
            <div style={{ fontSize:"9px", color:"#aaa", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FONT_BODY, marginTop:"4px" }}>Settles</div>
          </div>
        </div>
      </div>
      <button onClick={onReset} style={{ width:"100%", padding:"14px", borderRadius:"14px", border:"2px solid #ddd", background:"white", color:"#888", fontSize:"13px", cursor:"pointer", fontFamily:FONT_BODY, fontWeight:700 }}>
        ← Change my prediction
      </button>
    </div>
  );
}

function DailyFlashScreen() {
  const [selected, setSelected] = useState(null);
  const [locked, setLocked]     = useState(false);
  const [showHow, setShowHow]   = useState(false);
  const [petrol, setPetrol]     = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function fetchPrice() {
      const { data, error } = await supabase
        .from("pp_fuel_prices")
        .select("*")
        .order("week_commencing", { ascending: false })
        .limit(1)
        .single();
      if (data) {
        const change = data.previous_pence
          ? +(data.price_pence - data.previous_pence).toFixed(1)
          : 0;
        setPetrol({
          current:    +data.price_pence,
          yesterday:  +data.previous_pence || +data.price_pence,
          weekAgo:    +(data.price_pence * 0.98).toFixed(1), // fallback estimate
          change24h:  change,
          trend:      change >= 0 ? "up" : "down",
          history:    [
            +(data.price_pence * 0.978).toFixed(1),
            +(data.price_pence * 0.981).toFixed(1),
            +(data.price_pence * 0.985).toFixed(1),
            +(data.price_pence * 0.983).toFixed(1),
            +(data.previous_pence || data.price_pence).toFixed(1),
            +(data.price_pence * 0.999).toFixed(1),
            +data.price_pence,
          ],
          lastUpdated: `w/c ${new Date(data.week_commencing).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}`,
          source: "DESNZ Weekly Data",
          context: "Source: UK Dept. for Energy Security & Net Zero",
        });
      }
      setLoading(false);
    }
    fetchPrice();
  }, []);

  const FLASH_MOVES = petrol ? getFlashMoves(petrol.current) : [];

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px", flexDirection:"column", gap:"16px" }}>
      <div style={{ fontSize:"2rem" }}>⛽</div>
      <div style={{ fontFamily:FONT_BODY, fontSize:"14px", color:"#888" }}>Loading live petrol price...</div>
    </div>
  );

  return (
    <div style={{ paddingBottom:"100px" }}>
      {/* Petrol header card — sits flush under nav, inside cream area */}
      <div style={{ background:NAVY, padding:"16px 16px 0", marginBottom:"0" }}>
        <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:"16px 16px 0 0", padding:"18px", border:"1px solid rgba(255,255,255,0.1)", borderBottom:"none" }}>
          {/* Top row */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"14px" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
                <span style={{ fontSize:"22px" }}>⛽</span>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:800, color:"white", fontFamily:FONT_BODY }}>Unleaded Petrol</div>
                  <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.4)", fontFamily:FONT_BODY }}>Per litre · UK national avg</div>
                </div>
              </div>
              <LiveTicker current={petrol.current} change={petrol.change24h} />
            </div>
            <div style={{ textAlign:"right" }}>
              <SparkLine data={petrol.history} color={petrol.trend==="up" ? "#ff8c42" : "#00cc66"} />
              <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.3)", marginTop:"3px", fontFamily:FONT_BODY }}>7-day trend</div>
            </div>
          </div>

          {/* Context pill */}
          <div style={{ background:"rgba(255,140,0,0.15)", border:"1px solid rgba(255,140,0,0.3)", borderRadius:"8px", padding:"8px 12px", fontSize:"11px", color:"#ff8c42", fontFamily:"'DM Mono', monospace", marginBottom:"12px", display:"flex", alignItems:"center", gap:"7px" }}>
            <span>📊</span><span>{petrol.context}</span>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"12px" }}>
            {[
              { label:"Last week", value:`${petrol.yesterday}p`, color:"white" },
              { label:"Change", value:`${petrol.change24h >= 0 ? "+" : ""}${petrol.change24h}p`, color: petrol.change24h >= 0 ? "#ff8c42" : "#00cc66" },
              { label:"Updated", value: petrol.lastUpdated, color:"rgba(255,255,255,0.5)" },
            ].map(s => (
              <div key={s.label} style={{ background:"rgba(255,255,255,0.07)", borderRadius:"8px", padding:"8px", textAlign:"center" }}>
                <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"13px", color:s.color, fontWeight:700 }}>{s.value}</div>
                <div style={{ fontSize:"8px", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:"2px", fontFamily:FONT_BODY }}>{s.label}</div>
              </div>
            ))}
          </div>

          <FlashCrowdBar selected={selected} />

          <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.25)", fontFamily:FONT_BODY, display:"flex", justifyContent:"space-between" }}>
            <span>Official UK government data</span><span>{petrol.source}</span>
          </div>
        </div>
      </div>

      {/* Prediction area */}
      <div style={{ padding:"18px 16px 0" }}>
        {locked ? (
          <FlashResultCard move={selected} onReset={() => { setLocked(false); setSelected(null); }} />
        ) : (
          <>
            <div style={{ marginBottom:"14px" }}>
              <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"24px", color:NAVY, letterSpacing:"0.04em", lineHeight:1, marginBottom:"4px" }}>
                WHERE WILL PETROL BE TOMORROW?
              </h2>
              <div style={{ fontSize:"12px", color:"#888", fontFamily:FONT_BODY }}>
                Today: {petrol.current}p · Predict next week's national average
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"18px" }}>
              {FLASH_MOVES.map(m => {
                const sel = selected?.id === m.id;
                return (
                  <button key={m.id} onClick={() => setSelected(m)} style={{
                    width:"100%", padding:"13px 16px", borderRadius:"14px",
                    border:`3px solid ${sel ? NAVY : "transparent"}`,
                    background: sel ? m.bg : "white",
                    cursor:"pointer", display:"flex", alignItems:"center", gap:"12px",
                    transform: sel ? "translateX(5px)" : "none",
                    boxShadow: sel ? `4px 0 0 ${NAVY}` : "2px 2px 0 #e0e0e8",
                    transition:"all 0.12s", textAlign:"left", fontFamily:FONT_BODY,
                    position:"relative", overflow:"hidden",
                  }}>
                    <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:m.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", fontWeight:900, color:"white", flexShrink:0 }}>
                      {m.arrow}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:"14px", color:NAVY, fontFamily:FONT_BODY }}>{m.label}</div>
                      <div style={{ fontSize:"11px", color:"#888", marginTop:"1px", fontFamily:FONT_BODY }}>{m.sub} per litre</div>
                    </div>
                    <div style={{ fontFamily:FONT_DISPLAY, fontSize:"16px", color: sel ? NAVY : "#ccc", letterSpacing:"0.04em" }}>+{m.pts}</div>
                    {sel && <div style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"16px", color:NAVY, fontWeight:900 }}>✓</div>}
                  </button>
                );
              })}
            </div>

            <CtaBtn disabled={!selected} onClick={() => selected && setLocked(true)}>
              {selected ? "⚡ LOCK IN MY CALL" : "SELECT A PREDICTION"}
            </CtaBtn>

            <button onClick={() => setShowHow(h => !h)} style={{ display:"block", margin:"14px auto 0", background:"none", border:"none", fontSize:"11px", color:"#aaa", cursor:"pointer", fontFamily:FONT_BODY }}>
              How does Daily Flash work? ↓
            </button>

            {showHow && (
              <div style={{ marginTop:"12px", background:"white", border:"2px solid #eee", borderRadius:"14px", padding:"16px", animation:"slideIn 0.2s ease" }}>
                {[
                  { icon:"⚡", text:"Predict where petrol will be tomorrow — settles at midnight every night." },
                  { icon:"🎯", text:"The closer you are to the actual price, the more points you earn." },
                  { icon:"🔥", text:"Correct daily calls build your streak. Bigger streaks = bigger multipliers." },
                  { icon:"📖", text:"After settlement we explain what moved the price — oil, geopolitics, currency." },
                ].map((h, i) => (
                  <div key={i} style={{ display:"flex", gap:"10px", marginBottom: i < 3 ? "10px" : 0 }}>
                    <span style={{ fontSize:"16px", flexShrink:0 }}>{h.icon}</span>
                    <span style={{ fontSize:"12px", color:"#555", fontFamily:FONT_BODY, lineHeight:1.5 }}>{h.text}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Onboarding modal ────────────────────────────────────────────────────────

const ONBOARD_STEPS = [
  {
    emoji: "🛒",
    title: "Prices change\nall the time",
    body: "Eggs, milk, petrol, bread — the price of everyday goods goes up and down every week. Most people never notice until it hits their wallet.",
  },
  {
    emoji: "🎯",
    title: "You predict\nwhat happens next",
    body: "Pick an item, say whether you think the price will go up or down, and choose a timeframe. Takes about 10 seconds.",
  },
  {
    emoji: "📖",
    title: "Find out\nwhy it happened",
    body: "When your prediction settles we explain exactly why the price moved — supply chains, weather, global events. You'll actually learn something.",
  },
  {
    emoji: "🏆",
    title: "Climb the\nleaderboard",
    body: "Score points for accurate predictions. Compete weekly. Share your results. Top predictors win prizes.",
  },
];

function OnboardingModal({ onDone }) {
  const [step, setStep] = useState(0);
  const current = ONBOARD_STEPS[step];
  const isLast  = step === ONBOARD_STEPS.length - 1;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:"430px", background:"#fffef5", borderRadius:"24px 24px 0 0", padding:"28px 24px 40px", fontFamily:FONT_BODY, animation:"slideIn 0.35s ease" }}>

        {/* Progress bar */}
        <div style={{ display:"flex", gap:"6px", marginBottom:"26px" }}>
          {ONBOARD_STEPS.map((_,i) => (
            <div key={i} style={{ height:"4px", borderRadius:"2px", background: i <= step ? NAVY : "#e0ddd6", flex: i === step ? 2 : 1, transition:"all 0.3s ease" }} />
          ))}
        </div>

        {/* Emoji badge */}
        <div style={{ width:"70px", height:"70px", background:GOLD, borderRadius:"18px", border:`3px solid ${NAVY}`, boxShadow:`4px 4px 0 ${NAVY}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"34px", marginBottom:"20px" }}>
          {current.emoji}
        </div>

        {/* Title */}
        <div style={{ fontFamily:FONT_DISPLAY, fontSize:"30px", color:NAVY, letterSpacing:"0.03em", lineHeight:1.1, marginBottom:"12px", whiteSpace:"pre-line" }}>
          {current.title}
        </div>

        {/* Body */}
        <p style={{ fontSize:"15px", color:"#555", lineHeight:1.65, marginBottom:"28px" }}>
          {current.body}
        </p>

        {/* Buttons */}
        <div style={{ display:"flex", gap:"10px" }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s-1)} style={{ padding:"15px 20px", borderRadius:"14px", border:"2.5px solid #ddd", background:"white", fontSize:"15px", fontWeight:700, cursor:"pointer", fontFamily:FONT_BODY, color:"#888" }}>←</button>
          )}
          <button onClick={() => isLast ? onDone() : setStep(s => s+1)} style={{ flex:1, padding:"15px", borderRadius:"14px", border:`3px solid ${NAVY}`, background:GOLD, color:NAVY, fontSize:"17px", fontWeight:900, fontFamily:FONT_DISPLAY, letterSpacing:"0.08em", cursor:"pointer", boxShadow:`4px 4px 0 ${NAVY}` }}>
            {isLast ? "LET'S PLAY 🥊" : "NEXT →"}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button onClick={onDone} style={{ display:"block", margin:"14px auto 0", background:"none", border:"none", fontSize:"12px", color:"#bbb", cursor:"pointer", fontFamily:FONT_BODY }}>
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Root app ────────────────────────────────────────────────────────────────

const TABS = [
  { id:"flash",      label:"Flash",    emoji:"⚡" },
  { id:"predict",    label:"Predict",  emoji:"🎯" },
  { id:"mycalls",    label:"My Calls", emoji:"📋" },
  { id:"settled",    label:"Settled",  emoji:"✅" },
  { id:"leaderboard",label:"Board",    emoji:"🏆" },
];

export default function PricePunch() {
  const [tab, setTab]             = useState("flash");
  const [user, setUser]           = useState(null); // null = guest
  const [score, setScore]         = useState(0);
  const [streak, setStreak]       = useState(0);
  const [punches, setPunches]     = useState(0);
  const [predictions, setPredictions] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("pp_seen"));
  const [showAuth, setShowAuth]   = useState(false);
  const [authTrigger, setAuthTrigger] = useState("default");

  // Check for existing session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadProfile(session.user.id);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) loadProfile(session.user.id);
    });
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase.from("pp_users").select("*").eq("id", userId).single();
    if (data) {
      setUser(data);
      setPunches(data.punches);
      setStreak(data.streak);
    }
  }

  function triggerAuth(trigger = "default") {
    setAuthTrigger(trigger);
    setShowAuth(true);
  }

  function handleAuth(profile) {
    setShowAuth(false);
    if (profile) {
      setUser(profile);
      setPunches(profile.punches);
      setStreak(profile.streak);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setPunches(0);
    setStreak(0);
  }

  async function handleSubmit({ item, move, tf, pts }) {
    const newPred = { id:Date.now(), item, move, tf, pts };
    setPredictions(prev => [newPred, ...prev]);

    // Save to Supabase if logged in
    if (user) {
      const settlesAt = new Date(Date.now() + tf.days * 86400000).toISOString();
      await supabase.from("pp_predictions").insert({
        user_id: user.id,
        item_id: item.id,
        item_name: item.name,
        move_label: move.label,
        move_direction: move.dir,
        timeframe: tf.label,
        potential_punches: pts,
        settles_at: settlesAt,
      });
    } else {
      // Guest — prompt sign up after first prediction
      setTimeout(() => triggerAuth("prediction"), 1500);
    }

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2200);
    setTab("mycalls");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;600;700;800;900&family=Courier+Prime:wght@400;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:${CREAM}; min-height:100vh; font-size:16px; -webkit-text-size-adjust:100%; }

        @keyframes slideIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes confettiFall {
          0%   { transform:translateY(-20px) rotate(0deg); opacity:1; }
          100% { transform:translateY(100vh) rotate(720deg); opacity:0; }
        }
        @keyframes popIn {
          0%  { transform:scale(0.8); opacity:0; }
          70% { transform:scale(1.05); }
          100%{ transform:scale(1); opacity:1; }
        }

        .tab-btn { flex:1; padding:11px 4px; border:none; background:transparent; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:3px; transition:all 0.15s; border-radius:10px; }
        .tab-btn.active { background:${NAVY}; animation:popIn 0.2s ease; }

        /* Desktop sidebar nav */
        .desktop-nav-btn {
          width:100%; padding:12px 16px; border:none; background:transparent;
          cursor:pointer; display:flex; align-items:center; gap:12px;
          border-radius:12px; transition:all 0.15s; text-align:left;
          font-family:'Outfit',sans-serif;
        }
        .desktop-nav-btn:hover { background:rgba(255,255,255,0.08); }
        .desktop-nav-btn.active { background:${GOLD}; }

        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:#ccc; border-radius:3px; }

        /* Responsive breakpoints */
        .app-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          max-width: 430px;
          margin: 0 auto;
        }

        .mobile-header { display:flex; }
        .mobile-tabs   { display:flex; }
        .desktop-layout { display:none; }

        @media (min-width: 900px) {
          body { background: #e8e4dc; }

          .app-shell { display:none; }

          .desktop-layout {
            display: flex;
            min-height: 100vh;
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
            gap: 24px;
          }

          .desktop-sidebar {
            width: 240px;
            flex-shrink: 0;
            background: ${NAVY};
            border-radius: 24px;
            padding: 24px 16px;
            display: flex;
            flex-direction: column;
            position: sticky;
            top: 24px;
            height: calc(100vh - 48px);
          }

          .desktop-main {
            flex: 1;
            background: ${CREAM};
            border-radius: 24px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            min-height: calc(100vh - 48px);
          }

          .desktop-content {
            flex: 1;
            overflow-y: auto;
            padding: 28px;
          }
        }
      `}</style>

      {showConfetti && <Confetti />}
      {showOnboarding && <OnboardingModal onDone={() => { localStorage.setItem("pp_seen","1"); setShowOnboarding(false); }} />}
      {showAuth && <AuthModal onAuth={handleAuth} trigger={authTrigger} />}

      {/* ── MOBILE layout (< 900px) ── */}
      <div className="app-shell">
        <div className="mobile-header" style={{ background:NAVY, padding:"18px 18px 14px", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"30px", color:GOLD, letterSpacing:"0.06em", lineHeight:1 }}>
              PRICE<span style={{ color:"white" }}>PUNCH</span>
            </div>
            <div style={{ fontSize:"9px", color:"#666", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginTop:"1px", fontFamily:FONT_BODY }}>
              Predict · Learn · Win
            </div>
          </div>
          <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
            {user ? <>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"8px", color:"#888", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FONT_BODY }}>Streak</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:"18px", color:"#ff8c42", lineHeight:1 }}>🔥 {streak}</div>
              </div>
              <div style={{ background:GOLD, borderRadius:"10px", padding:"7px 12px", textAlign:"center", cursor:"pointer" }} onClick={handleSignOut}>
                <div style={{ fontSize:"8px", color:"#888", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FONT_BODY }}>PUNCHES</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:"18px", color:NAVY, lineHeight:1 }}>🥊 {punches}</div>
              </div>
            </> : (
              <button onClick={() => triggerAuth("default")} style={{ background:GOLD, border:`2px solid ${NAVY}`, borderRadius:"10px", padding:"8px 14px", fontFamily:FONT_DISPLAY, fontSize:"16px", color:NAVY, cursor:"pointer", letterSpacing:"0.06em", boxShadow:`3px 3px 0 rgba(0,0,0,0.2)` }}>
                SIGN IN
              </button>
            )}
          </div>
        </div>
        <div className="mobile-tabs" style={{ background:NAVY, padding:"0 10px 10px", gap:"4px", flexShrink:0 }}>
          {TABS.map(t=>(
            <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
              <span style={{ fontSize:"16px" }}>{t.emoji}</span>
              <span style={{ fontSize:"9px", fontWeight:800, color:tab===t.id?GOLD:"#555", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FONT_BODY }}>{t.label}</span>
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:"auto", paddingTop:"18px" }}>
          {tab==="flash"       && <DailyFlashScreen user={user} onAuthTrigger={triggerAuth} />}
          {tab==="predict"     && <PredictScreen     onSubmit={handleSubmit} score={punches} streak={streak} />}
          {tab==="mycalls"     && <MyCallsScreen     predictions={predictions} onGoPredict={()=>setTab("predict")} />}
          {tab==="settled"     && <SettledScreen />}
          {tab==="leaderboard" && <LeaderboardScreen score={punches} user={user} onAuthTrigger={triggerAuth} />}
        </div>
      </div>

      {/* ── DESKTOP layout (≥ 900px) ── */}
      <div className="desktop-layout">

        {/* Sidebar */}
        <div className="desktop-sidebar">
          {/* Logo */}
          <div style={{ marginBottom:"32px", paddingLeft:"8px" }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontSize:"34px", color:GOLD, letterSpacing:"0.06em", lineHeight:1 }}>
              PRICE<span style={{ color:"white" }}>PUNCH</span>
            </div>
            <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.5)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginTop:"3px", fontFamily:FONT_BODY }}>
              Predict · Learn · Win
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"28px" }}>
            <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:"12px", padding:"12px", textAlign:"center" }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:"22px", color:"#ff8c42" }}>🔥 {streak}</div>
              <div style={{ fontSize:"8px", color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FONT_BODY }}>Streak</div>
            </div>
            <div style={{ background:GOLD, borderRadius:"12px", padding:"12px", textAlign:"center" }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:"22px", color:NAVY }}>🥊 {punches}</div>
              <div style={{ fontSize:"8px", color:"#888", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FONT_BODY }}>Punches</div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ display:"flex", flexDirection:"column", gap:"4px", flex:1 }}>
            {TABS.map(t=>(
              <button key={t.id} className={`desktop-nav-btn ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
                <span style={{ fontSize:"20px" }}>{t.emoji}</span>
                <span style={{ fontSize:"14px", fontWeight:800, color: tab===t.id ? NAVY : "rgba(255,255,255,0.85)", fontFamily:FONT_BODY }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div style={{ paddingLeft:"8px", marginTop:"auto" }}>
            {user ? <>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.7)", fontFamily:FONT_BODY, fontWeight:700 }}>@{user.username}</div>
              <button onClick={handleSignOut} style={{ background:"none", border:"none", fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:FONT_BODY, cursor:"pointer", padding:"0", marginTop:"3px" }}>Sign out</button>
            </> : <>
              <button onClick={() => triggerAuth("default")} style={{ background:GOLD, border:`2px solid rgba(255,255,255,0.2)`, borderRadius:"10px", padding:"9px 16px", fontFamily:FONT_DISPLAY, fontSize:"16px", color:NAVY, cursor:"pointer", letterSpacing:"0.06em", width:"100%" }}>
                SIGN IN / JOIN
              </button>
              <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.3)", fontFamily:FONT_BODY, marginTop:"6px", textAlign:"center" }}>Free · No card needed</div>
            </>}
          </div>
        </div>

        {/* Main content */}
        <div className="desktop-main">
          {/* Desktop top bar */}
          <div style={{ background:NAVY, padding:"20px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:"22px", color:"white", letterSpacing:"0.06em" }}>
                {TABS.find(t=>t.id===tab)?.emoji} {TABS.find(t=>t.id===tab)?.label.toUpperCase()}
              </div>
              <div style={{ fontSize:"11px", color:"#555", fontFamily:FONT_BODY, marginTop:"2px" }}>
                {tab==="flash" && "Daily petrol price prediction — settles at midnight"}
                {tab==="predict" && "Pick an item and predict where the price is heading"}
                {tab==="mycalls" && "Your active predictions and their status"}
                {tab==="settled" && "Resolved predictions with explanations"}
                {tab==="leaderboard" && "Weekly rankings — top predictors win prizes"}
              </div>
            </div>
            <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:"10px", padding:"8px 16px", fontSize:"12px", color:"rgba(255,255,255,0.5)", fontFamily:FONT_BODY }}>
              🇬🇧 UK prices · Live data
            </div>
          </div>

          {/* Screen content */}
          <div className="desktop-content">
            {tab==="flash"       && <DailyFlashScreen user={user} onAuthTrigger={triggerAuth} />}
            {tab==="predict"     && <PredictScreen     onSubmit={handleSubmit} score={punches} streak={streak} />}
            {tab==="mycalls"     && <MyCallsScreen     predictions={predictions} onGoPredict={()=>setTab("predict")} />}
            {tab==="settled"     && <SettledScreen />}
            {tab==="leaderboard" && <LeaderboardScreen score={punches} user={user} onAuthTrigger={triggerAuth} />}
          </div>
        </div>
      </div>
    </>
  );
}
