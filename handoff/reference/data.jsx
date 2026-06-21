// Magnifique PWA — mock data + role model
const ROLE_LABEL = { waiter: "Официант", cook: "Повар", bartender: "Бармен", host: "Хостес", manager: "Менеджер" };
const ROLE_ICON  = { waiter: "tray", cook: "chef", bartender: "wine", host: "sparkle", manager: "shield" };
const TIER_LABEL = { core: "Костяк", regular: "Постоянный", trainee: "Стажёр" };

const GRADS = {
  s1: ["#F6B73C", "#E0792F"], s2: ["#E0788F", "#B0436B"], s3: ["#6FB6E6", "#3B6FB0"],
  s4: ["#7FC8A0", "#3E8E68"], s5: ["#C8A0F0", "#7A52C0"], s6: ["#F0C26A", "#C88A2A"],
  s7: ["#88C0C0", "#3E8888"], s8: ["#E6A36F", "#B06430"], s9: ["#9AA6F0", "#5460C0"],
  s10:["#E68FB6", "#B04680"], me: ["#F6B73C", "#C8881F"],
};

const STAFF = [
  { id:"s1", name:"Дмитрий Соколов", role:"waiter",    tier:"core",    phone:"+7 916 204-18-77", rating:4.9, events:142, since:2019, avail:"on_shift" },
  { id:"s2", name:"Елена Кравцова",  role:"waiter",    tier:"core",    phone:"+7 903 551-09-22", rating:4.8, events:128, since:2020, avail:"available" },
  { id:"s3", name:"Игорь Лебедев",   role:"bartender", tier:"core",    phone:"+7 925 778-43-10", rating:4.9, events:96,  since:2019, avail:"on_shift" },
  { id:"s4", name:"Марина Жукова",   role:"cook",      tier:"regular", phone:"+7 909 312-66-04", rating:4.6, events:64,  since:2021, avail:"available" },
  { id:"s5", name:"Артём Белов",     role:"waiter",    tier:"regular", phone:"+7 917 880-25-19", rating:4.5, events:51,  since:2022, avail:"off" },
  { id:"s6", name:"Ольга Морозова",  role:"host",      tier:"trainee", phone:"+7 926 144-77-38", rating:4.2, events:8,   since:2025, avail:"available" },
  { id:"s7", name:"Павел Котов",     role:"cook",      tier:"core",    phone:"+7 905 663-21-90", rating:4.9, events:110, since:2018, avail:"on_shift" },
  { id:"s8", name:"Светлана Гусева", role:"bartender", tier:"regular", phone:"+7 915 209-55-12", rating:4.7, events:43,  since:2022, avail:"available" },
  { id:"s9", name:"Никита Орлов",    role:"waiter",    tier:"trainee", phone:"+7 919 470-88-61", rating:4.0, events:5,   since:2026, avail:"off" },
  { id:"s10",name:"Татьяна Зайцева", role:"host",      tier:"regular", phone:"+7 903 998-14-25", rating:4.7, events:37,  since:2021, avail:"available" },
];

const MANAGER = { id:"mgr", name:"Анна Воронцова", role:"manager", grad: GRADS.me };
const ME_STAFF_ID = "s1"; // logged-in waiter for staff view

// invite: accepted | pending | declined
function slot(id, invite) { return { id, invite }; }
function P(role, need, slots) { return { role, need, slots }; }

const EVENTS = [
  {
    id:"ev1", title:"Свадьба Громовых", client:"Семья Громовых", venue:"Усадьба «Архангельское»",
    start:"2026-06-15T16:00", status:"live", guests:180, dress:"Чёрный верх · бабочка", call:"14:30",
    positions:[
      P("waiter",12,[slot("s1","accepted"),slot("s2","accepted"),slot("s5","accepted"),slot("s9","pending"),slot("s6","accepted"),slot("s10","accepted"),slot("s1b","accepted")]),
      P("cook",4,[slot("s7","accepted"),slot("s4","accepted"),slot("s4b","accepted"),slot("s7b","pending")]),
      P("bartender",3,[slot("s3","accepted"),slot("s8","accepted"),slot("s8b","declined")]),
    ],
  },
  {
    id:"ev2", title:"Гала-ужин Сбербанк", client:"ПАО Сбербанк", venue:"Radisson Collection, Москва",
    start:"2026-06-16T19:00", status:"recruiting", guests:320, dress:"Смокинг · перчатки", call:"17:00",
    positions:[
      P("waiter",20,[slot("s1","pending"),slot("s2","accepted"),slot("s5","accepted"),slot("s6","pending")]),
      P("cook",6,[slot("s7","accepted"),slot("s4","accepted")]),
      P("bartender",5,[slot("s3","accepted"),slot("s8","pending")]),
    ],
  },
  {
    id:"ev3", title:"Корпоратив Яндекс", client:"Яндекс", venue:"Лофт «Красный Октябрь»",
    start:"2026-06-18T18:30", status:"staffed", guests:150, dress:"Total black", call:"16:30",
    positions:[
      P("waiter",10,[slot("s1","accepted"),slot("s2","accepted"),slot("s5","accepted"),slot("s9","accepted"),slot("s6","accepted"),slot("s10","accepted"),slot("a","accepted"),slot("b","accepted"),slot("c","accepted"),slot("d","accepted")]),
      P("cook",3,[slot("s7","accepted"),slot("s4","accepted"),slot("e","accepted")]),
      P("bartender",3,[slot("s3","accepted"),slot("s8","accepted"),slot("f","accepted")]),
    ],
  },
  {
    id:"ev4", title:"День рождения · 50 лет", client:"Карпов А.В.", venue:"Ресторан «Турандот»",
    start:"2026-06-15T20:00", status:"recruiting", guests:60, dress:"Классика", call:"18:30",
    positions:[
      P("waiter",6,[slot("s6","accepted"),slot("s9","pending")]),
      P("bartender",2,[slot("s8","accepted")]),
    ],
  },
  {
    id:"ev5", title:"Фуршет открытия галереи", client:"Garage Museum", venue:"Парк Горького",
    start:"2026-06-20T17:00", status:"draft", guests:90, dress:"—", call:"15:00",
    positions:[ P("waiter",8,[]), P("bartender",3,[]) ],
  },
  {
    id:"ev6", title:"Презентация BMW", client:"BMW Россия", venue:"Дизайн-завод «Флакон»",
    start:"2026-06-17T19:00", status:"recruiting", guests:120, dress:"Деловой · синий", call:"17:00",
    positions:[
      P("waiter",10,[slot("s1","accepted"),slot("s2","accepted"),slot("s5","pending"),slot("s10","accepted")]),
      P("bartender",4,[slot("s3","accepted"),slot("s8","accepted"),slot("s8c","accepted"),slot("s3b","accepted")]),
    ],
  },
];

