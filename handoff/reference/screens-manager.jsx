// Magnifique PWA — manager screens: Dashboard, EventsList, Team, Notifications
const { motion:M1, AnimatePresence:AP1, MagneticCard, Btn, IconBtn, Avatar, Chip, Ring, Bar, CountUp, Sk, Section, Empty,
        stagger:STG, fadeUp:FU, INVITE_META, STATUS_META, hhmm, dayShort, relDay, dayLong, springS:SPS } = Kit;

function useFakeLoad(ms=750){ const [l,setL]=useState(true); useEffect(()=>{ const t=setTimeout(()=>setL(false),ms); return ()=>clearTimeout(t); },[]); return l; }

// shared event hero card body (used in list + reused visually in detail)
function EventGlance({ ev }){
  const t = MQ.tally(ev); const sm = STATUS_META[ev.status];
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-800 text-[18px] leading-tight tracking-[-0.02em] truncate">{ev.title}</p>
          <p className="text-[13px] text-white/45 mt-1 truncate">{ev.client}</p>
        </div>
        <Chip label={sm.label} color={sm.c} dot live={ev.status==="live"} />
      </div>
      <div className="flex items-center gap-4 mt-3 text-[13px] text-white/55">
        <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={14} />{relDay(ev.start)}, {hhmm(ev.start)}</span>
        <span className="inline-flex items-center gap-1.5 min-w-0"><Icon name="users" size={14} />{ev.guests}</span>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-white/40 font-500">Бригада</span>
          <span className="text-[12px] font-700 font-display tabular-nums" style={{ color: t.pct>=1?"#5FBF8F":t.pct<0.5?"#E07A7A":"#F6B73C" }}>{t.conf}/{t.need}</span>
        </div>
        <Bar value={t.pct} />
      </div>
    </>
  );
}

function EventCardSkeleton(){
  return (
    <div className="rounded-3xl p-4 hair" style={{ background:"var(--c-card)" }}>
      <div className="flex justify-between"><Sk w={150} h={18} /><Sk w={70} h={26} r={999} /></div>
      <Sk w={110} h={13} className="mt-2.5" />
      <Sk w="100%" h={7} r={999} className="mt-5" />
    </div>
  );
}

