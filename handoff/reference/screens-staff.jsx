// Magnifique PWA — staff (waiter) screens: ShiftsHome
const { motion:M3, MagneticCard:MC3, Btn:Btn3, IconBtn:IB3, Avatar:Av3, Chip:Ch3, Ring:Rg3, Bar:Bar3,
        Section:Sec3, Empty:Emp3, stagger:STG3, fadeUp:FU3, INVITE_META:IM3, STATUS_META:SM3,
        hhmm:HM3, dayShort:DS3, dayLong:DL3, relDay:RD3, spring:SPR3 } = Kit;

function StaffHome({ go, openNotifs }){
  const me = MQ.staffById(MQ.ME_STAFF_ID);
  const mine = MQ.myEvents(MQ.ME_STAFF_ID).sort((a,b)=>new Date(a.start)-new Date(b.start));
  const today = mine.find(e=>RD3(e.start)==="Сегодня");
  const upcoming = mine.filter(e=>RD3(e.start)!=="Сегодня");

  return (
    <M3.div variants={STG3} initial="hidden" animate="show" className="px-5 pb-28 pt-1">
      <M3.div variants={FU3} className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-white/40 font-500">Среда, 15 июня</p>
          <h1 className="font-display font-800 text-[30px] leading-none tracking-[-0.03em] mt-1.5">Мои смены</h1>
        </div>
        <div className="flex items-center gap-1">
          <IB3 name="bell" badge={2} onClick={openNotifs} />
          <Av3 id={me.id} name={me.name} size={42} layoutId={`av-${me.id}`} />
        </div>
      </M3.div>

      {/* today's shift — hero */}
      {today ? (
        <M3.div variants={FU3} className="mt-6">
          <Sec3>Сегодня</Sec3>
          <MC3 layoutId={`ev-${today.id}`} onClick={()=>go("event", today.id)} strength={8}
            className="relative rounded-[28px] p-5 overflow-hidden cursor-pointer"
            style={{ background:"linear-gradient(165deg, rgba(246,183,60,0.16), rgba(246,183,60,0.03) 55%, var(--c-card))", border:"1px solid rgba(246,183,60,0.24)", boxShadow:"0 24px 60px -28px rgba(246,183,60,0.5)" }}>
            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full" style={{ background:"radial-gradient(circle, rgba(246,183,60,0.25), transparent 70%)" }} />
            <div className="relative flex items-center justify-between">
              <Ch3 label={today.status==="live"?"Идёт сейчас":"Сегодня"} color={today.status==="live"?"#5FBF8F":"#F6B73C"} dot live={today.status==="live"} />
              <Ch3 label={IM3[today.my.invite].label} color={IM3[today.my.invite].c} dot />
            </div>
            <M3.h3 layout className="relative font-display font-800 text-[24px] leading-tight tracking-[-0.02em] mt-3.5">{today.title}</M3.h3>
            <p className="relative text-[13px] text-white/55 mt-1 flex items-center gap-1.5"><Icon name="pin" size={14} />{today.venue}</p>

            <div className="relative grid grid-cols-3 gap-2 mt-5">
              {[["Сбор", today.call, "clock"],["Роль", MQ.ROLE_LABEL[today.my.role], "tray"],["Дресс", today.dress.split(" ")[0], "sparkle"]].map(([k,v,ic])=>(
                <div key={k} className="rounded-2xl p-2.5" style={{ background:"rgba(0,0,0,0.25)" }}>
                  <Icon name={ic} size={14} className="text-accent" />
                  <p className="text-[14px] font-700 font-display mt-1 leading-tight">{v}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{k}</p>
                </div>
              ))}
            </div>
            <div className="relative mt-4">
              <Btn3 variant="primary" icon="qr" full onClick={(e)=>{ e.stopPropagation(); }}>Отметиться на смене</Btn3>
            </div>
          </MC3>
        </M3.div>
      ) : (
        <M3.div variants={FU3} className="mt-6"><Empty icon="calendar" title="Сегодня смен нет" sub="Отдыхай — ближайшие смены ниже." /></M3.div>
      )}

      {/* upcoming */}
      <Sec3>Предстоящие смены</Sec3>
      {upcoming.length===0 ? <Emp3 icon="calendarX" title="Пока пусто" sub="Новые смены появятся здесь после приглашения." />
      : (
        <M3.div variants={STG3} initial="hidden" animate="show" className="flex flex-col gap-3">
          {upcoming.map(ev=>(
            <M3.div key={ev.id} variants={FU3}>
              <MC3 layoutId={`ev-${ev.id}`} onClick={()=>go("event", ev.id)}
                className="rounded-3xl p-4 hair cursor-pointer flex items-center gap-4" style={{ background:"var(--c-card)" }}>
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl shrink-0" style={{ background:"var(--c-s2)" }}>
                  <span className="font-display font-800 text-[20px] leading-none">{new Date(ev.start).getDate()}</span>
                  <span className="text-[11px] text-white/40 uppercase mt-0.5">{["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"][new Date(ev.start).getMonth()]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-700 text-[16px] tracking-[-0.01em] truncate">{ev.title}</p>
                  <p className="text-[13px] text-white/45 mt-0.5 flex items-center gap-1.5"><Icon name="clock" size={13} />{hhmm(ev.start)} · {MQ.ROLE_LABEL[ev.my.role]}</p>
                </div>
                <Ch3 label={IM3[ev.my.invite].label} color={IM3[ev.my.invite].c} dot />
              </MC3>
            </M3.div>
          ))}
        </M3.div>
      )}
    </M3.div>
  );
}

window.ScreensStaff = { StaffHome };
