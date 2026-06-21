// Magnifique PWA — shared screens: EventDetail, EmployeeCard
const { motion:M2, MagneticCard:MC2, Btn:Btn2, IconBtn:IB2, Avatar:Av2, Chip:Ch2, Ring:Rg2, Bar:Bar2, CountUp:CU2,
        Section:Sec2, Empty:Emp2, stagger:STG2, fadeUp:FU2, INVITE_META:IM2, STATUS_META:SM2,
        hhmm:HM2, dayShort:DS2, dayLong:DL2, relDay:RD2, spring:SPR2 } = Kit;

/* ===================== EVENT DETAIL ===================== */
function EventDetail({ id, go, back, role }){
  const ev = MQ.eventById(id); if(!ev) return null;
  const t = MQ.tally(ev); const sm = SM2[ev.status];
  const d = new Date(ev.start);
  const myStaff = role==="staff" ? ev.positions.flatMap(p=>p.slots.filter(s=>s.id===MQ.ME_STAFF_ID).map(s=>({...s, role:p.role}))) : [];
  const mine = myStaff[0];

  return (
    <div className="h-full flex flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between px-3 pt-1 pb-2 shrink-0">
        <IB2 name="arrowLeft" onClick={back} />
        <IB2 name="dots" onClick={()=>{}} />
      </div>

      <div className="scroll"><div className="scroll-inner noscroll px-5 pb-28">
        {/* HERO — shared layoutId from list card */}
        <MC2 layoutId={`ev-${ev.id}`} strength={0}
          className="relative rounded-[28px] p-5 overflow-hidden"
          style={{ background: ev.status==="live"
            ? "linear-gradient(165deg, rgba(246,183,60,0.16), rgba(246,183,60,0.03) 55%, var(--c-card))"
            : "var(--c-card)",
            border: ev.status==="live" ? "1px solid rgba(246,183,60,0.22)" : "1px solid var(--c-hair)" }}>
          {ev.status==="live" && <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full" style={{ background:"radial-gradient(circle, rgba(246,183,60,0.22), transparent 70%)" }} />}
          <div className="relative flex items-center justify-between">
            <Ch2 label={sm.label} color={sm.c} dot live={ev.status==="live"} />
            <span className="text-[12px] text-white/45 font-500">{ev.guests} гостей</span>
          </div>
          <M2.h1 layout className="relative font-display font-800 text-[27px] leading-[1.08] tracking-[-0.03em] mt-3">{ev.title}</M2.h1>
          <p className="relative text-[14px] text-white/55 mt-1.5">{ev.client}</p>
        </MC2>

        {/* meta rows */}
        <M2.div variants={STG2} initial="hidden" animate="show" className="grid grid-cols-2 gap-2.5 mt-3">
          {[["calendar", DL2(ev.start), RD2(ev.start)],
            ["clock", `${hhmm(ev.start)}`, `сбор ${ev.call}`],
            ["pin", ev.venue, "Площадка"],
            ["sparkle", ev.dress, "Дресс-код"]].map(([ic,main,sub],i)=>(
            <M2.div key={i} variants={FU2} className="rounded-2xl p-3.5 hair" style={{ background:"var(--c-s1)" }}>
              <Icon name={ic} size={16} className="text-accent" />
              <p className="text-[14px] font-600 mt-2 leading-tight">{main}</p>
              <p className="text-[12px] text-white/40 mt-0.5">{sub}</p>
            </M2.div>
          ))}
        </M2.div>

        {/* staff view: my call card */}
        {role==="staff" && mine && (
          <M2.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ ...SPR2, delay:0.1 }}
            className="rounded-3xl p-4 mt-3 flex items-center gap-4" style={{ background:"linear-gradient(135deg, rgba(95,191,143,0.14), rgba(95,191,143,0.03))", border:"1px solid rgba(95,191,143,0.25)" }}>
            <span className="w-12 h-12 rounded-2xl grid place-items-center shrink-0" style={{ background:"rgba(95,191,143,0.18)", color:"#5FBF8F" }}><Icon name={MQ.ROLE_ICON[mine.role]} size={22} /></span>
            <div className="flex-1">
              <p className="text-[12px] text-white/50 font-600 uppercase tracking-wider">Твоя роль</p>
              <p className="font-display font-700 text-[17px]">{MQ.ROLE_LABEL[mine.role]} · сбор {ev.call}</p>
            </div>
          </M2.div>
        )}

        {/* overall staffing */}
        <Sec2>Укомплектованность</Sec2>
        <div className="rounded-3xl p-4 hair flex items-center gap-4" style={{ background:"var(--c-card)" }}>
          <Rg2 value={t.pct} size={68} stroke={7}>
            <p className="font-display font-800 text-[17px]">{Math.round(t.pct*100)}<span className="text-[10px]">%</span></p>
          </Rg2>
          <div className="flex-1">
            <p className="text-[15px]"><b className="font-display font-800 text-[18px]">{t.conf}</b> <span className="text-white/50">из {t.need} подтвердили</span></p>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {t.pend>0 && <Ch2 label={`${t.pend} ждём`} color="#E0A33E" />}
              {t.need-t.conf-t.pend>0 && <Ch2 label={`${t.need-t.conf-t.pend} открыто`} color="#8a8a92" />}
            </div>
          </div>
        </div>

        {/* positions → people */}
        <Sec2>Бригада</Sec2>
        <M2.div variants={STG2} initial="hidden" animate="show" className="flex flex-col gap-4">
          {ev.positions.map((p,pi)=>{
            const filled = p.slots.filter(s=>s.invite==="accepted").length;
            return (
              <M2.div key={pi} variants={FU2}>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 font-display font-700 text-[15px]">
                    <Icon name={MQ.ROLE_ICON[p.role]} size={17} className="text-accent" />{MQ.ROLE_LABEL[p.role]}
                  </span>
                  <span className="text-[13px] font-700 font-display tabular-nums" style={{ color: filled>=p.need?"#5FBF8F":"#F6B73C" }}>{filled}/{p.need}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {p.slots.map((s,si)=>{ const person = MQ.staffById(s.id); const im=IM2[s.invite];
                    return (
                      <MC2 key={si} strength={5} onClick={()=> person && go("staff", s.id)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hair cursor-pointer" style={{ background:"var(--c-s1)" }}>
                        {person ? <Av2 id={s.id} name={person.name} size={38} layoutId={`av-${s.id}`} />
                                : <span className="w-[38px] h-[38px] rounded-full grid place-items-center shrink-0" style={{ background:"var(--c-s3)", color:"rgba(255,255,255,0.4)" }}><Icon name="user" size={18} /></span>}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-600 truncate">{person?person.name:"Свободная позиция"}</p>
                          {person && <p className="text-[12px] text-white/40">{MQ.TIER_LABEL[person.tier]}</p>}
                        </div>
                        <Ch2 label={im.label} color={im.c} dot />
                      </MC2>
                    );
                  })}
                  {Array.from({ length: Math.max(0, p.need - p.slots.length) }).slice(0,2).map((_,k)=>(
                    <div key={"o"+k} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors" style={{ border:"1px dashed rgba(255,255,255,0.12)" }}>
                      <span className="w-[38px] h-[38px] rounded-full grid place-items-center shrink-0" style={{ border:"1px dashed rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.35)" }}><Icon name="plus" size={16} /></span>
                      <p className="text-[14px] text-white/40">Открытая позиция</p>
                    </div>
                  ))}
                </div>
              </M2.div>
            );
          })}
        </M2.div>
      </div></div>

      {/* sticky action bar */}
      <div className="shrink-0 px-5 py-3 hair-t" style={{ background:"rgba(9,9,11,0.85)", backdropFilter:"blur(12px)" }}>
        {role==="manager" ? (
          <div className="flex gap-2.5">
            <Btn2 variant="primary" icon="plus" full onClick={()=>{}}>Добрать</Btn2>
            <Btn2 variant="glass" icon="bell" onClick={()=>{}}>Напомнить</Btn2>
          </div>
        ) : (
          <Btn2 variant="primary" icon="qr" full onClick={()=>{}}>Отметиться на смене</Btn2>
        )}
      </div>
    </div>
  );
}