/* ===================== DASHBOARD ===================== */
function ManagerHome({ go, openNotifs }){
  const loading = useFakeLoad(800);
  const live = MQ.EVENTS.find(e=>e.status==="live");
  const upcoming = MQ.EVENTS.filter(e=>e.status!=="live").sort((a,b)=>new Date(a.start)-new Date(b.start));
  const needAttention = MQ.EVENTS.filter(e=>{ const t=MQ.tally(e); return t.pct<1 && e.status!=="draft"; }).length;
  const unread = MQ.NOTIFS.filter(n=>n.unread).length;
  const d = Kit.TODAY;

  return (
    <M1.div variants={STG} initial="hidden" animate="show" className="px-5 pb-28 pt-1">
      {/* header */}
      <M1.div variants={FU} className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-white/40 font-500 capitalize">{Kit.dayLong(d.toISOString())}, среда</p>
          <h1 className="font-display font-800 text-[30px] leading-none tracking-[-0.03em] mt-1.5">Привет, Анна</h1>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn name="bell" badge={unread||null} onClick={openNotifs} />
          <Avatar id="me" name="Анна Воронцова" size={42} />
        </div>
      </M1.div>

      {/* quick stats */}
      <M1.div variants={FU} className="grid grid-cols-3 gap-2.5 mt-6">
        {[["Сегодня", MQ.EVENTS.filter(e=>relDay(e.start)==="Сегодня").length, "#F6B73C"],
          ["Добор", needAttention, "#E0A33E"],
          ["Команда", MQ.STAFF.filter(s=>s.avail!=="off").length, "#7FB2E6"]].map(([k,v,c])=>(
          <div key={k} className="rounded-2xl p-3.5 hair" style={{ background:"var(--c-s1)" }}>
            <p className="text-[11px] text-white/40 font-600 uppercase tracking-wider">{k}</p>
            <p className="font-display font-800 text-[26px] mt-1 tabular-nums" style={{ color:c }}><CountUp value={v} /></p>
          </div>
        ))}
      </M1.div>

      {/* LIVE event hero */}
      {loading ? (
        <M1.div variants={FU} className="mt-6"><div className="rounded-[28px] p-5 hair" style={{ background:"var(--c-card)" }}>
          <Sk w={90} h={24} r={999} /><Sk w={200} h={26} className="mt-4" /><Sk w={140} h={14} className="mt-3" />
          <div className="flex gap-4 mt-5 items-center"><Sk w={72} h={72} r={999} /><div className="flex-1"><Sk w="100%" h={12} /><Sk w="80%" h={12} className="mt-2" /></div></div>
        </div></M1.div>
      ) : live && (
        <M1.div variants={FU} className="mt-6">
          <Section>Идёт сейчас</Section>
          <MagneticCard layoutId={`ev-${live.id}`} onClick={()=>go("event", live.id)} strength={8}
            className="relative rounded-[28px] p-5 overflow-hidden cursor-pointer"
            style={{ background:"linear-gradient(165deg, rgba(246,183,60,0.14), rgba(246,183,60,0.03) 55%, var(--c-card))", border:"1px solid rgba(246,183,60,0.22)", boxShadow:"0 24px 60px -28px rgba(246,183,60,0.5)" }}>
            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full" style={{ background:"radial-gradient(circle, rgba(246,183,60,0.25), transparent 70%)" }} />
            <div className="relative flex items-start justify-between">
              <Chip label="Идёт сейчас" color="#5FBF8F" dot live />
              <span className="text-[12px] text-white/50 font-500">сбор был в {live.call}</span>
            </div>
            <M1.h3 layout className="relative font-display font-800 text-[24px] leading-tight tracking-[-0.02em] mt-3.5">{live.title}</M1.h3>
            <p className="relative text-[13px] text-white/55 mt-1 flex items-center gap-1.5"><Icon name="pin" size={14} />{live.venue}</p>
            <div className="relative flex items-center gap-4 mt-5">
              {(()=>{ const t=MQ.tally(live); return (
                <Ring value={t.pct} size={76} stroke={8}>
                  <div className="text-center leading-none">
                    <p className="font-display font-800 text-[19px]">{Math.round(t.pct*100)}<span className="text-[11px]">%</span></p>
                  </div>
                </Ring> ); })()}
              <div className="flex-1">
                {(()=>{ const t=MQ.tally(live); return (<>
                  <p className="text-[14px] text-white/85"><b className="text-white font-700">{t.conf} из {t.need}</b> на месте</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[["accepted",t.conf],["pending",t.pend],["declined",1]].map(([k,n])=> n>0 && (
                      <Chip key={k} label={`${n} ${INVITE_META[k].label.toLowerCase()}`} color={INVITE_META[k].c} />
                    ))}
                  </div>
                </>); })()}
              </div>
            </div>
          </MagneticCard>
        </M1.div>
      )}

      {/* upcoming */}
      <Section action="Все" onAction={()=>go("events")}>Ближайшие</Section>
      {loading ? (
        <div className="flex flex-col gap-3">{[0,1,2].map(i=><M1.div key={i} variants={FU}><EventCardSkeleton/></M1.div>)}</div>
      ) : (
        <M1.div variants={STG} initial="hidden" animate="show" className="flex flex-col gap-3">
          {upcoming.slice(0,4).map(ev=>(
            <M1.div key={ev.id} variants={FU}>
              <MagneticCard layoutId={`ev-${ev.id}`} onClick={()=>go("event", ev.id)}
                className="rounded-3xl p-4 hair cursor-pointer" style={{ background:"var(--c-card)" }}>
                <EventGlance ev={ev} />
              </MagneticCard>
            </M1.div>
          ))}
        </M1.div>
      )}
    </M1.div>
  );
}

/* ===================== EVENTS LIST ===================== */
function EventsList({ go }){
  const [f,setF] = useState("all");
  const filters = [["all","Все"],["live","Идёт"],["recruiting","Набор"],["staffed","Готовы"],["draft","Черновики"]];
  const list = useMemo(()=> MQ.EVENTS.filter(e=> f==="all"||e.status===f).sort((a,b)=>new Date(a.start)-new Date(b.start)), [f]);
  return (
    <M1.div variants={STG} initial="hidden" animate="show" className="px-5 pb-28 pt-1">
      <M1.h1 variants={FU} className="font-display font-800 text-[28px] tracking-[-0.03em] mt-1">События</M1.h1>
      <M1.div variants={FU} className="flex gap-2 mt-4 overflow-x-auto noscroll -mx-5 px-5">
        {filters.map(([v,l])=>(
          <button key={v} onClick={()=>setF(v)}
            className={`fr shrink-0 px-4 h-9 rounded-full text-[13px] font-600 transition-colors ${f===v?"text-ink":"text-white/60 hair"}`}
            style={ f===v ? { background:"linear-gradient(180deg,#FFD27A,#F6B73C)" } : { background:"var(--c-s1)" }}>{l}</button>
        ))}
      </M1.div>
      <AP1 mode="wait">
        <M1.div key={f} variants={STG} initial="hidden" animate="show" exit={{ opacity:0 }} className="flex flex-col gap-3 mt-5">
          {list.length===0 ? <Empty icon="calendarX" title="Ничего нет" sub="В этом фильтре пока нет мероприятий." />
          : list.map(ev=>(
            <M1.div key={ev.id} variants={FU}>
              <MagneticCard layoutId={`ev-${ev.id}`} onClick={()=>go("event", ev.id)}
                className="rounded-3xl p-4 hair cursor-pointer" style={{ background:"var(--c-card)" }}>
                <EventGlance ev={ev} />
              </MagneticCard>
            </M1.div>
          ))}
        </M1.div>
      </AP1>
    </M1.div>
  );
}

