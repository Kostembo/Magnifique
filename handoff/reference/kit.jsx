// Magnifique PWA — motion kit (Framer Motion primitives + UI atoms)
const { useState, useEffect, useRef, useMemo } = React;
const FM = window.Motion || window.FramerMotion || window.framerMotion || {};
const { motion, AnimatePresence, useMotionValue, useSpring, useTransform } = FM;

// signature spring
const spring  = { type:"spring", stiffness:350, damping:28 };
const springS = { type:"spring", stiffness:300, damping:25 };
const layoutSpring = { type:"spring", stiffness:380, damping:32 };

// stagger variants
const stagger = { hidden:{}, show:{ transition:{ staggerChildren:0.06, delayChildren:0.04 } } };
const fadeUp  = { hidden:{ opacity:0, y:14 }, show:{ opacity:1, y:0, transition:spring } };
const fadeIn  = { hidden:{ opacity:0 }, show:{ opacity:1, transition:{ duration:0.3 } } };

// ——— Magnetic, tappable card ———
function MagneticCard({ children, onClick, layoutId, className="", strength=10, style }) {
  const ref = useRef(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, springS), sy = useSpring(y, springS);
  const move = (e) => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    const mx = e.clientX - (r.left + r.width/2);
    const my = e.clientY - (r.top + r.height/2);
    x.set((mx / r.width) * strength * 2);
    y.set((my / r.height) * strength * 2);
  };
  const leave = () => { x.set(0); y.set(0); };
  return (
    <motion.div ref={ref} layoutId={layoutId} onClick={onClick}
      onMouseMove={move} onMouseLeave={leave}
      whileTap={{ scale:0.97 }} style={{ x:sx, y:sy, ...style }}
      className={className}>
      {children}
    </motion.div>
  );
}

// ——— Button: primary / ghost / outline / glass ———
function Btn({ children, onClick, variant="primary", icon, iconR, full, className="", style, ...rest }) {
  const base = "fr inline-flex items-center justify-center gap-2 font-display font-700 tracking-[-0.01em] rounded-2xl select-none cursor-pointer min-h-[48px] px-5 text-[15px] transition-colors";
  const styles = {
    primary:"text-ink",
    ghost:"text-white/70 hover:text-white",
    outline:"text-white border border-white/12 hover:border-white/25 bg-white/[0.02]",
    glass:"text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/10",
    danger:"text-bad border border-bad/25 bg-bad/[0.06] hover:bg-bad/10",
  };
  const primaryStyle = variant==="primary"
    ? { background:"linear-gradient(180deg,#FFD27A,#F6B73C)", boxShadow:"0 6px 22px -6px rgba(246,183,60,0.55)" } : {};
  return (
    <motion.button onClick={onClick} whileTap={{ scale:0.97 }} transition={springS}
      className={`${base} ${styles[variant]} ${full?"w-full":""} ${className}`}
      style={{ ...primaryStyle, ...style }} {...rest}>
      {icon && <Icon name={icon} size={18} />}{children}{iconR && <Icon name={iconR} size={18} />}
    </motion.button>
  );
}

function IconBtn({ name, onClick, badge, size=20, className="", style }) {
  return (
    <motion.button onClick={onClick} whileTap={{ scale:0.9 }} transition={springS}
      className={`fr relative grid place-items-center w-11 h-11 rounded-full text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors ${className}`}
      style={style}>
      <Icon name={name} size={size} />
      {badge ? <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-ink text-[10px] font-700 grid place-items-center font-display">{badge}</span> : null}
    </motion.button>
  );
}

// ——— Avatar (gradient monogram, optional shared layoutId) ———
function initials(name){ return name.split(" ").map(w=>w[0]).slice(0,2).join(""); }
function Avatar({ id, name, size=44, layoutId, ring, className="" }) {
  const g = MQ.GRADS[id] || ["#F6B73C","#C8881F"];
  const fs = Math.round(size*0.38);
  return (
    <motion.div layoutId={layoutId} className={`relative grid place-items-center shrink-0 ${className}`}
      style={{ width:size, height:size }}>
      {ring && <span className="absolute inset-[-3px] rounded-full" style={{ background:`conic-gradient(${g[0]},${g[1]},${g[0]})`, opacity:0.9 }} />}
      <span className="absolute inset-0 rounded-full" style={{ background:`linear-gradient(145deg,${g[0]},${g[1]})` }} />
      <span className="relative font-display font-700 text-ink" style={{ fontSize:fs, letterSpacing:"-0.02em" }}>{initials(name)}</span>
    </motion.div>
  );
}

// ——— Status chip / dot ———
const INVITE_META = {
  accepted:{ label:"Подтвердил", c:"#5FBF8F", bg:"rgba(95,191,143,0.12)" },
  pending:{ label:"Ожидает", c:"#E0A33E", bg:"rgba(224,163,62,0.12)" },
  declined:{ label:"Отказ", c:"#E07A7A", bg:"rgba(224,122,122,0.12)" },
};
const STATUS_META = {
  live:{ label:"Идёт сейчас", c:"#5FBF8F" },
  recruiting:{ label:"Набор", c:"#E0A33E" },
  staffed:{ label:"Укомплектовано", c:"#7FB2E6" },
  draft:{ label:"Черновик", c:"#8a8a92" },
  done:{ label:"Завершено", c:"#8a8a92" },
};
function Chip({ label, color="#8a8a92", bg, dot, live, className="" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[12px] font-600 ${className}`}
      style={{ color, background: bg || `${color}1f` }}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${live?"pulse":""}`} style={{ background:color }} />}
      {label}
    </span>
  );
}