/* ===================== EMPLOYEE CARD ===================== */
function EmployeeCard({ id, go, back, role }){
  const s = MQ.staffById(id); if(!s) return null;
  const hist = MQ.historyFor(id);
  const AVAIL = { on_shift:["На смене","#5FBF8F"], available:["Свободен","#7FB2E6"], off:["Не работает","#8a8a92"] };
  const [al,ac]=AVAIL[s.avail]; const g = MQ.GRADS[id]||["#F6B73C","#C8881F"];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 pt-1 pb-2 shrink-0">
        <IB2 name="arrowLeft" onClick={back} />
        <IB2 name="dots" onClick={()=>{}} />
      </div>

      <div className="scroll"><div className="scroll-inner noscroll px-5 pb-28">
        {/* hero */}
        <div className="relative flex flex-col items-center text-center pt-2">
          <div className="absolute top-0 w-40 h-40 rounded-full blur-2xl opacity-30" style={{ background:`radial-gradient(circle, ${g[0]}, transparent 70%)` }} />
          <Av2 id={id} name={s.name} size={104} layoutId={`av-${id}`} ring />
          <M2.h1 layout="position" className="relative font-display font-800 text-[26px] tracking-[-0.02em] mt-4">{s.name}</M2.h1>
          <div className="flex items-center gap-2 mt-2">
            <Ch2 label={MQ.ROLE_LABEL[s.role]} color="#F6B73C" />
            <Ch2 label={MQ.TIER_LABEL[s.tier]} color="#7FB2E6" />
            <span className="inline-flex items-center gap-1 text-[12px] font-600" style={{ color:ac }}><span className={`w-1.5 h-1.5 rounded-full ${s.avail==="on_shift"?"pulse":""}`} style={{ background:ac }} />{al}</span>
          </div>
        </div>

        {/* stats */}
        <M2.div variants={STG2} initial="hidden" animate="show" className="grid grid-cols-3 gap-2.5 mt-7">
          {[["Рейтинг", s.rating, "star"],["Событий", s.events, "calendar"],["В команде", `${2026-s.since} г`, "shield"]].map(([k,v,ic],i)=>(
            <M2.div key={i} variants={FU2} className="rounded-2xl p-3.5 hair text-center" style={{ background:"var(--c-s1)" }}>
              <Icon name={ic} size={15} className="text-accent mx-auto" />
              <p className="font-display font-800 text-[20px] mt-1.5 tabular-nums">{typeof v==="number"&&Number.isInteger(v)?<CU2 value={v} />:v}</p>
              <p className="text-[11px] text-white/40 mt-0.5 font-600 uppercase tracking-wider">{k}</p>
            </M2.div>
          ))}
        </M2.div>

        {/* contacts */}
        <div className="flex gap-2.5 mt-3">
          <Btn2 variant="primary" icon="phone" full onClick={()=>{}}>Позвонить</Btn2>
          <Btn2 variant="glass" icon="message" full onClick={()=>{}}>Написать</Btn2>
        </div>
        <div className="rounded-2xl px-4 py-3 mt-3 hair flex items-center gap-3" style={{ background:"var(--c-s1)" }}>
          <Icon name="phone" size={15} className="text-white/40" />
          <span className="text-[14px] text-white/70 font-500 tabular-nums">{s.phone}</span>
        </div>

        {/* history */}
        <Sec2>История мероприятий</Sec2>
        <M2.div variants={STG2} initial="hidden" animate="show" className="flex flex-col gap-2">
          {hist.map((h,i)=>(
            <M2.div key={i} variants={FU2} className="flex items-center gap-3 rounded-2xl p-3 hair" style={{ background:"var(--c-s1)" }}>
              <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: h.kind==="up"?"rgba(246,183,60,0.12)":"var(--c-s3)", color: h.kind==="up"?"#F6B73C":"rgba(255,255,255,0.4)" }}>
                <Icon name={h.kind==="up"?"zap":"check"} size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-600 truncate">{h.title}</p>
                <p className="text-[12px] text-white/40">{DS2(h.date)} · {MQ.ROLE_LABEL[h.role]}</p>
              </div>
              {h.kind==="up" && <Ch2 label="Предстоит" color="#F6B73C" />}
            </M2.div>
          ))}
        </M2.div>

        {role==="manager" && (
          <Btn2 variant="outline" icon="plus" full className="mt-4" onClick={()=>{}}>Назначить на мероприятие</Btn2>
        )}
      </div></div>
    </div>
  );
}

window.ScreensS = { EventDetail, EmployeeCard };