const NOTIFS = [
  { id:"n1", kind:"declined", text:"Светлана Гусева отказалась — «Свадьба Громовых»", time:"12 мин", unread:true, who:"s8" },
  { id:"n2", kind:"accepted", text:"Дмитрий Соколов подтвердил смену сегодня", time:"40 мин", unread:true, who:"s1" },
  { id:"n3", kind:"warn",     text:"«Гала-ужин Сбербанк» — не хватает 14 человек", time:"1 ч", unread:true, ev:"ev2" },
  { id:"n4", kind:"accepted", text:"Игорь Лебедев подтвердил смену сегодня", time:"2 ч", unread:false, who:"s3" },
  { id:"n5", kind:"info",     text:"Бриф «Корпоратив Яндекс» обновлён клиентом", time:"5 ч", unread:false, ev:"ev3" },
];

// ——— helpers ———
function staffById(id){ return STAFF.find(s=>s.id===id) || null; }
function eventById(id){ return EVENTS.find(e=>e.id===id) || null; }
function tally(ev){
  let need=0, conf=0, pend=0;
  ev.positions.forEach(p=>{ need+=p.need; p.slots.forEach(s=>{ if(s.invite==="accepted")conf++; else if(s.invite==="pending")pend++; }); });
  return { need, conf, pend, pct: need?conf/need:0 };
}
function myEvents(staffId){
  return EVENTS.filter(e=>e.positions.some(p=>p.slots.some(s=>s.id===staffId)))
    .map(e=>{ const myInvite=(()=>{ for(const p of e.positions){ const f=p.slots.find(s=>s.id===staffId); if(f) return {role:p.role, invite:f.invite}; } return null; })(); return {...e, my:myInvite}; });
}
function historyFor(staffId){
  const up = myEvents(staffId).map(e=>({ title:e.title, date:e.start, role:e.my?.role, kind:"up" }));
  const past = [
    { title:"Юбилей Лукойл", date:"2026-05-28T18:00", role:staffById(staffId)?.role, kind:"past" },
    { title:"Свадьба Орловых", date:"2026-05-17T15:00", role:staffById(staffId)?.role, kind:"past" },
    { title:"Корпоратив Tinkoff", date:"2026-05-02T19:00", role:staffById(staffId)?.role, kind:"past" },
  ];
  return [...up, ...past];
}

// ——— Requisitions (склад) ———
const REQUISITIONS = [
  { id:"r1", event:"Гала-ужин Сбербанк", status:"pending",    items:18, due:"2026-06-16T12:00", by:"Анна Воронцова" },
  { id:"r2", event:"Свадьба Громовых",   status:"collecting", items:24, due:"2026-06-15T10:00", by:"Анна Воронцова" },
  { id:"r3", event:"Корпоратив Яндекс",  status:"ready",      items:15, due:"2026-06-18T13:00", by:"Сергей Минин" },
  { id:"r4", event:"Бизнес-завтрак РБК", status:"issued",     items:9,  due:"2026-06-14T07:00", by:"Анна Воронцова" },
  { id:"r5", event:"Презентация BMW",    status:"pending",    items:12, due:"2026-06-17T14:00", by:"Сергей Минин" },
];
const REQ_STATUS = {
  pending:    { label:"Новая",  c:"#E0A33E" },
  collecting: { label:"Сборка", c:"#7FB2E6" },
  ready:      { label:"Готова", c:"#5FBF8F" },
  issued:     { label:"Выдана", c:"#8a8a92" },
};

// ——— Timesheet (табель) ———
const TIMESHEET = [
  { id:"t1", staff:"s1", event:"Корпоратив Яндекс",  date:"2026-06-18", hours:8, rate:450, status:"confirmed" },
  { id:"t2", staff:"s2", event:"Бизнес-завтрак РБК", date:"2026-06-14", hours:5, rate:450, status:"confirmed" },
  { id:"t3", staff:"s3", event:"Презентация BMW",    date:"2026-06-17", hours:7, rate:500, status:"pending" },
  { id:"t4", staff:"s7", event:"Гала-ужин Сбербанк", date:"2026-06-16", hours:9, rate:600, status:"pending" },
  { id:"t5", staff:"s5", event:"Корпоратив Яндекс",  date:"2026-06-18", hours:8, rate:400, status:"confirmed" },
];

window.MQ = {
  ROLE_LABEL, ROLE_ICON, TIER_LABEL, GRADS, STAFF, MANAGER, ME_STAFF_ID, EVENTS, NOTIFS,
  REQUISITIONS, REQ_STATUS, TIMESHEET,
  staffById, eventById, tally, myEvents, historyFor,
};
