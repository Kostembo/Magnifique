// Magnifique PWA — app shell, navigation, phone frame, role switch
const { motion:Mx, AnimatePresence:APx, IconBtn:IBx, spring:SPRx, springS:SPSx } = Kit;

const NAV = {
  manager: [
    { key:"home",   label:"Сегодня",   icon:"home" },
    { key:"events", label:"События",   icon:"calendar" },
    { key:"team",   label:"Команда",   icon:"users" },
    { key:"notifs", label:"Уведомл.",  icon:"bell" },
  ],
  staff: [
    { key:"home",    label:"Смены",   icon:"calendar" },
    { key:"profile", label:"Профиль", icon:"user" },
  ],
};

function BottomNav({ items, active, onTab, hidden }){
  return (
    <Mx.div animate={{ y: hidden?120:0, opacity: hidden?0:1 }} transition={SPRx}
      className="absolute left-0 right-0 bottom-0 z-50 px-4 pb-5 pt-2 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex items-center justify-around rounded-[26px] px-2 py-2"
        style={{ background:"var(--c-navbar)", backdropFilter:"blur(18px)", border:"1px solid var(--c-track)", boxShadow:"0 18px 50px -18px rgba(0,0,0,0.8)" }}>
        {items.map(it=>{ const on = active===it.key; return (
          <button key={it.key} onClick={()=>onTab(it.key)}
            className="fr relative flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-2 min-h-[48px] min-w-[56px]">
            {on && <Mx.span layoutId="navpill" transition={SPRx} className="absolute inset-0 rounded-2xl" style={{ background:"rgba(246,183,60,0.14)", border:"1px solid rgba(246,183,60,0.25)" }} />}
            <Icon name={it.icon} size={21} className="relative transition-colors" style={{ color: on?"#F6B73C":"var(--c-nav-off)" }} />
            <span className="relative text-[10px] font-600 transition-colors" style={{ color: on?"#F6B73C":"var(--c-nav-off)" }}>{it.label}</span>
          </button>
        ); })}
      </div>
    </Mx.div>
  );
}

function App(){
  const [role,setRole] = useState("manager");
  const [tab,setTab]   = useState("home");
  const [theme,setTheme] = useState("dark");
  const [device,setDevice] = useState("desktop");
  const [stack,setStack] = useState([]); // [{type:'event'|'staff', id, key}]

  useEffect(()=>{ document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  useEffect(()=>{ setStack([]); setTab("home"); }, [role]);

  const push = (type,id)=> setStack(s=>[...s,{ type, id, key:`${type}-${id}-${Date.now()}` }]);
  const back = ()=> setStack(s=>s.slice(0,-1));
  const goTab = (k)=>{ setStack([]); 
    if(role==="staff" && k==="profile"){ /* handled as root */ }
    setTab(k);
  };
  const top = stack[stack.length-1];

  // root view
  const renderRoot = ()=>{
    if(role==="manager"){
      switch(tab){
        case "home":   return <ScreensM.ManagerHome go={push} openNotifs={()=>goTab("notifs")} />;
        case "events": return <ScreensM.EventsList go={push} />;
        case "team":   return <ScreensM.Team go={push} />;
        case "notifs": return <ScreensM.Notifications go={push} />;
        default: return null;
      }
    } else {
      if(tab==="profile") return <ScreensS.EmployeeCard id={MQ.ME_STAFF_ID} go={push} back={()=>goTab("home")} role="staff" />;
      return <ScreensStaff.StaffHome go={push} openNotifs={()=>{}} />;
    }
  };

  const renderTop = ()=>{
    if(!top) return null;
    if(top.type==="event") return <ScreensS.EventDetail id={top.id} go={push} back={back} role={role} />;
    if(top.type==="staff") return <ScreensS.EmployeeCard id={top.id} go={push} back={back} role={role} />;
    return null;
  };

  const viewKey = top ? top.key : `${role}:${tab}`;
  const inDetail = !!top;
  const navItems = NAV[role];
  const navActive = role==="staff" ? tab : tab;

  return (
    <div className="stage">
      {/* chrome */}
      <div className="stage-chrome">
        <div className="role-seg">
          {[["desktop","Десктоп","grid"],["mobile","Мобайл","phone"]].map(([v,l,ic])=>{
            const on = device===v;
            return (
              <button key={v} data-on={on} onClick={()=>setDevice(v)}>
                {on && <Mx.span layoutId="devicepill" className="role-pill" transition={SPRx} />}
                <Icon name={ic} size={15} />{l}
              </button>
            );
          })}
        </div>
        {device==="mobile" && (
          <div className="role-seg">
            {[["manager","Менеджер","shield"],["staff","Официант","tray"]].map(([v,l,ic])=>{
              const on = role===v;
              return (
                <button key={v} data-on={on} onClick={()=>setRole(v)}>
                  {on && <Mx.span layoutId="rolepill" className="role-pill" transition={SPRx} />}
                  <Icon name={ic} size={15} />{l}
                </button>
              );
            })}
          </div>
        )}
        <div className="role-seg">
          {[["light","Светлая","sun"],["dark","Тёмная","moon"]].map(([v,l,ic])=>{
            const on = theme===v;
            return (
              <button key={v} data-on={on} onClick={()=>setTheme(v)}>
                {on && <Mx.span layoutId="themepill" className="role-pill" transition={SPRx} />}
                <Icon name={ic} size={15} />{l}
              </button>
            );
          })}
        </div>
        <span className="chrome-label">Magnifique · прототип</span>
      </div>

      {device==="desktop" ? (
        <div className="desk-wrap">
          <Desktop.DesktopShell key={theme} theme={theme} setTheme={setTheme} />
        </div>
      ) : (
      <div className="phone-wrap">
        <div className="phone">
          <div className="screen">
            <div className="notch" />
            <div className="statusbar">
              <span>9:41</span>
              <span className="dots"><Icon name="zap" size={13} style={{ fill:"currentColor" }} /><span style={{ fontSize:12 }}>5G</span><span style={{ fontSize:13 }}>100%</span></span>
            </div>

            <div className="scroll">
              <Mx.div key={viewKey}
                className="screen-layer absolute inset-0 overflow-y-auto noscroll">
                {top ? renderTop() : renderRoot()}
              </Mx.div>
            </div>

            <BottomNav items={navItems} active={navActive} onTab={goTab} hidden={inDetail} />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
