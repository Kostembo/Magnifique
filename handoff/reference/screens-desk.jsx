// Magnifique — DESKTOP shell + screens (reuses themed animated kit + mobile screens)
const { motion:Md, stagger:STd, fadeUp:FUd, MagneticCard:MCd, Btn:Btnd, Avatar:Avd, Chip:Chd,
        Ring:Rgd, Bar:Bard, CountUp:CUd, Section:Secd, Empty:Empd,
        STATUS_META:SMd, INVITE_META:IMd, hhmm:HMd, relDay:RDd, dayLong:DLd, spring:SPRd } = Kit;

const D_NAV = [
  { key:"home",         label:"Главная",      icon:"grid" },
  { key:"events",       label:"Мероприятия",  icon:"calendar" },
  { key:"team",         label:"Сотрудники",   icon:"users" },
  { key:"requisitions", label:"Заявки",       icon:"clipboard", badge:2 },
  { key:"timesheet",    label:"Табель",       icon:"coins" },
  { key:"settings",     label:"Настройки",    icon:"settings" },
];

function Sidebar({ tab, go }) {
  return (
    <aside className="d-side">
      <div className="d-brand">
        <span className="d-mark">M</span>
        <span className="d-word font-serif">Magnifique</span>
      </div>
      <nav className="d-nav">
        {D_NAV.map(n=>(
          <button key={n.key} onClick={()=>go(n.key)} className={`d-navlink fr ${tab===n.key?"on":""}`}>
            <Icon name={n.icon} size={19} />
            <span>{n.label}</span>
            {n.badge && <span className="d-badge">{n.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="d-user">
        <Avd id="me" name="Анна Воронцова" size={38} />
        <div className="min-w-0">
          <div className="d-user-name">Анна Воронцова</div>
          <div className="d-user-role">Менеджер</div>
        </div>
        <button className="d-logout fr" title="Выйти"><Icon name="logout" size={18} /></button>
      </div>
    </aside>
  );
}

/* ===================== DESKTOP DASHBOARD ===================== */
function DStat({ icon, label, value, color }) {
  return (
    <div className="d-stat hair">
      <div className="d-stat-k"><Icon name={icon} size={15} style={{ color }} />{label}</div>
      <div className="d-stat-v font-display" style={{ color }}><CUd value={value} /></div>
    </div>
  );
}

function DesktopDashboard({ go }) {
  const live = MQ.EVENTS.find(e=>e.status==="live");
  const upcoming = MQ.EVENTS.filter(e=>e.status!=="live").sort((a,b)=>new Date(a.start)-new Date(b.start));
  const todayN = MQ.EVENTS.filter(e=>RDd(e.start)==="Сегодня").length;
  const needN = MQ.EVENTS.filter(e=>{ const t=MQ.tally(e); return t.pct<1 && e.status!=="draft"; }).length;
  const activeN = MQ.STAFF.filter(s=>s.avail!=="off").length;
  const openReq = MQ.REQUISITIONS.filter(r=>r.status!=="issued").length;
  const ICONK = { declined:["xCircle","#E07A7A"], accepted:["checkCircle","#5FBF8F"], warn:["info","#E0A33E"], info:["info","#7FB2E6"] };

  return (
    <Md.div variants={STd} initial="hidden" animate="show" className="d-wrap">
      <Md.div variants={FUd} className="d-head">
        <div>
          <div className="d-eyebrow font-display">Среда · 15 июня</div>
          <h1 className="d-title font-display">Привет, Анна</h1>
          <p className="d-sub">Вот что происходит в ближайшие дни</p>
        </div>
        <Btnd icon="plus" onClick={()=>{}}>Создать мероприятие</Btnd>
      </Md.div>

      <Md.div variants={FUd} className="d-stats">
        <DStat icon="calendar"  label="Сегодня"        value={todayN}  color="hsl(var(--c-accenth))" />
        <DStat icon="info"      label="Требуют добора" value={needN}   color="#E0A33E" />
        <DStat icon="users"     label="Команда"        value={activeN} color="#7FB2E6" />
        <DStat icon="clipboard" label="Заявок"         value={openReq} color="#5FBF8F" />
      </Md.div>

      <div className="d-cols">
        <div>
          {live && (<>
            <Secd>Идёт сейчас</Secd>
            <MCd layoutId={`ev-${live.id}`} onClick={()=>go("event", live.id)} strength={7}
              className="d-live cursor-pointer">
              <div className="d-live-glow" />
              <div className="relative flex items-start justify-between">
                <Chd label="Идёт сейчас" color="#5FBF8F" dot live />
                <span className="text-[12px]" style={{ color:"hsl(var(--fg)/0.5)" }}>сбор был в {live.call}</span>
              </div>
              <Md.h3 layout className="relative d-live-title font-display">{live.title}</Md.h3>
              <p className="relative text-[13px] mt-1 flex items-center gap-1.5" style={{ color:"hsl(var(--fg)/0.55)" }}><Icon name="pin" size={14} />{live.venue}</p>
              <div className="relative flex items-center gap-5 mt-5">
                {(()=>{ const t=MQ.tally(live); return (
                  <Rgd value={t.pct} size={84} stroke={8}>
                    <div className="text-center leading-none"><p className="font-display font-800 text-[21px]">{Math.round(t.pct*100)}<span className="text-[11px]">%</span></p></div>
                  </Rgd> ); })()}
                <div className="flex-1">
                  {(()=>{ const t=MQ.tally(live); return (<>
                    <p className="text-[15px]"><b className="font-700">{t.conf} из {t.need}</b> на месте</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[["accepted",t.conf],["pending",t.pend],["declined",1]].map(([k,n])=> n>0 && (
                        <Chd key={k} label={`${n} ${IMd[k].label.toLowerCase()}`} color={IMd[k].c} />))}
                    </div>
                  </>); })()}
                </div>
              </div>
            </MCd>
          </>)}

          <Secd action="Все" onAction={()=>go("__tab","events")}>Ближайшие</Secd>
          <Md.div variants={STd} initial="hidden" animate="show" className="d-ev-grid">
            {upcoming.slice(0,4).map(ev=>(
              <Md.div key={ev.id} variants={FUd}>
                <MCd layoutId={`ev-${ev.id}`} onClick={()=>go("event", ev.id)}
                  className="d-card hair cursor-pointer">
                  {React.createElement(ScreensM.EventGlance, { ev })}
                </MCd>
              </Md.div>
            ))}
          </Md.div>
        </div>

        <div className="d-rail">
          <div className="d-card hair p-0 overflow-hidden">
            <div className="d-rail-head"><Icon name="bell" size={15} style={{ color:"hsl(var(--c-accenth))" }} />Требуют внимания</div>
            <div>
              {MQ.NOTIFS.slice(0,4).map(n=>{ const [ic,c]=ICONK[n.kind]; return (
                <button key={n.id} onClick={()=> n.ev?go("event",n.ev):n.who&&go("staff",n.who)} className="d-notif fr">
                  <span className="d-notif-ic" style={{ background:`${c}1f`, color:c }}><Icon name={ic} size={16} /></span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[13px] leading-snug" style={{ color:"hsl(var(--fg)/0.85)" }}>{n.text}</p>
                    <p className="text-[11px] mt-0.5" style={{ color:"hsl(var(--fg)/0.4)" }}>{n.time} назад</p>
                  </div>
                </button>
              ); })}
            </div>
          </div>

          <div className="d-card hair p-0 overflow-hidden mt-4">
            <div className="d-rail-head"><Icon name="shield" size={15} style={{ color:"hsl(var(--c-accenth))" }} />Костяк команды</div>
            <div className="p-2">
              {MQ.STAFF.filter(s=>s.tier==="core"&&s.avail!=="off").slice(0,5).map(s=>(
                <button key={s.id} onClick={()=>go("staff", s.id)} className="d-core fr">
                  <Avd id={s.id} name={s.name} size={34} layoutId={`av-${s.id}`} />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-[13.5px] font-600 truncate">{s.name}</div>
                    <div className="text-[12px]" style={{ color:"hsl(var(--fg)/0.45)" }}>{MQ.ROLE_LABEL[s.role]} · {s.events} событий</div>
                  </div>
                  <Icon name={MQ.ROLE_ICON[s.role]} size={16} style={{ color:"hsl(var(--c-accenth))", opacity:.7 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Md.div>
  );
}

/* ===================== REQUISITIONS ===================== */
function Requisitions({ go }) {
  const [f,setF] = useState("all");
  const tabs = [["all","Все"],["pending","Новые"],["collecting","Сборка"],["ready","Готовы"],["issued","Выданы"]];
  const list = MQ.REQUISITIONS.filter(r=> f==="all"||r.status===f);
  return (
    <Md.div variants={STd} initial="hidden" animate="show" className="d-wrap">
      <Md.div variants={FUd} className="d-head">
        <div><h1 className="d-title font-display">Складские заявки</h1>
          <p className="d-sub">{MQ.REQUISITIONS.filter(r=>r.status!=="issued").length} в работе</p></div>
        <Btnd icon="plus" onClick={()=>{}}>Новая заявка</Btnd>
      </Md.div>
      <Md.div variants={FUd} className="flex gap-2 mt-2 mb-5">
        {tabs.map(([v,l])=>(
          <button key={v} onClick={()=>setF(v)} className={`d-chip fr ${f===v?"on":""}`}>{l}</button>
        ))}
      </Md.div>
      <Md.div key={f} variants={STd} initial="hidden" animate="show" className="flex flex-col gap-3">
        {list.length===0 ? <Empd icon="inbox" title="Пусто" sub="Нет заявок в этом фильтре." />
        : list.map(r=>{ const sm=MQ.REQ_STATUS[r.status]; return (
          <Md.div key={r.id} variants={FUd}>
            <MCd strength={5} className="d-card hair cursor-pointer flex items-center gap-4">
              <span className="d-req-ic"><Icon name="inbox" size={22} /></span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-700 text-[15.5px] tracking-[-0.01em]">{r.event}</div>
                <div className="text-[13px] mt-1 flex gap-4 flex-wrap" style={{ color:"hsl(var(--fg)/0.45)" }}>
                  <span>{r.items} позиций</span>
                  <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={13} />к {HMd(r.due)}</span>
                  <span>{r.by}</span>
                </div>
              </div>
              <Chd label={sm.label} color={sm.c} dot />
              <Icon name="chevronRight" size={18} style={{ color:"hsl(var(--fg)/0.3)" }} />
            </MCd>
          </Md.div>
        ); })}
      </Md.div>
    </Md.div>
  );
}

/* ===================== TIMESHEET ===================== */
function Timesheet({ go }) {
  const rows = MQ.TIMESHEET;
  const total = rows.reduce((s,r)=>s+r.hours*r.rate,0);
  const conf = rows.filter(r=>r.status==="confirmed").length;
  return (
    <Md.div variants={STd} initial="hidden" animate="show" className="d-wrap">
      <Md.div variants={FUd} className="d-head">
        <div><h1 className="d-title font-display">Табель</h1>
          <p className="d-sub">Неделя 15–21 июня · к выплате {total.toLocaleString("ru-RU")} ₽</p></div>
        <Btnd variant="glass" icon="download" onClick={()=>{}}>Экспорт</Btnd>
      </Md.div>
      <Md.div variants={FUd} className="d-stats" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
        <div className="d-stat hair"><div className="d-stat-k"><Icon name="clock" size={15} />Часов</div><div className="d-stat-v font-display"><CUd value={rows.reduce((s,r)=>s+r.hours,0)} /></div></div>
        <div className="d-stat hair"><div className="d-stat-k"><Icon name="check" size={15} />Подтверждено</div><div className="d-stat-v font-display">{conf}<span className="text-[15px]" style={{ color:"hsl(var(--fg)/0.4)" }}> / {rows.length}</span></div></div>
        <div className="d-stat hair"><div className="d-stat-k"><Icon name="coins" size={15} style={{ color:"hsl(var(--c-accenth))" }} />К выплате</div><div className="d-stat-v font-display" style={{ fontSize:24 }}>{total.toLocaleString("ru-RU")} ₽</div></div>
      </Md.div>
      <Md.div variants={FUd} className="d-card hair p-0 overflow-hidden mt-1">
        <div className="d-ts-row d-ts-head">
          <span>Сотрудник</span><span>Мероприятие</span><span>Дата</span><span className="text-right">Часы</span><span className="text-right">К выплате</span><span className="text-right">Статус</span>
        </div>
        {rows.map(r=>{ const s=MQ.staffById(r.staff); return (
          <div key={r.id} className="d-ts-row">
            <span className="flex items-center gap-2.5 min-w-0"><Avd id={r.staff} name={s.name} size={30} /><span className="font-600 truncate">{s.name}</span></span>
            <span className="truncate" style={{ color:"hsl(var(--fg)/0.55)" }}>{r.event}</span>
            <span style={{ color:"hsl(var(--fg)/0.55)" }}>{HMd(r.date) && new Date(r.date).getDate()+" июн"}</span>
            <span className="text-right tabular-nums">{r.hours} ч</span>
            <span className="text-right tabular-nums font-700">{(r.hours*r.rate).toLocaleString("ru-RU")} ₽</span>
            <span className="text-right">{r.status==="confirmed"
              ? <Chd label="Готово" color="#5FBF8F" dot />
              : <Chd label="Ждём" color="#E0A33E" dot />}</span>
          </div>
        ); })}
      </Md.div>
    </Md.div>
  );
}

/* ===================== SETTINGS (with theme switch) ===================== */
function DSwitch({ on, onClick }) {
  return (
    <button onClick={onClick} className="d-switch fr" data-on={on}><span className="d-knob" /></button>
  );
}
function Settings({ theme, setTheme }) {
  const [push,setPush] = useState(true);
  const [sms,setSms] = useState(false);
  return (
    <Md.div variants={STd} initial="hidden" animate="show" className="d-wrap" style={{ maxWidth:720 }}>
      <Md.div variants={FUd} className="d-head"><div><h1 className="d-title font-display">Настройки</h1><p className="d-sub">Профиль и оформление</p></div></Md.div>

      <Md.div variants={FUd} className="d-card hair" style={{ padding:20 }}>
        <div className="flex items-center gap-4">
          <Avd id="me" name="Анна Воронцова" size={56} />
          <div className="flex-1"><div className="font-display font-800 text-[18px]">Анна Воронцова</div><div className="text-[13px]" style={{ color:"hsl(var(--fg)/0.5)" }}>Менеджер · +7 900 000-00-00</div></div>
          <Btnd variant="glass" icon="pencil" onClick={()=>{}}>Изменить</Btnd>
        </div>
      </Md.div>

      <Md.div variants={FUd} className="d-card hair mt-4" style={{ padding:20 }}>
        <div className="d-set-title font-display">Оформление</div>
        <p className="text-[13px] mb-3" style={{ color:"hsl(var(--fg)/0.5)" }}>Выберите тему интерфейса</p>
        <div className="d-theme-seg">
          {[["light","Светлая","sun"],["dark","Тёмная","moon"]].map(([v,l,ic])=>(
            <button key={v} onClick={()=>setTheme(v)} className={`fr ${theme===v?"on":""}`}>
              <Icon name={ic} size={17} />{l}
            </button>
          ))}
        </div>
      </Md.div>

      <Md.div variants={FUd} className="d-card hair mt-4" style={{ padding:"6px 20px" }}>
        {[["Push-уведомления", push, ()=>setPush(p=>!p)],["SMS о сменах", sms, ()=>setSms(p=>!p)]].map(([l,val,fn],i)=>(
          <div key={i} className="flex items-center justify-between py-3.5" style={{ borderTop: i? "1px solid var(--c-hair)":"none" }}>
            <span className="text-[14.5px] font-500">{l}</span>
            <DSwitch on={val} onClick={fn} />
          </div>
        ))}
      </Md.div>
    </Md.div>
  );
}

/* ===================== DESKTOP SHELL ===================== */
function DesktopShell({ theme, setTheme }) {
  const [tab,setTab] = useState("home");
  const [stack,setStack] = useState([]);
  const push = (type,id)=>{
    if(type==="__tab"){ setStack([]); setTab(id); return; }
    setStack(s=>[...s,{ type, id, key:`${type}-${id}-${Date.now()}` }]);
  };
  const back = ()=> setStack(s=>s.slice(0,-1));
  const goTab = (k)=>{ setStack([]); setTab(k); };
  const top = stack[stack.length-1];

  const content = ()=>{
    if(top?.type==="event") return <ScreensS.EventDetail id={top.id} go={push} back={back} role="manager" />;
    if(top?.type==="staff") return <ScreensS.EmployeeCard id={top.id} go={push} back={back} role="manager" />;
    switch(tab){
      case "home":         return <DesktopDashboard go={push} />;
      case "events":       return <ScreensM.EventsList go={push} />;
      case "team":         return <ScreensM.Team go={push} />;
      case "requisitions": return <Requisitions go={push} />;
      case "timesheet":    return <Timesheet go={push} />;
      case "settings":     return <Settings theme={theme} setTheme={setTheme} />;
      default: return <DesktopDashboard go={push} />;
    }
  };
  const isDetail = !!top;
  const viewKey = top ? top.key : tab;

  return (
    <div className="desktop">
      <Sidebar tab={tab} go={goTab} />
      <div className="d-content">
        <Md.div key={viewKey} className={`d-layer ${isDetail?"d-layer-detail":""} noscroll`}>
          {content()}
        </Md.div>
      </div>
    </div>
  );
}

window.Desktop = { DesktopShell };