/* ===================== TEAM ===================== */
function Team({ go }){
  const [q,setQ] = useState(""); const [role,setRole] = useState("all");
  const roles = [["all","Все"],["waiter","Официанты"],["cook","Повара"],["bartender","Бармены"],["host","Хостес"]];
  const list = useMemo(()=> MQ.STAFF.filter(s=> (role==="all"||s.role===role) && (!q || s.name.toLowerCase().includes(q.toLowerCase()))), [q,role]);
  const AVAIL = { on_shift:["На смене","#5FBF8F"], available:["Свободен","#7FB2E6"], off:["Не работает","#8a8a92"] };
  return (
    <M1.div variants={STG} initial="hidden" animate="show" className="px-5 pb-28 pt-1">
      <M1.h1 variants={FU} className="font-display font-800 text-[28px] tracking-[-0.03em] mt-1">Команда</M1.h1>
      <M1.div variants={FU} className="relative mt-4">
        <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск по имени…"
          className="fr w-full h-12 rounded-2xl pl-11 pr-4 text-[15px] text-white placeholder:text-white/30 hair"
          style={{ background:"var(--c-s2)" }} />
      </M1.div>
      <M1.div variants={FU} className="flex gap-2 mt-3 overflow-x-auto noscroll -mx-5 px-5">
        {roles.map(([v,l])=>(
          <button key={v} onClick={()=>setRole(v)}
            className={`fr shrink-0 px-4 h-9 rounded-full text-[13px] font-600 transition-colors ${role===v?"text-ink":"text-white/60 hair"}`}
            style={ role===v ? { background:"linear-gradient(180deg,#FFD27A,#F6B73C)" } : { background:"var(--c-s1)" }}>{l}</button>
        ))}
      </M1.div>
      <AP1 mode="wait">
        <M1.div key={role+q} variants={STG} initial="hidden" animate="show" exit={{ opacity:0 }} className="flex flex-col gap-2.5 mt-5">
          {list.length===0 ? <Empty icon="users" title="Никого не найдено" sub="Измените запрос или фильтр." />
          : list.map(s=>{ const [al,ac]=AVAIL[s.avail]; return (
            <M1.div key={s.id} variants={FU}>
              <MagneticCard onClick={()=>go("staff", s.id)} strength={7}
                className="flex items-center gap-3.5 rounded-3xl p-3.5 hair cursor-pointer" style={{ background:"var(--c-card)" }}>
                <Avatar id={s.id} name={s.name} size={50} layoutId={`av-${s.id}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-700 text-[16px] tracking-[-0.01em] truncate">{s.name}</p>
                  <p className="text-[13px] text-white/45 mt-0.5">{MQ.ROLE_LABEL[s.role]} · {MQ.TIER_LABEL[s.tier]}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[13px] font-700 font-display"><Icon name="star" size={13} className="text-accent" style={{ fill:"#F6B73C" }} />{s.rating}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-600" style={{ color:ac }}><span className="w-1.5 h-1.5 rounded-full" style={{ background:ac }} />{al}</span>
                </div>
              </MagneticCard>
            </M1.div>
          ); })}
        </M1.div>
      </AP1>
    </M1.div>
  );
}

/* ===================== NOTIFICATIONS ===================== */
function Notifications({ go }){
  const ICONK = { declined:["xCircle","#E07A7A"], accepted:["checkCircle","#5FBF8F"], warn:["info","#E0A33E"], info:["info","#7FB2E6"] };
  return (
    <M1.div variants={STG} initial="hidden" animate="show" className="px-5 pb-28 pt-1">
      <M1.h1 variants={FU} className="font-display font-800 text-[28px] tracking-[-0.03em] mt-1">Уведомления</M1.h1>
      <M1.div variants={STG} className="flex flex-col gap-2 mt-5">
        {MQ.NOTIFS.map(n=>{ const [ic,c]=ICONK[n.kind]; return (
          <M1.div key={n.id} variants={FU}>
            <MagneticCard strength={5} onClick={()=> n.ev?go("event",n.ev):n.who&&go("staff",n.who)}
              className="flex items-start gap-3 rounded-2xl p-3.5 hair cursor-pointer" style={{ background: n.unread?"var(--c-s2)":"var(--c-s1)" }}>
              <span className="w-9 h-9 rounded-full grid place-items-center shrink-0" style={{ background:`${c}1f`, color:c }}><Icon name={ic} size={18} /></span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] leading-snug text-white/85">{n.text}</p>
                <p className="text-[12px] text-white/35 mt-1">{n.time} назад</p>
              </div>
              {n.unread && <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />}
            </MagneticCard>
          </M1.div>
        ); })}
      </M1.div>
    </M1.div>
  );
}

window.ScreensM = { ManagerHome, EventsList, Team, Notifications, EventGlance };