// ——— Circular progress ring ———
function Ring({ value, size=72, stroke=7, children, color="#F6B73C", track="var(--c-track)" }) {
  const r=(size-stroke)/2, c=2*Math.PI*r;
  return (
    <div className="relative grid place-items-center shrink-0" style={{ width:size, height:size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset:c }} animate={{ strokeDashoffset:c*(1-value) }} transition={{ ...spring, delay:0.15 }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

// ——— Linear staffing bar ———
function Bar({ value, h=7, delay=0.1 }) {
  const col = value>=1 ? "#5FBF8F" : value<0.5 ? "#E07A7A" : "#F6B73C";
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height:h, background:"var(--c-hair)" }}>
      <motion.div className="h-full rounded-full" style={{ background:col }}
        initial={{ width:0 }} animate={{ width:`${Math.min(100,value*100)}%` }} transition={{ ...spring, delay }} />
    </div>
  );
}

// ——— CountUp ———
function CountUp({ value, duration=900, className, style }) {
  const [n,setN]=useState(0); const raf=useRef();
  useEffect(()=>{ const s=performance.now();
    const tick=(now)=>{ const t=Math.min(1,(now-s)/duration); setN(value*(1-Math.pow(1-t,3)));
      if(t<1) raf.current=requestAnimationFrame(tick); else setN(value); };
    raf.current=requestAnimationFrame(tick);
    const done=setTimeout(()=>setN(value),duration+120);
    return ()=>{ cancelAnimationFrame(raf.current); clearTimeout(done); };
  },[value]);
  return <span className={className} style={style}>{Number.isInteger(value)?Math.round(n):n.toFixed(1)}</span>;
}

// ——— Skeleton block ———
function Sk({ w="100%", h=16, r=12, className="", style }) {
  return <div className={`sk ${className}`} style={{ width:w, height:h, borderRadius:r, ...style }} />;
}

// ——— Section title ———
function Section({ children, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-6">
      <h2 className="font-display font-700 text-[13px] uppercase tracking-[0.12em] text-white/40">{children}</h2>
      {action && <button onClick={onAction} className="fr text-[13px] font-600 text-accent flex items-center gap-1 rounded-lg px-1">{action}<Icon name="chevronRight" size={14} /></button>}
    </div>
  );
}

// ——— Empty state ———
function Empty({ icon="inbox", title, sub }) {
  return (
    <motion.div variants={fadeUp} className="flex flex-col items-center justify-center text-center py-16 px-8">
      <div className="w-16 h-16 rounded-3xl grid place-items-center mb-4 text-white/30" style={{ background:"var(--c-s3)", border:"1px solid var(--c-hair)" }}>
        <Icon name={icon} size={28} />
      </div>
      <p className="font-display font-700 text-[17px] tracking-[-0.01em]">{title}</p>
      {sub && <p className="text-[14px] text-white/45 mt-1.5 max-w-[230px] leading-snug">{sub}</p>}
    </motion.div>
  );
}

// ——— date helpers (today = 2026-06-15) ———
const TODAY = new Date("2026-06-15T12:00");
const MES = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
const MESL= ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const DOWL= ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"];
function hhmm(iso){ const d=new Date(iso); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function dayShort(iso){ const d=new Date(iso); return `${d.getDate()} ${MES[d.getMonth()]}`; }
function dayLong(iso){ const d=new Date(iso); return `${d.getDate()} ${MESL[d.getMonth()]}`; }
function relDay(iso){ const d=new Date(iso); const dd=Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate()))/86400000);
  if(dd===0) return "Сегодня"; if(dd===1) return "Завтра"; if(dd===-1) return "Вчера"; if(dd>1&&dd<7) return DOWL[d.getDay()][0].toUpperCase()+DOWL[d.getDay()].slice(1); return dayShort(iso); }

window.Kit = {
  motion, AnimatePresence, spring, springS, layoutSpring, stagger, fadeUp, fadeIn,
  MagneticCard, Btn, IconBtn, Avatar, Chip, Ring, Bar, CountUp, Sk, Section, Empty,
  INVITE_META, STATUS_META, initials,
  TODAY, hhmm, dayShort, dayLong, relDay,
};
