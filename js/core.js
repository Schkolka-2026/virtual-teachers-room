/* CORE.JS — application integration and smaller modules */
const __base = window.__schoolBase;
Object.keys(__base).forEach(k => { if (!(k in window)) window[k] = __base[k]; });
let state = __base.state;
window.App = window.App || {};
window.App.state = state;

// The original renderer is kept as the fallback for the smaller modules.
const __legacyRender = window.render;
window.render = function(){
  if(state?.currentPage === 'analytics' && window.App.analytics?.render) return window.App.analytics.render();
  if(state?.currentPage === 'reports' && window.App.reports?.render) return window.App.reports.render();
  return __legacyRender();
};

// Navigation is wrapped so module renderers are used after their files are loaded.
const __legacyNavigate = window.navigate;
window.navigate = function(page){
  if(state?.currentPage !== page) state.currentPage = page;
  if(typeof save === 'function') save();
  document.getElementById('profileMenu')?.classList.add('hidden');
  if(page === 'analytics' && window.App.analytics?.render) return window.App.analytics.render();
  if(page === 'reports' && window.App.reports?.render) return window.App.reports.render();
  return __legacyNavigate(page);
};

// PATCH: server-backed password, settings, schedule, notifications, journal control, read reports and work plan.

async function refreshRuntimeData(){
  try{await loadAppSettingsFromSupabase();}catch(e){console.warn('refresh settings',e);}
  const jobs=[
    ['schedule',loadScheduleServer],
    ['notifications',loadNotificationsServer],
    ['plan',loadWorkPlanServer],
    ['journal',loadJournalOverdueServer],
    ['attendance',loadAttendanceServer]
  ];
  await Promise.all(jobs.map(async ([name,fn])=>{try{await fn();}catch(e){console.warn('refresh '+name,e);}}));
  try{save();}catch(e){}
}

async function loadScheduleServer(){
  let daily=await sbRest('school_schedule_lessons','select=*&order=schedule_date.asc,shift.asc,lesson.asc,class_name.asc');
  let base=await sbRest('school_base_schedule','select=*&order=shift.asc,day_index.asc,lesson.asc,class_name.asc');

  // Одноразовая миграция старого localStorage-расписания, которое уже было
  // загружено администратором до перехода на серверное хранение.
  if(!(daily||[]).length && isDispatcher() && (state.schedule.entries||[]).length){
    const groups={};
    (state.schedule.entries||[]).forEach(x=>{const k=`${x.date}::${x.shift}`;(groups[k]??=[]).push(x);});
    for(const arr of Object.values(groups)){
      if(arr.length)await saveScheduleRows({date:arr[0].date,shift:arr[0].shift,entries:arr});
    }
    daily=await sbRest('school_schedule_lessons','select=*&order=schedule_date.asc,shift.asc,lesson.asc,class_name.asc');
  }
  if(!(base||[]).length && isDispatcher() && (state.schedule.baseEntries||[]).length){
    const groups={};
    (state.schedule.baseEntries||[]).forEach(x=>{const k=String(x.shift);(groups[k]??=[]).push(x);});
    for(const arr of Object.values(groups)){
      if(arr.length)await saveBaseScheduleRows({shift:arr[0].shift,entries:arr});
    }
    base=await sbRest('school_base_schedule','select=*&order=shift.asc,day_index.asc,lesson.asc,class_name.asc');
  }
  const mappedDaily=(daily||[]).map(x=>({
    id:Number(x.id),date:x.schedule_date,shift:Number(x.shift),lesson:Number(x.lesson),className:x.class_name,
    subject:x.subject||"",teacher:x.teacher||"",room:x.room||""
  }));
  const seenKeys=new Set();
  state.schedule.entries=mappedDaily.filter(x=>{
    if(!x.subject && !x.teacher)return false;
    if(!x.teacher && looksLikeTeacherName(x.subject))return false;
    const key=[x.date,x.shift,x.lesson,x.className,x.subject,x.teacher,x.room].join("|");
    if(seenKeys.has(key))return false;
    seenKeys.add(key);return true;
  });
  state.schedule.baseEntries=(base||[]).map(x=>({
    id:Number(x.id),shift:Number(x.shift),dayIndex:Number(x.day_index),lesson:Number(x.lesson),className:x.class_name,
    subject:x.subject||'',teacher:x.teacher||'',room:x.room||''
  }));
  state.schedule.versions=(daily||[]).reduce((acc,x)=>{
    const k=`${x.schedule_date}::${x.shift}`;
    if(!acc.some(v=>v.key===k))acc.push({key:k,date:x.schedule_date,shift:Number(x.shift),fileName:''});
    return acc;
  },[]);
  return true;
}

async function loadNotificationsServer(){
  const rows=await sbRest('school_notifications','select=*&order=created_at.desc');
  state.notifications=(rows||[]).map(x=>({
    id:Number(x.id),type:x.notification_type,title:x.title,text:x.body,date:new Date(x.created_at).toLocaleDateString('ru-RU'),
    read:!!x.read_at,readAt:x.read_at||'',teacher:(state.users.find(u=>Number(u.id)===Number(x.recipient_employee_id))||{}).login||'',
    teacherId:Number(x.recipient_employee_id),senderEmployeeId:Number(x.sender_employee_id),visit:x.visit_data||{},senderName:x.sender_name||''
  }));
  return true;
}

async function loadWorkPlanServer(){
  const rows=await sbRest('work_plan','select=*&order=event_date.asc,event_time.asc,id.asc');
  state.plan=(rows||[]).map(x=>({
    id:Number(x.id),date:x.event_date,time:x.event_time||'',title:x.event_title||'',place:x.place||'',participants:x.participants||'',
    responsible:x.responsible_name||'',responsibleEmployeeId:x.responsible_employee_id?Number(x.responsible_employee_id):null,
    status:x.status,author:x.author_name||'',authorEmployeeId:Number(x.author_employee_id),createdAt:x.created_at,updatedAt:x.updated_at
  }));
  return true;
}

async function loadAttendanceServer(){
  const rows=await sbRest('attendance_records','select=*&order=attendance_date.desc,class_name.asc');
  state.attendance=(rows||[]).map(x=>({
    ...(x.data||{}),id:Number(x.id),date:x.attendance_date,className:x.class_name,
    teacherEmployeeId:Number(x.teacher_employee_id),teacher:x.teacher_name||x.data?.teacher||'',total:Number(x.total)||0,present:Number(x.present)||0
  }));
  return true;
}

async function loadJournalOverdueServer(){
  const rows=await sbRest('journal_overdue','select=*&order=report_date.desc,employee_name.asc');
  state.journalOverdue=(rows||[]).map(x=>({
    id:Number(x.id),employeeId:Number(x.employee_id),login:x.employee_login||'',name:x.employee_name||'',date:x.report_date,count:Number(x.overdue_count)||0
  }));
  return true;
}

async function saveScheduleRows(parsed){
  const date=parsed.date, shift=Number(parsed.shift), now=new Date().toISOString();
  await sbMutate('school_schedule_lessons','DELETE',`schedule_date=eq.${encodeURIComponent(date)}&shift=eq.${shift}`);
  const rows=(parsed.entries||[]).map(x=>({
    schedule_date:date,shift,lesson:Number(x.lesson)||0,class_name:String(x.className||''),subject:String(x.subject||''),
    teacher:String(x.teacher||''),room:String(x.room||''),uploaded_at:now,uploaded_by:Number(state.currentUser.id)
  }));
  if(rows.length)await sbMutate('school_schedule_lessons','POST','',rows);
}

async function saveBaseScheduleRows(parsed){
  const shift=Number(parsed.shift),now=new Date().toISOString();
  await sbMutate('school_base_schedule','DELETE',`shift=eq.${shift}`);
  const rows=(parsed.entries||[]).map(x=>({
    shift,day_index:Number(x.dayIndex)||0,lesson:Number(x.lesson)||0,class_name:String(x.className||''),subject:String(x.subject||''),
    teacher:String(x.teacher||''),room:String(x.room||''),uploaded_at:now,uploaded_by:Number(state.currentUser.id)
  }));
  if(rows.length)await sbMutate('school_base_schedule','POST','',rows);
}

function ensureXlsxLoaded(){
  if(!window.XLSX) throw new Error("Библиотека Excel XLSX не загружена. Обновите страницу и повторите попытку.");
  return window.XLSX;
}
function teacherLikeUsers(){
  return (state.users||[]).filter(u=>!u.roleKeys?.includes('guest') && (
    u.roleKeys?.includes('teacher') || u.roleKeys?.includes('deputy') || u.roleKeys?.includes('director')
  ));
}
function flexibleUserByName(name, candidates=state.users||[]){
  const n=normalizePersonName(name);
  if(!n)return null;
  return candidates.find(u=>normalizePersonName(u.name)===n)
    || candidates.find(u=>normalizePersonName(u.name).includes(n))
    || candidates.find(u=>n.includes(normalizePersonName(u.name)));
}
function canViewAckReport(){
  const r=state.currentUser?.roleKeys||[];
  return r.includes('admin')||r.includes('director')||r.includes('deputy')||r.includes('secretary');
}
function applySecretarySetting(){
  try{
    const ids=Array.isArray(state.__secretaryEmployeeIds)
      ? state.__secretaryEmployeeIds.map(Number).filter(Number.isFinite)
      : (state.__secretaryEmployeeId!=null ? [Number(state.__secretaryEmployeeId)] : []);
    (state.users||[]).forEach(u=>{
      u.roleKeys=(u.roleKeys||[]).filter(r=>r!=="secretary");
      u.roles=rolesText(u.roleKeys);
    });
    ids.forEach(id=>{
      const u=(state.users||[]).find(x=>Number(x.id)===Number(id));
      if(u){
        u.roleKeys=[...(u.roleKeys||[]),'secretary'];
        u.roles=rolesText(u.roleKeys);
      }
    });
    if(state.currentUser){
      state.currentUser.roleKeys=(state.currentUser.roleKeys||[]).filter(r=>r!=="secretary");
      if(ids.includes(Number(state.currentUser.id)))state.currentUser.roleKeys.push('secretary');
      state.currentUser.roles=rolesText(state.currentUser.roleKeys);
    }
  }catch(e){console.warn('secretary role sync',e);}
}

const __loadAppSettingsBase = loadAppSettingsFromSupabase;
loadAppSettingsFromSupabase = async function(){
  await __loadAppSettingsBase();
  try{
    const rows=await sbRest('app_settings','select=key,value&key=in.(secretaryEmployeeIds,secretaryEmployeeId)');
    const by={};(rows||[]).forEach(r=>by[String(r.key)]=r.value);
    let ids=by.secretaryEmployeeIds;
    if(typeof ids==="string"){
      try{ids=JSON.parse(ids);}catch(_e){ids=null;}
    }
    if(!Array.isArray(ids)){
      const old=by.secretaryEmployeeId;
      ids=old!=null && old!=="" ? [Number(old)].filter(Number.isFinite) : [];
    }
    state.__secretaryEmployeeIds=ids.map(Number).filter(Number.isFinite).slice(0,5);
    state.__secretaryEmployeeId=state.__secretaryEmployeeIds[0]??null;
    applySecretarySetting();
  }catch(e){console.warn('secretary setting',e);}
  return true;
};

// Replace MVP-only password change with real Supabase Auth update.
window.changePassword=async function(){
  const p=prompt('Введите новый пароль (не менее 6 символов):');
  if(p===null)return;
  if(p.length<6)return alert('Пароль должен содержать не менее 6 символов.');
  const p2=prompt('Повторите новый пароль:');
  if(p2===null)return;
  if(p!==p2)return alert('Пароли не совпадают.');
  try{
    const {error}=await supabase.auth.updateUser({password:p});
    if(error)throw error;
    alert('Пароль успешно изменён в учётной записи. При следующем входе используйте новый пароль.');
  }catch(e){alert('Не удалось изменить пароль: '+(e.message||e));}
};

// Notifications: save/read on server, not only in localStorage.
async function saveServerNotification(payload){
  const rows=await sbMutate('school_notifications','POST','',payload);
  return Array.isArray(rows)?rows[0]:rows;
}

window.sendText=function(){
  if(!isManager())return;
  const users=teacherLikeUsers();
  const html=`<div class="notify-modal-backdrop"><div class="notify-modal"><h3>Сообщение учителю</h3><div class="notify-form"><div class="notify-row"><label>ФИО учителя</label><input id="notifyTeacherName" list="notifyTeacherList" placeholder="Начните вводить ФИО"><datalist id="notifyTeacherList">${users.map(u=>`<option value="${escapeHtml(u.name)}"></option>`).join('')}</datalist></div><div class="notify-row"><label>Сообщение</label><textarea id="notifyMessage" rows="5" placeholder="Введите сообщение"></textarea></div></div><div class="notify-modal-actions"><button class="btn" onclick="closeNotifyModal()">Отмена</button><button class="btn green" onclick="submitTextNotification()">Отправить</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend',html);
};
window.submitTextNotification=async function(){
  const name=document.getElementById('notifyTeacherName')?.value.trim(),msg=document.getElementById('notifyMessage')?.value.trim();
  const u=flexibleUserByName(name,teacherLikeUsers());
  if(!u)return alert('Выберите учителя из списка или введите точное ФИО.');
  if(!msg)return alert('Введите сообщение.');
  try{
    const row=await saveServerNotification({notification_type:'text',title:'Новое сообщение',body:msg,recipient_employee_id:Number(u.id),sender_employee_id:Number(state.currentUser.id),sender_name:state.currentUser.name,visit_data:{}});
    state.notifications.unshift({id:Number(row?.id||Date.now()),type:'text',title:'Новое сообщение',text:msg,date:'Сегодня',read:false,teacher:u.login,teacherId:Number(u.id),senderName:state.currentUser.name});
    save();closeNotifyModal();alert('Уведомление отправлено.');render();
  }catch(e){alert('Не удалось отправить уведомление: '+(e.message||e));}
};
window.sendVisit=function(){
  if(!isManager())return;
  const teachers=teacherLikeUsers(),deputies=state.users.filter(u=>u.roleKeys?.includes('deputy')||u.roleKeys?.includes('director'));
  const classes=[...new Set((state.schedule?.entries||[]).map(x=>x.className).concat(state.classRoster?.map(x=>x.name)||[]).filter(Boolean))].sort(classSort);
  const subjects=[...new Set((state.schedule?.entries||[]).map(x=>x.subject).filter(Boolean))].sort();
  const html=`<div class="notify-modal-backdrop"><div class="notify-modal"><h3>Уведомление о посещении урока</h3><div class="notify-form"><div class="notify-row"><label>1. Учитель</label><input id="visitTeacherName" list="visitTeacherList" placeholder="Начните вводить ФИО"><datalist id="visitTeacherList">${teachers.map(u=>`<option value="${escapeHtml(u.name)}"></option>`).join('')}</datalist></div><div class="notify-row"><label>2. Заместитель / директор</label><input id="visitDeputyName" list="visitDeputyList" placeholder="Начните вводить ФИО"><datalist id="visitDeputyList">${deputies.map(u=>`<option value="${escapeHtml(u.name)}"></option>`).join('')}</datalist></div><div class="notify-row"><label>3. Класс</label><input id="visitClass" list="visitClassList" placeholder="Например, 7Б"><datalist id="visitClassList">${classes.map(c=>`<option value="${escapeHtml(c)}"></option>`).join('')}</datalist></div><div class="notify-row"><label>4. Предмет</label><input id="visitSubject" list="visitSubjectList" placeholder="Предмет"><datalist id="visitSubjectList">${subjects.map(x=>`<option value="${escapeHtml(x)}"></option>`).join('')}</datalist></div><div class="notify-row"><label>5. Цель посещения</label><textarea id="visitPurpose" rows="3" placeholder="Цель посещения урока"></textarea></div></div><div class="notify-modal-actions"><button class="btn" onclick="closeNotifyModal()">Отмена</button><button class="btn green" onclick="submitVisitNotification()">Отправить</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend',html);
};
window.submitVisitNotification=async function(){
  const tn=document.getElementById('visitTeacherName')?.value.trim(),dn=document.getElementById('visitDeputyName')?.value.trim(),cls=document.getElementById('visitClass')?.value.trim(),subject=document.getElementById('visitSubject')?.value.trim(),purpose=document.getElementById('visitPurpose')?.value.trim();
  const teacher=flexibleUserByName(tn,teacherLikeUsers());
  const deputy=flexibleUserByName(dn,state.users.filter(u=>u.roleKeys?.includes('deputy')||u.roleKeys?.includes('director')));
  if(!teacher||!deputy||!cls||!subject||!purpose)return alert('Заполните все 5 строк и укажите ФИО учителя и заместителя/директора из списков.');
  try{
    const visit={teacher:teacher.name,deputy:deputy.name,cls,subject,purpose};
    const row=await saveServerNotification({notification_type:'visit',title:'Уведомление о посещении урока',body:`Класс: ${cls}. Предмет: ${subject}. Цель: ${purpose}. Посетитель: ${deputy.name}.`,recipient_employee_id:Number(teacher.id),sender_employee_id:Number(state.currentUser.id),sender_name:state.currentUser.name,visit_data:visit});
    state.notifications.unshift({id:Number(row?.id||Date.now()),type:'visit',title:'Уведомление о посещении урока',text:`Класс: ${cls}. Предмет: ${subject}. Цель: ${purpose}. Посетитель: ${deputy.name}.`,date:'Сегодня',read:false,teacher:teacher.login,teacherId:Number(teacher.id),senderEmployeeId:Number(state.currentUser.id),visit});
    save();closeNotifyModal();alert('Уведомление отправлено.');render();
  }catch(e){alert('Не удалось отправить уведомление: '+(e.message||e));}
};
window.readNotification=async function(id){
  const n=state.notifications.find(x=>Number(x.id)===Number(id));
  if(!n||n.read)return;
  try{await sbMutate('school_notifications','PATCH',`id=eq.${encodeURIComponent(n.id)}`,{read_at:new Date().toISOString()});}catch(e){console.warn(e);}
  n.read=true;n.readAt=new Date().toISOString();save();render();
};
window.markNotificationsRead=async function(){
  const unread=state.notifications.filter(n=>!n.read);
  await Promise.all(unread.map(async n=>{try{await sbMutate('school_notifications','PATCH',`id=eq.${encodeURIComponent(n.id)}`,{read_at:new Date().toISOString()});}catch(e){}}));
  state.notifications.forEach(n=>n.read=true);save();render();
};

// Electronic journal control.
window.handleJournalFile=function(event){
  const f=event?.target?.files?.[0];
  window.__journalFile=f||null;
  const el=document.getElementById('journalUploadInfo');
  if(el)el.innerHTML=f?`Выбран файл: <b>${escapeHtml(f.name)}</b>. Нажмите «Загрузить и обработать».`:'Файл не выбран.';
};
window.processJournalUpload=async function(){
  if(!isManager())return alert('Загрузка отчёта электронного журнала доступна директору и заместителям.');
  const f=window.__journalFile||document.getElementById('journalFile')?.files?.[0];
  if(!f)return alert('Сначала выберите Excel-файл.');
  const reportDate=document.getElementById('journalReportDate')?.value||(()=>{const d=new Date();d.setDate(d.getDate()-1);return dateIsoLocal(d);})();
  try{
    const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});
    const employees=teacherLikeUsers().map(u=>({u,surname:String(u.name||'').trim().split(/\s+/)[0]})).filter(x=>x.surname);
    const textCells=[];
    for(const sn of wb.SheetNames){
      const ws=wb.Sheets[sn];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      rows.forEach(row=>textCells.push(row.map(v=>String(v??'')).join(' ')));
    }
    const result=[];
    for(const item of employees){
      const pattern=new RegExp(`(^|[^А-Яа-яЁёA-Za-z])${item.surname.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?=$|[^А-Яа-яЁёA-Za-z])`,'gi');
      let count=0;
      for(const line of textCells){const m=line.match(pattern);if(m)count+=m.length;}
      if(count>0)result.push({employee_id:Number(item.u.id),employee_login:item.u.login||'',employee_name:item.u.name,report_date:reportDate,overdue_count:count});
    }
    await sbMutate('journal_overdue','DELETE',`report_date=eq.${encodeURIComponent(reportDate)}`);
    if(result.length)await sbMutate('journal_overdue','POST','',result);
    state.journalOverdue=(state.journalOverdue||[]).filter(x=>x.date!==reportDate).concat(result.map(x=>({id:Date.now()+Math.random(),employeeId:x.employee_id,login:x.employee_login,name:x.employee_name,date:x.report_date,count:x.overdue_count})));
    save();
    const info=document.getElementById('journalUploadInfo');
    if(info)info.innerHTML=`Обработано: <b>${escapeHtml(f.name)}</b>. Дата отчёта: <b>${reportDate}</b>. Педагогов с просрочками: <b>${result.length}</b>.`;
    alert(`Отчёт электронного журнала обработан. Выявлено педагогов с просрочками: ${result.length}.`);
    showJournalAnalytics();
  }catch(e){console.error(e);alert('Не удалось обработать отчёт электронного журнала: '+(e.message||e));}
};

const __renderAnalyticsBase = renderAnalytics;
renderAnalytics=function(){
  __renderAnalyticsBase();
  const card=[...document.querySelectorAll('#content .card')].find(c=>c.querySelector('h3')?.textContent.includes('Контроль электронного журнала'));
  if(card && !document.getElementById('journalReportDate')){
    const bar=card.querySelector('.toolbar');
    if(bar)bar.insertAdjacentHTML('beforebegin',`<div class="journal-report-date"><label>Дата отчёта <input id="journalReportDate" type="date" value="${(()=>{const d=new Date();d.setDate(d.getDate()-1);return dateIsoLocal(d);})()}"></label></div>`);
  }
};

// Schedule uploads now write to Supabase and become visible to all authenticated users.
window.uploadSchedule=async function(){
  if(!isDispatcher())return alert('Загрузка расписания доступна только диспетчеру и администратору.');
  const f=document.getElementById('scheduleFile')?.files?.[0], selectedShift=document.getElementById('scheduleShift')?.value;
  if(!f)return alert('Выберите Excel-файл расписания.');
  if(!selectedShift)return alert('Укажите, это 1-я или 2-я смена.');
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'array'}),parsed=parseScheduleWorkbook(wb,f.name,selectedShift);
      const manualDate=document.getElementById("scheduleDate")?.value||"";
      if(manualDate)parsed.date=manualDate;
      await saveScheduleRows(parsed);
      state.schedule.entries=(state.schedule.entries||[]).filter(x=>!(x.date===parsed.date&&Number(x.shift)===Number(parsed.shift))).concat(parsed.entries);
      state.schedule.versions=(state.schedule.versions||[]).filter(v=>!(v.date===parsed.date&&Number(v.shift)===Number(parsed.shift)));
      state.schedule.versions.push({id:Date.now(),date:parsed.date,shift:Number(parsed.shift),fileName:f.name,uploadedAt:new Date().toISOString(),count:parsed.entries.length,readBy:{[state.currentUser.login]:{at:new Date().toISOString()}}});
      state.schedule.uploadedFile=f.name;save();
      const info=document.getElementById('scheduleImportInfo');if(info)info.innerHTML=`Распознано: <b>${parsed.date}</b>, <b>${parsed.shift}-я смена</b>, классов: <b>${parsed.classes.length}</b>, записей уроков: <b>${parsed.entries.length}</b>.`;
      alert(`Расписание загружено: ${parsed.date}, ${parsed.shift}-я смена, ${parsed.entries.length} записей.`);render();
    }catch(err){console.error(err);alert('Не удалось сохранить расписание: '+(err.message||'проверьте формат Excel и права доступа.'));}
  };
  reader.readAsArrayBuffer(f);
};
window.uploadBaseSchedule=async function(){
  if(!isDispatcher())return alert('Загрузка базового расписания доступна только диспетчеру и администратору.');
  const f=document.getElementById('baseScheduleFile')?.files?.[0], selectedShift=document.getElementById('baseScheduleShift')?.value;
  if(!f)return alert('Выберите Excel-файл базового расписания.');
  if(!selectedShift)return alert('Укажите, это 1-я или 2-я смена.');
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'array'}),parsed=parseBaseScheduleWorkbook(wb,f.name,selectedShift);
      await saveBaseScheduleRows(parsed);
      state.schedule.baseEntries=(state.schedule.baseEntries||[]).filter(x=>Number(x.shift)!==Number(parsed.shift)).concat(parsed.entries);
      state.schedule.baseVersions=(state.schedule.baseVersions||[]).filter(v=>Number(v.shift)!==Number(parsed.shift));
      state.schedule.baseVersions.push({id:Date.now(),shift:Number(parsed.shift),fileName:f.name,uploadedAt:new Date().toISOString(),count:parsed.entries.length});
      state.schedule.baseUploadedFile=f.name;save();
      const info=document.getElementById('baseScheduleImportInfo');if(info)info.innerHTML=`Распознано: <b>${parsed.shift}-я смена</b>, классов: <b>${parsed.classes.length}</b>, записей: <b>${parsed.entries.length}</b>.`;
      alert(`Базовое расписание ${parsed.shift}-й смены загружено.`);render();
    }catch(err){console.error(err);alert('Не удалось сохранить базовое расписание: '+(err.message||'проверьте формат Excel и права доступа.'));}
  };
  reader.readAsArrayBuffer(f);
};

// Teachers may inspect any class in the base schedule; "Мое расписание" stays teacher-specific.
renderScheduleSelector = function(day){
  const dt=day==='tomorrow'?nextSchoolDay():new Date(), iso=dateIsoLocal(dt);
  const classes=[...new Set((state.classRoster||[]).map(x=>x.name).filter(Boolean))].sort(classSort);
  const options=classes.map(c=>`<option value="class:${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  return `<div class="schedule-choice"><select id="scheduleChoice_${day}" onchange="showScheduleChoice('${day}')"><option value="">Выберите вариант</option><option value="mine">Мое расписание</option>${options}</select></div><div id="scheduleResult_${day}"><div class="schedule-empty">Выберите «Мое расписание» или класс.</div></div>`;
};
renderScheduleHomeSelector = function(day='today'){
  const classes=[...new Set((state.classRoster||[]).map(x=>x.name).filter(Boolean))].sort(classSort);
  const id=`homeScheduleChoice_${day}`,resultId=`homeScheduleResult_${day}`;
  return `<div class="schedule-choice"><select id="${id}" onchange="showHomeScheduleChoice('${day}')"><option value="">Выберите вариант</option><option value="mine">Мое расписание</option>${classes.map(c=>`<option value="class:${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select></div><div class="muted">Выберите «Мое расписание» или класс.</div><div id="${resultId}" style="margin-top:12px"><div class="schedule-empty">Выберите вариант.</div></div>`;
};
renderBaseScheduleSelector = function(){
  const classes=[...new Set((state.classRoster||[]).map(x=>x.name).filter(Boolean))].sort(classSort);
  return `<div class="schedule-choice"><select id="baseScheduleChoice" onchange="showBaseScheduleChoice()"><option value="">Выберите класс</option>${classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select></div><div class="muted">Выберите класс, чтобы увидеть базовое расписание.</div><div id="baseScheduleResult" style="margin-top:12px"><div class="schedule-empty">Класс не выбран.</div></div>`;
};

// Persistent work plan.
function formatPlanDate(v){
  if(!v)return '';
  const d=new Date(v+'T12:00:00');
  return isNaN(d.getTime())?v:d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function canEditPlanItem(x){
  return isManager() || (Number(x.authorEmployeeId)===Number(state.currentUser?.id) && x.status==='На согласовании');
}
renderPlan=function(){
  const rows=(state.plan||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.time).localeCompare(String(b.time)));
  const can=isManager();
  shell('План работы','Общий план формируют заместители. Учителя могут предложить мероприятия своих классов.',`<div class="card"><div class="toolbar"><button class="btn green" onclick="addPlan()">＋ Добавить мероприятие</button>${can?'<span class="chip">Заместитель / директор: редактирование и публикация</span>':''}</div><div class="table-wrap"><table class="data-table"><tr><th>Дата</th><th>Время</th><th>Мероприятие</th><th>Место</th><th>Участники</th><th>Ответственный заместитель</th><th>Статус</th><th>Действия</th></tr>${rows.map(x=>`<tr><td>${escapeHtml(formatPlanDate(x.date))}</td><td>${escapeHtml(x.time||'')}</td><td>${escapeHtml(x.title)}</td><td>${escapeHtml(x.place)}</td><td>${escapeHtml(x.participants)}</td><td>${escapeHtml(x.responsible||'—')}</td><td><span class="chip">${escapeHtml(x.status)}</span></td><td>${canEditPlanItem(x)?`<div class="icon-actions">${can&&x.status==='На согласовании'?`<button class="small-btn" onclick="publishPlan(${x.id})">Опубликовать</button>`:''}<button class="small-btn" onclick="editPlan(${x.id})">Изменить</button><button class="small-btn danger" onclick="deletePlan(${x.id})">Удалить</button></div>`:'—'}</td></tr>`).join('')||'<tr><td colspan="8">План пока пуст.</td></tr>'}</table></div></div>`);
};
window.addPlan=async function(){
  const title=prompt('Мероприятие:','');if(!title?.trim())return;
  const dateInput=prompt('Дата (дд.мм.гггг или ГГГГ-ММ-ДД):',new Date().toISOString().slice(0,10));
  const eventDate=normalizePlanDate(dateInput);if(!eventDate)return alert('Не удалось распознать дату.');
  const time=prompt('Время:','12:00')||'';
  const place=prompt('Место:','')||'';
  const defaultParticipants=(state.currentUser.classes||[]).join(', ')||'Мой класс';
  const participants=prompt('Участники:',defaultParticipants)||'';
  if(!isManager() && state.currentUser.classes?.length && !state.currentUser.classes.some(c=>participants.toUpperCase().includes(String(c).toUpperCase()))){
    return alert('Для мероприятия учителя укажите хотя бы один класс из вашего классного руководства.');
  }
  let responsible='',responsibleEmployeeId=null;
  if(isManager()){
    const def=state.currentUser.name;
    const r=prompt('Ответственный заместитель / директор:',def);if(r===null)return;
    const rr=flexibleUserByName(r,state.users.filter(u=>u.roleKeys?.includes('deputy')||u.roleKeys?.includes('director')||u.roleKeys?.includes('admin')));
    responsible=rr?.name||r.trim();responsibleEmployeeId=rr?Number(rr.id):null;
  }
  const payload={event_date:eventDate,event_time:time.trim(),event_title:title.trim(),place:place.trim(),participants:participants.trim(),responsible_employee_id:responsibleEmployeeId,responsible_name:responsible,status:isManager()?'Опубликовано':'На согласовании',author_employee_id:Number(state.currentUser.id),author_name:state.currentUser.name,updated_at:new Date().toISOString()};
  try{
    const saved=await sbMutate('work_plan','POST','',payload),x=Array.isArray(saved)?saved[0]:saved;
    state.plan.push({id:Number(x.id),date:x.event_date,time:x.event_time,title:x.event_title,place:x.place,participants:x.participants,responsible:x.responsible_name,responsibleEmployeeId:x.responsible_employee_id,status:x.status,author:x.author_name,authorEmployeeId:Number(x.author_employee_id)});save();render();
  }catch(e){alert('Не удалось сохранить мероприятие: '+(e.message||e));}
};
function normalizePlanDate(v){
  const s=String(v||'').trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  const m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);if(!m)return '';
  return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
}
window.publishPlan=async function(id){
  if(!isManager())return;
  const x=state.plan.find(p=>Number(p.id)===Number(id));if(!x)return;
  let responsible=x.responsible||state.currentUser.name,responsibleEmployeeId=x.responsibleEmployeeId||Number(state.currentUser.id);
  if(!x.responsible){const r=prompt('Ответственный заместитель / директор:',state.currentUser.name);if(r===null)return;const rr=flexibleUserByName(r,state.users.filter(u=>u.roleKeys?.includes('deputy')||u.roleKeys?.includes('director')||u.roleKeys?.includes('admin')));responsible=rr?.name||r.trim();responsibleEmployeeId=rr?Number(rr.id):responsibleEmployeeId;}
  try{await sbMutate('work_plan','PATCH',`id=eq.${encodeURIComponent(id)}`,{status:'Опубликовано',responsible_name:responsible,responsible_employee_id:responsibleEmployeeId,updated_at:new Date().toISOString()});x.status='Опубликовано';x.responsible=responsible;x.responsibleEmployeeId=responsibleEmployeeId;save();render();}catch(e){alert('Не удалось опубликовать мероприятие: '+(e.message||e));}
};
window.editPlan=async function(id){
  const x=state.plan.find(p=>Number(p.id)===Number(id));if(!x||!canEditPlanItem(x))return;
  const title=prompt('Мероприятие:',x.title);if(title===null)return;
  const dateInput=prompt('Дата (дд.мм.гггг или ГГГГ-ММ-ДД):',x.date);const eventDate=normalizePlanDate(dateInput);if(!eventDate)return alert('Не удалось распознать дату.');
  const time=prompt('Время:',x.time);if(time===null)return;
  const place=prompt('Место:',x.place);if(place===null)return;
  const participants=prompt('Участники:',x.participants);if(participants===null)return;
  let responsible=x.responsible,responsibleEmployeeId=x.responsibleEmployeeId||null;
  if(isManager()){const r=prompt('Ответственный заместитель / директор:',responsible||state.currentUser.name);if(r===null)return;const rr=flexibleUserByName(r,state.users.filter(u=>u.roleKeys?.includes('deputy')||u.roleKeys?.includes('director')||u.roleKeys?.includes('admin')));responsible=rr?.name||r.trim();responsibleEmployeeId=rr?Number(rr.id):null;}
  const payload={event_date:eventDate,event_time:time,event_title:title,place,participants,responsible_name:responsible,responsible_employee_id:responsibleEmployeeId,updated_at:new Date().toISOString()};
  try{await sbMutate('work_plan','PATCH',`id=eq.${encodeURIComponent(id)}`,payload);Object.assign(x,{date:eventDate,time,title,place,participants,responsible,responsibleEmployeeId});save();render();}catch(e){alert('Не удалось изменить мероприятие: '+(e.message||e));}
};
window.deletePlan=async function(id){
  const x=state.plan.find(p=>Number(p.id)===Number(id));if(!x||!canEditPlanItem(x))return;
  if(!confirm('Удалить мероприятие?'))return;
  try{await sbMutate('work_plan','DELETE',`id=eq.${encodeURIComponent(id)}`);state.plan=state.plan.filter(p=>Number(p.id)!==Number(id));save();render();}catch(e){alert('Не удалось удалить мероприятие: '+(e.message||e));}
};

// Home: notifications + journal warning + nearest published plan.
const __renderHomeBase=renderHome;
renderHome=function(){
  __renderHomeBase();
  const topRow=document.querySelector('#content .home-top-row');
  const noticeCard=topRow?.children?.[1];
  if(noticeCard){
    const own=(state.journalOverdue||[]).filter(x=>Number(x.employeeId)===Number(state.currentUser.id)||x.login===state.currentUser.login);
    const total=own.reduce((s,x)=>s+Number(x.count||0),0);
    const journalHtml=`<div class="home-inline-alert ${total?'has-alert':''}"><div class="home-inline-alert-title">📘 Контроль электронного журнала</div>${total?`<div class="home-inline-alert-text">⚠ Не заполнено страниц: <b>${total}</b>.</div><div class="home-inline-alert-dates">${own.slice(0,5).map(x=>`${escapeHtml(formatRuDate(new Date(x.date+'T12:00:00')))} — ${x.count} стр.`).join('<br>')}</div>`:`<div class="home-inline-alert-text success">✓ Просроченных страниц не обнаружено.</div>`}<button class="small-btn" onclick="navigate('analytics')">Открыть контроль журнала →</button></div>`;
    noticeCard.insertAdjacentHTML('beforeend',journalHtml);
  }
  const published=(state.plan||[]).filter(x=>!isGuest() && x.status==='Опубликовано').sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.time).localeCompare(String(b.time))).slice(0,5);
  const homeMain=document.querySelector('#content .home-main');
  if(homeMain){
    const html=`<section class="card home-plan"><div class="home-plan-head"><div><h3>📅 Ближайшее в плане работы</h3><div class="muted">Опубликованные мероприятия школы</div></div><button class="btn" onclick="navigate('plan')">Весь план →</button></div>${published.length?published.map(x=>`<div class="plan-near-item"><div class="plan-near-date">${escapeHtml(formatPlanDate(x.date))}<br><span>${escapeHtml(x.time||'')}</span></div><div><b>${escapeHtml(x.title)}</b><div class="muted">${escapeHtml(x.place||'')}${x.participants?' · '+escapeHtml(x.participants):''}${x.responsible?' · Ответственный: '+escapeHtml(x.responsible):''}</div></div></div>`).join(''):'<div class="empty">Опубликованных мероприятий пока нет.</div>'}</section>`;
    homeMain.insertAdjacentHTML('beforeend',html);
  }
};

// Make "Кто ознакомился" visible to every role that is allowed to inspect orders.
window.whoRead=async function(id){
  const d=state.documents.find(x=>Number(x.id)===Number(id));
  if(!d||!canViewAckReport()||!d.sectionKey.split('::')[1]?.includes('Приказы'))return;
  const targetIds=(d.targetEmployeeIds||[]).map(Number).filter(Number.isFinite);
  let recipients;
  if(targetIds.length)recipients=state.users.filter(u=>targetIds.includes(Number(u.id))&&!u.roleKeys?.includes('guest'));
  else recipients=state.users.filter(u=>{
    if(u.roleKeys?.includes('guest'))return false;
    if(d.targetAll||d.targetType==='all')return true;
    if(d.targetClassLeaderAll||d.targetType==='classleaders')if((u.classes||[]).length)return true;
    const ps=(d.targetClassLeaderParallels||[]).map(String);
    if(ps.length&&(u.classes||[]).some(c=>ps.includes(String(c).match(/^\d+/)?.[0])))return true;
    return (d.targetUsers||[]).includes(u.login);
  });
  const rows=recipients.map(u=>{const seen=d.readBy?.[u.login];return [d.title||d.fileName,u.name,seen?(typeof seen==='object'?new Date(seen.at).toLocaleString('ru-RU'):''):'Не ознакомлен'];});
  const lines=rows.map(r=>`<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(r[1])}</td><td>${escapeHtml(r[2])}</td></tr>`).join('');
  const w=window.open('','_blank','width=900,height=600');
  if(w){w.document.write(`<title>Кто ознакомился</title><body style="font-family:Arial;padding:20px"><h2>Кто ознакомился</h2><table border="1" cellpadding="8" style="border-collapse:collapse"><tr><th>Документ</th><th>ФИО</th><th>Дата и время</th></tr>${lines}</table></body>`);w.document.close();}
};

// Correct manager flag used by document cards.
const __renderDocSectionTextFix = true;

// Live reload for shared server data; also catches changes made by the administrator in another account.
if(!window.__schoolRuntimeTimer){
  window.__schoolRuntimeTimer=setInterval(async()=>{
    if(!state.currentUser||document.visibilityState!=='visible')return;
    try{await refreshRuntimeData();if(['home','schedule','notifications','plan','analytics'].includes(state.currentPage))render();}catch(e){console.warn(e);}
  },60000);
}

// Refresh server-backed state whenever the user navigates.
window.navigate=async function(page){
  closeMobileMenu();
  if(isGuest()&&!guestPageAllowed(page))return;
  state.currentPage=page;save();document.getElementById('profileMenu').classList.add('hidden');
  try{await refreshRuntimeData();}catch(e){}
  render();window.scrollTo({top:0,behavior:'smooth'});
};


/* ===== FINAL FIXES 2026-09 ===== */

/* ---------- Shared settings: always persist to Supabase before reporting success ---------- */
window.saveResponsibles = async function(){
  if(!isAdmin()) return;
  const keys=["transport","vseobuch","education","journal","upbringing","ovz","olymp","gia","attestation","career","psych","security","reports","archive"];
  const next={...(state.responsibles||{})};
  keys.forEach(k=>{ next[k]=document.getElementById(`resp_${k}`)?.value.trim()||""; });
  if(!(await saveAppSetting("responsibles",next))) return alert("Не удалось сохранить ответственных в базе данных.");
  state.responsibles=next;
  save();
  alert("Ответственные за направления сохранены.");
  render();
};

window.saveDuty = async function(){
  if(!(isAdmin()||state.currentUser?.roleKeys?.includes("deputy"))) return;
  const next=(state.dutySchedule||[]).map((x,i)=>({
    ...x,
    name1:document.getElementById(`duty_name1_${i}`)?.value.trim()||"",
    phone1:document.getElementById(`duty_phone1_${i}`)?.value.trim()||"",
    name2:document.getElementById(`duty_name2_${i}`)?.value.trim()||"",
    phone2:document.getElementById(`duty_phone2_${i}`)?.value.trim()||""
  }));
  if(!(await saveAppSetting("dutySchedule",next))) return alert("Не удалось сохранить график дежурства в базе данных.");
  state.dutySchedule=next;
  save();
  alert("График дежурства сохранён.");
  render();
};

/* ---------- Notifications: real teacher dropdown ---------- */
function teacherLikeUsers(){
  const all=(state.users||[]).filter(u=>!u.roleKeys?.includes("guest"));
  const excluded=["admin","director","deputy","secretary","dispatcher"];
  let teachers=all.filter(u=>(u.roleKeys||[]).includes("teacher"));
  if(!teachers.length) teachers=all.filter(u=>!(u.roleKeys||[]).some(r=>excluded.includes(r)));
  return teachers.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"ru"));
}

function teacherSelectHtml(id,users,placeholder="Выберите учителя"){
  return `<select id="${id}" style="width:100%"><option value="">${escapeHtml(placeholder)}</option>${users.map(u=>`<option value="${Number(u.id)}">${escapeHtml(u.name)}</option>`).join("")}</select>`;
}

window.sendText = function(){
  if(!isManager()) return;
  const users=teacherLikeUsers();
  if(!users.length) return alert("Список учителей пока не загружен.");
  const html=`<div class="notify-modal-backdrop"><div class="notify-modal">
    <h3>Сообщение учителю</h3>
    <div class="notify-form">
      <div class="notify-row"><label>Учитель</label>${teacherSelectHtml("notifyTeacherId",users)}</div>
      <div class="notify-row"><label>Сообщение</label><textarea id="notifyMessage" rows="5" placeholder="Введите сообщение"></textarea></div>
    </div>
    <div class="notify-modal-actions"><button class="btn" onclick="closeNotifyModal()">Отмена</button><button class="btn green" onclick="submitTextNotification()">Отправить</button></div>
  </div></div>`;
  document.body.insertAdjacentHTML("beforeend",html);
};

window.submitTextNotification = async function(){
  const id=Number(document.getElementById("notifyTeacherId")?.value||0);
  const msg=document.getElementById("notifyMessage")?.value.trim();
  const u=teacherLikeUsers().find(x=>Number(x.id)===id);
  if(!u)return alert("Выберите учителя из списка.");
  if(!msg)return alert("Введите сообщение.");
  try{
    const row=await saveServerNotification({
      notification_type:"text",title:"Новое сообщение",body:msg,
      recipient_employee_id:Number(u.id),sender_employee_id:Number(state.currentUser.id),
      sender_name:state.currentUser.name,visit_data:{}
    });
    state.notifications.unshift({
      id:Number(row?.id||Date.now()),type:"text",title:"Новое сообщение",text:msg,date:"Сегодня",
      read:false,teacher:u.login,teacherId:Number(u.id),senderName:state.currentUser.name
    });
    save();closeNotifyModal();alert("Уведомление отправлено.");render();
  }catch(e){alert("Не удалось отправить уведомление: "+(e.message||e));}
};

window.sendVisit = function(){
  if(!isManager()) return;
  const teachers=teacherLikeUsers();
  const deputies=state.users.filter(u=>(u.roleKeys||[]).some(r=>["deputy","director"].includes(r)))
    .sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"ru"));
  const classes=[...new Set((state.schedule?.entries||[]).map(x=>x.className).concat(state.classRoster?.map(x=>x.name)||[]).filter(Boolean))].sort(classSort);
  const subjects=[...new Set((state.schedule?.entries||[]).map(x=>x.subject).filter(Boolean))].sort();
  const html=`<div class="notify-modal-backdrop"><div class="notify-modal"><h3>Уведомление о посещении урока</h3>
    <div class="notify-form">
      <div class="notify-row"><label>1. Учитель</label>${teacherSelectHtml("visitTeacherId",teachers)}</div>
      <div class="notify-row"><label>2. Заместитель / директор</label><select id="visitDeputyName" style="width:100%"><option value="">Выберите</option>${deputies.map(u=>`<option value="${escapeHtml(u.name)}">${escapeHtml(u.name)}</option>`).join("")}</select></div>
      <div class="notify-row"><label>3. Класс</label><select id="visitClass" style="width:100%"><option value="">Выберите класс</option>${classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}</select></div>
      <div class="notify-row"><label>4. Предмет</label><select id="visitSubject" style="width:100%"><option value="">Выберите предмет</option>${subjects.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("")}</select></div>
      <div class="notify-row"><label>5. Цель посещения</label><textarea id="visitPurpose" rows="3" placeholder="Цель посещения урока"></textarea></div>
    </div>
    <div class="notify-modal-actions"><button class="btn" onclick="closeNotifyModal()">Отмена</button><button class="btn green" onclick="submitVisitNotification()">Отправить</button></div>
  </div></div>`;
  document.body.insertAdjacentHTML("beforeend",html);
};

window.submitVisitNotification = async function(){
  const teacherId=Number(document.getElementById("visitTeacherId")?.value||0);
  const dn=document.getElementById("visitDeputyName")?.value.trim();
  const cls=document.getElementById("visitClass")?.value.trim();
  const subject=document.getElementById("visitSubject")?.value.trim();
  const purpose=document.getElementById("visitPurpose")?.value.trim();
  const teacher=teacherLikeUsers().find(u=>Number(u.id)===teacherId);
  const deputy=flexibleUserByName(dn,state.users.filter(u=>(u.roleKeys||[]).some(r=>["deputy","director"].includes(r))));
  if(!teacher||!deputy||!cls||!subject||!purpose)return alert("Заполните все 5 строк.");
  try{
    const visit={teacher:teacher.name,deputy:deputy.name,cls,subject,purpose};
    const row=await saveServerNotification({
      notification_type:"visit",title:"Уведомление о посещении урока",
      body:`Класс: ${cls}. Предмет: ${subject}. Цель: ${purpose}. Посетитель: ${deputy.name}.`,
      recipient_employee_id:Number(teacher.id),sender_employee_id:Number(state.currentUser.id),
      sender_name:state.currentUser.name,visit_data:visit
    });
    state.notifications.unshift({
      id:Number(row?.id||Date.now()),type:"visit",title:"Уведомление о посещении урока",
      text:`Класс: ${cls}. Предмет: ${subject}. Цель: ${purpose}. Посетитель: ${deputy.name}.`,
      date:"Сегодня",read:false,teacher:teacher.login,teacherId:Number(teacher.id),visit
    });
    save();closeNotifyModal();alert("Уведомление отправлено.");render();
  }catch(e){alert("Не удалось отправить уведомление: "+(e.message||e));}
};

/* ---------- Documents / orders: recipients, acknowledgement and "Кто ознакомился" ---------- */
function canViewDocAck(d){
  return !!d && (canViewAckReport() || d.uploadedBy===state.currentUser?.login);
}

function userCanSeeDoc(doc){
  if(!doc||!state.currentUser)return false;
  const u=state.currentUser;
  if(canViewDocAck(doc)) return true;
  if(doc.targetAll || doc.targetType==="all") return true;
  if((doc.targetEmployeeIds||[]).map(Number).includes(Number(u.id))) return true;
  const isClassLeader=(u.classes||[]).length>0;
  if(doc.targetClassLeaderAll || doc.targetType==="classleaders") if(isClassLeader) return true;
  const parallels=(doc.targetClassLeaderParallels||[]).map(String);
  if(parallels.length && isClassLeader && (u.classes||[]).some(c=>parallels.includes(String(c).match(/^\d+/)?.[0]))) return true;
  if((doc.targetUsers||[]).includes(u.login)) return true;
  return false;
}

window.renderDocSection = function(page,title){
  const docs=sectionDocs(page,title),canUpload=docUploadAllowed(page,title),manager=canViewAckReport();
  shell(title,"Документы раздела. У каждого документа можно задать адресатов.",
    `${canUpload?`<div class="doc-upload">
      <div class="doc-upload-grid"><div><label>Документ</label><input id="docFile" type="file"></div><div><label>Название документа</label><input id="docTitle" placeholder="Например: Приказ №..."></div></div>
      <div style="margin-top:12px"><label>Для кого предназначен документ</label>
        <div class="target-grid target-grid-four">
          <label class="target-choice"><input type="checkbox" id="targetAll" checked onchange="toggleDocTarget()"> Все</label>
          <label class="target-choice"><input type="checkbox" id="targetClassLeaderAll" onchange="toggleDocTarget()"> Все классные руководители</label>
          <label class="target-choice"><input type="checkbox" id="targetClassLeaderParallel" onchange="toggleDocTarget()"> Классные руководители по параллелям</label>
          <label class="target-choice"><input type="checkbox" id="targetSpecific" onchange="toggleDocTarget()"> Конкретные пользователи</label>
        </div>
        <div id="parallelBox" class="checkbox-list hidden" style="margin-top:8px">${[...new Set(state.users.flatMap(u=>(u.classes||[]).map(c=>String(c).match(/^\d+/)?.[0]).filter(Boolean)))].sort((a,b)=>+a-+b).map(p=>`<label><input type="checkbox" value="${p}"> ${p} классы</label>`).join("")}</div>
        <div id="specificUsersBox" class="checkbox-list hidden" style="margin-top:8px">${state.users.filter(u=>!u.roleKeys.includes("guest")).map(u=>`<label><input type="checkbox" value="${escapeHtml(u.login)}"> ${escapeHtml(u.name)}</label>`).join("")}</div>
      </div>
      <button class="btn green" style="margin-top:12px" onclick="uploadDocument('${escapeHtml(page)}','${escapeHtml(title)}')">＋ Загрузить документ</button>
    </div>`:""}
    ${docs.length?`<div class="doc-list">${docs.map(d=>renderDocItem(d,manager)).join("")}</div>`:'<div class="empty">Документов пока нет.</div>'}`);
};

function renderDocItem(d,manager){
  const seen=d.readBy?.[state.currentUser.login];
  const visible=userCanSeeDoc(d);
  const unread=visible&&!seen;
  const ackAt=typeof seen==="object"?seen.at:null;
  const canReport=canViewDocAck(d);
  const isOrder=d.sectionKey.split("::")[1]?.includes("Приказы");
  return `<div class="doc-item ${unread?'unread':''}">
    <div class="doc-item-title">📄 ${escapeHtml(d.title||d.fileName)} ${unread?'<span class="unread-marker">• новое</span>':''}</div>
    <div class="doc-meta">Загружен: ${escapeHtml(d.uploadedByName||"")} · ${new Date(d.uploadedAt).toLocaleString('ru-RU')}</div>
    <div class="doc-targets">Предназначен: ${escapeHtml(docTargetLabel(d))}</div>
    ${ackAt?`<div class="ack-info">✓ Ознакомлен: ${new Date(ackAt).toLocaleString('ru-RU')}</div>`:""}
    <div class="doc-actions">
      ${(d.url||d.data)?`<a class="btn" href="${escapeHtml(d.url||d.data)}" target="_blank" rel="noopener">Открыть</a>`:""}
      ${visible&&!seen?`<button class="btn green" onclick="ackDocument(${d.id})">✓ Ознакомился</button>`:""}
      ${canReport?`<button class="btn" onclick="whoRead(${d.id})">Кто ознакомился</button>`:""}
      ${canDeleteDocument(d)?`<button class="btn danger" onclick="deleteDocument(${d.id})">Удалить</button>`:""}
    </div>
  </div>`;
}
window.toggleDocTarget=function(){
  const parallel=document.getElementById("targetClassLeaderParallel")?.checked;
  const specific=document.getElementById("targetSpecific")?.checked;
  document.getElementById("parallelBox")?.classList.toggle("hidden",!parallel);
  document.getElementById("specificUsersBox")?.classList.toggle("hidden",!specific);
  if(parallel||specific){
    const all=document.getElementById("targetAll");
    if(all)all.checked=false;
  }
};
window.uploadDocument = async function(page,title){
  const f=document.getElementById("docFile")?.files[0];if(!f)return alert("Выберите документ.");
  const folderUrl=yandexFolderForPage(page);if(!folderUrl)return alert("Для этого раздела ещё не настроена папка Яндекс Диска.");
  const name=document.getElementById("docTitle")?.value.trim()||f.name;
  let targetType="all",targetUsers=[],targetAll=true,targetClassLeaderAll=false,targetClassLeaderParallels=[];
  if(title.includes("Приказы")){
    if(!canManageOrders())return alert("Приказы могут загружать только директор, заместитель директора, администратор и секретарь.");
    targetAll=!!document.getElementById("targetAll")?.checked;targetClassLeaderAll=!!document.getElementById("targetClassLeaderAll")?.checked;
    targetClassLeaderParallels=[...document.querySelectorAll("#parallelBox input:checked")].map(x=>x.value);targetUsers=[...document.querySelectorAll("#specificUsersBox input:checked")].map(x=>x.value);
    const any=targetAll||targetClassLeaderAll||targetClassLeaderParallels.length||targetUsers.length;if(!any)return alert("Выберите хотя бы одного адресата.");
    targetType=targetAll?"all":targetUsers.length?"specific":"classleaders";
  }
  try{
    const targetEmployeeIds=(state.users||[]).filter(u=>{if(targetAll)return !u.roleKeys?.includes("guest");if(targetUsers.includes(u.login))return true;if(targetClassLeaderAll&&u.classes?.length)return true;if(targetClassLeaderParallels.length&&(u.classes||[]).some(c=>targetClassLeaderParallels.includes(String(c).match(/^\d+/)?.[0])))return true;return false;}).map(u=>Number(u.id)).filter(Number.isFinite);
    const uploaded=await uploadToYandexFolder(f,folderUrl,page,title);
    const record={section_key:docKey(page,title),title:name,file_name:f.name,storage_url:uploaded.public_url||uploaded.url||"",storage_path:uploaded.path||"",uploaded_by:state.currentUser.login,uploaded_by_name:state.currentUser.name,target_type:targetType,target_users:targetUsers,target_all:targetAll,target_class_leader_all:targetClassLeaderAll,target_class_leader_parallels:targetClassLeaderParallels,target_employee_ids:targetEmployeeIds};
    const saved=await saveDocumentRecord(record),d=Array.isArray(saved)?saved[0]:saved;state.documents.unshift({id:Number(d?.id||Date.now()),sectionKey:record.section_key,title:name,fileName:f.name,data:"",url:record.storage_url,storagePath:record.storage_path,uploadedBy:record.uploaded_by,uploadedByName:record.uploaded_by_name,uploadedAt:new Date().toISOString(),targetType,targetUsers,targetAll,targetClassLeaderAll,targetClassLeaderParallels,targetEmployeeIds,readBy:{}});
    save();alert("Документ загружен и сохранён на Яндекс Диске.");renderDocSection(page,title);
  }catch(e){console.error(e);alert("Не удалось загрузить документ: "+(e.message||"проверьте настройку Яндекс Диска."));}
};
window.ackDocument=async function(id){
  const d=state.documents.find(x=>Number(x.id)===Number(id));if(!d||!userCanSeeDoc(d))return;
  try{const saved=await acknowledgeDocumentRecord(id);const at=new Date().toISOString();d.readBy=d.readBy||{};d.readBy[state.currentUser.login]={at};save();renderDocSection(state.currentPage,d.sectionKey.split("::")[1]);}catch(e){alert("Не удалось сохранить ознакомление: "+(e.message||"ошибка Supabase"));}
};
window.whoRead=async function(id){
  const d=state.documents.find(x=>Number(x.id)===Number(id));if(!d||!canViewDocAck(d))return;
  const targetIds=(d.targetEmployeeIds||[]).map(Number).filter(Number.isFinite);
  let recipients;
  if(targetIds.length) recipients=state.users.filter(u=>targetIds.includes(Number(u.id))&&!u.roleKeys?.includes("guest"));
  else recipients=state.users.filter(u=>{
    if(u.roleKeys?.includes("guest"))return false;
    if(d.targetAll||d.targetType==="all")return true;
    if(d.targetClassLeaderAll||d.targetType==="classleaders")if((u.classes||[]).length)return true;
    const ps=(d.targetClassLeaderParallels||[]).map(String);
    if(ps.length&&(u.classes||[]).some(c=>ps.includes(String(c).match(/^\d+/)?.[0])))return true;
    return (d.targetUsers||[]).includes(u.login);
  });
  const rows=recipients.map(u=>{const seen=d.readBy?.[u.login];return [d.title||d.fileName,u.name,seen?(typeof seen==="object"?new Date(seen.at).toLocaleString("ru-RU"):""):"Не ознакомлен"];});
  const csv=[["Документ","ФИО","Дата и время"],...rows];downloadCSV(csv[0],csv.slice(1),`ознакомление_${d.id}.csv`);
  const lines=rows.map(r=>`<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(r[1])}</td><td>${escapeHtml(r[2])}</td></tr>`).join("");
  const w=window.open("","_blank","width=900,height=600");if(w){w.document.write(`<title>Кто ознакомился</title><body style="font-family:Arial;padding:20px"><h2>Кто ознакомился</h2><table border="1" cellpadding="8" style="border-collapse:collapse"><tr><th>Документ</th><th>ФИО</th><th>Дата и время</th></tr>${lines}</table></body>`);w.document.close();}
};


/* ---------- Work plan: one modal, server-backed ---------- */
function ensurePlanModalStyles(){
  if(document.getElementById("planModalStyles"))return;
  const s=document.createElement("style");s.id="planModalStyles";s.textContent=`
    .plan-modal-backdrop{position:fixed;inset:0;background:rgba(6,61,43,.28);display:flex;align-items:center;justify-content:center;padding:20px;z-index:10020}
    .plan-modal{background:#fff;width:min(820px,100%);max-height:92vh;overflow:auto;border-radius:20px;box-shadow:0 20px 70px rgba(6,61,43,.28);padding:22px}
    .plan-modal h3{margin:0 0 5px}.plan-modal .muted{margin-bottom:16px}
    .plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.plan-grid .wide{grid-column:1/-1}
    .plan-grid label{margin:0}.plan-grid input,.plan-grid select,.plan-grid textarea{width:100%}
    .plan-grid textarea{min-height:90px;resize:vertical}
    .plan-class-box{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px}
    .plan-class-box label{display:flex;gap:6px;align-items:center;padding:7px 10px;border:1px solid var(--line);border-radius:10px;background:#f7faf8;font-size:12px}
    .plan-class-box input{width:auto}
    .plan-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
    .plan-help{font-size:11px;color:var(--muted);margin-top:5px}
    @media(max-width:700px){.plan-grid{grid-template-columns:1fr}.plan-grid .wide{grid-column:auto}}
  `;document.head.appendChild(s);
}
function planManagers(){
  return (state.users||[]).filter(u=>
    !u.roleKeys?.includes("guest") &&
    (u.roleKeys||[]).some(r=>["deputy","director","admin"].includes(r))
  ).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"ru"));
}
function planTeacherClasses(){
  const u=state.currentUser||{};
  const arr=[...(u.classes||[]),...(u.attendanceClasses||[])].filter(Boolean);
  return [...new Set(arr.map(String))].sort(classSort);
}
function parsePlanParticipantClass(text,classes){
  const upper=String(text||"").toUpperCase();
  return classes.find(c=>upper.includes(String(c).toUpperCase()))||"";
}
function closePlanModal(){document.querySelector(".plan-modal-backdrop")?.remove();}
window.closePlanModal=closePlanModal;

renderPlan=function(){
  const all=(state.plan||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.time).localeCompare(String(b.time)));
  const visible=isManager()?all:all.filter(x=>x.status==="Опубликовано"||Number(x.authorEmployeeId)===Number(state.currentUser?.id));
  const can=isManager();
  shell("План работы","Заместители и директор формируют общий план. Учителя предлагают мероприятия своих классов.",`
    <div class="card">
      <div class="toolbar"><button class="btn green" onclick="addPlan()">＋ Добавить мероприятие</button>${can?'<span class="chip">Публикация и редактирование доступны заместителям и директору</span>':''}</div>
      <div class="table-wrap"><table class="data-table">
        <tr><th>Дата</th><th>Время</th><th>Мероприятие</th><th>Место</th><th>Участники</th><th>Ответственный заместитель</th><th>Статус</th><th>Действия</th></tr>
        ${visible.map(x=>`<tr>
          <td>${escapeHtml(formatPlanDate(x.date))}</td><td>${escapeHtml(x.time||"")}</td><td>${escapeHtml(x.title||"")}</td><td>${escapeHtml(x.place||"")}</td><td>${escapeHtml(x.participants||"")}</td><td>${escapeHtml(x.responsible||"—")}</td>
          <td><span class="chip">${escapeHtml(x.status||"")}</span></td>
          <td>${canEditPlanItem(x)?`<div class="icon-actions">${can&&x.status==="На согласовании"?`<button class="small-btn" onclick="publishPlan(${x.id})">Опубликовать</button>`:""}<button class="small-btn" onclick="editPlan(${x.id})">Изменить</button><button class="small-btn danger" onclick="deletePlan(${x.id})">Удалить</button></div>`:"—"}</td>
        </tr>`).join("")||'<tr><td colspan="8"><div class="empty">План пока пуст.</div></td></tr>'}
      </table></div>
    </div>`);
};

function openPlanModal(mode="add",id=null){
  ensurePlanModalStyles();
  const edit=mode==="edit"||mode==="publish";
  const x=edit?(state.plan||[]).find(p=>Number(p.id)===Number(id)):null;
  if(edit && !x)return;
  if(edit && !canEditPlanItem(x))return;
  const teachers=!isManager(),classes=teachers?planTeacherClasses():[];
  const chosenClass=teachers?(parsePlanParticipantClass(x?.participants,classes)||classes[0]||""):"";
  const managerList=planManagers();
  const selectedResponsible=Number(x?.responsibleEmployeeId||0);
  const title=x?.title||"",date=x?.date||new Date().toISOString().slice(0,10),time=x?.time||"12:00",place=x?.place||"",participants=teachers?(x?.participants||"").replace(chosenClass,"").replace(/^\\s*[,;]\\s*/,"").trim():(x?.participants||"");
  const selectedStatus=x?.status||"На согласовании";
  const managerOptions=`<option value="">${mode==="publish"?"Выберите ответственного":"Не назначен"}</option>${managerList.map(u=>`<option value="${Number(u.id)}" ${selectedResponsible===Number(u.id)?"selected":""}>${escapeHtml(u.name)}</option>`).join("")}`;
  const ownClassBox=teachers?`<div class="wide"><label>Класс мероприятия</label><select id="planClass">${classes.length?classes.map(c=>`<option value="${escapeHtml(c)}" ${String(c)===String(chosenClass)?"selected":""}>${escapeHtml(c)}</option>`).join(""):'<option value="">Классное руководство не назначено</option>'}</select><div class="plan-help">Учитель может предложить мероприятие только для класса из своего классного руководства.</div></div>`:"";
  const responsibleField=`<div><label>Ответственный заместитель</label><select id="planResponsible">${managerOptions}</select><div class="plan-help">${teachers?"Можно оставить пустым — заместитель назначит при публикации.":"Для опубликованного мероприятия поле желательно заполнить."}</div></div>`;
  const actionLabel=mode==="add"?"Сохранить мероприятие":mode==="publish"?"Сохранить и опубликовать":"Сохранить изменения";
  const html=`<div class="plan-modal-backdrop" onclick="if(event.target===this)closePlanModal()"><div class="plan-modal">
    <h3>${edit?"Редактирование мероприятия":"Новое мероприятие"}</h3>
    <div class="muted">${mode==="publish"?"Заполните недостающие данные и подтвердите публикацию.":"Все поля находятся в одном окне."}</div>
    <div class="plan-grid">
      <div><label>Дата</label><input id="planDate" type="date" value="${escapeHtml(date)}"></div>
      <div><label>Время</label><input id="planTime" type="time" value="${escapeHtml(time)}"></div>
      <div class="wide"><label>Мероприятие</label><input id="planTitle" value="${escapeHtml(title)}" placeholder="Название мероприятия"></div>
      <div><label>Место</label><input id="planPlace" value="${escapeHtml(place)}" placeholder="Кабинет, актовый зал, площадка..."></div>
      ${ownClassBox}
      <div class="${teachers?'wide':''}"><label>Участники</label><textarea id="planParticipants" placeholder="Классы, педагоги, родители, обучающиеся...">${escapeHtml(participants)}</textarea></div>
      ${responsibleField}
    </div>
    <div class="plan-modal-actions"><button class="btn" onclick="closePlanModal()">Отмена</button><button class="btn green" onclick="savePlanModal('${mode}',${x?Number(x.id):"null"})">${actionLabel}</button></div>
  </div></div>`;
  document.body.insertAdjacentHTML("beforeend",html);
}

window.addPlan=function(){openPlanModal("add");};
window.editPlan=function(id){openPlanModal("edit",id);};

window.savePlanModal=async function(mode,id){
  const teacher=!isManager();
  const title=document.getElementById("planTitle")?.value.trim();
  const date=document.getElementById("planDate")?.value;
  const time=document.getElementById("planTime")?.value||"";
  const place=document.getElementById("planPlace")?.value.trim();
  const respId=Number(document.getElementById("planResponsible")?.value||0)||null;
  const respUser=planManagers().find(u=>Number(u.id)===respId);
  const respName=respUser?.name||"";
  let participants=document.getElementById("planParticipants")?.value.trim()||"";
  if(!title||!date||!time||!place)return alert("Заполните дату, время, мероприятие и место.");
  if(teacher){
    const cls=document.getElementById("planClass")?.value.trim();
    if(!cls)return alert("Выберите класс мероприятия.");
    participants=participants?`${cls}, ${participants}`:cls;
  }
  if(!participants)return alert("Заполните участников.");
  if((mode==="publish"||isManager())&&!respName)return alert("Выберите ответственного заместителя/директора.");
  const existing=id?(state.plan||[]).find(p=>Number(p.id)===Number(id)):null;
  const status=mode==="add"?(isManager()?"Опубликовано":"На согласовании"):(mode==="publish"?"Опубликовано":existing?.status||"На согласовании");
  const payload={event_date:date,event_time:time,event_title:title,place,participants,responsible_employee_id:respId,responsible_name:respName,status,author_employee_id:Number(existing?.authorEmployeeId||state.currentUser.id),author_name:existing?.author||state.currentUser.name,updated_at:new Date().toISOString()};
  try{
    let saved;
    if(existing) saved=await sbMutate("work_plan","PATCH",`id=eq.${encodeURIComponent(existing.id)}`,payload);
    else saved=await sbMutate("work_plan","POST","",payload);
    const row=Array.isArray(saved)?saved[0]:saved;
    if(existing)Object.assign(existing,{date,time,title,place,participants,responsible:respName,responsibleEmployeeId:respId,status,authorEmployeeId:payload.author_employee_id,author:payload.author_name});
    else{
      state.plan.push({id:Number(row?.id||Date.now()),date,time,title,place,participants,responsible:respName,responsibleEmployeeId:respId,status,author:payload.author_name,authorEmployeeId:payload.author_employee_id});
    }
    save();closePlanModal();render();
  }catch(e){alert("Не удалось сохранить мероприятие: "+(e.message||e));}
};

window.publishPlan=function(id){
  const x=(state.plan||[]).find(p=>Number(p.id)===Number(id));
  if(!x||!isManager())return;
  openPlanModal("publish",id);
};

window.deletePlan=async function(id){
  const x=(state.plan||[]).find(p=>Number(p.id)===Number(id));
  if(!x||!canEditPlanItem(x))return;
  if(!confirm("Удалить мероприятие?"))return;
  try{
    await sbMutate("work_plan","DELETE",`id=eq.${encodeURIComponent(id)}`);
    state.plan=state.plan.filter(p=>Number(p.id)!==Number(id));
    save();render();
  }catch(e){alert("Не удалось удалить мероприятие: "+(e.message||e));}
};

/* ---------- Replace Olympiad page only by adding the same приказ section above the existing iframe ---------- */
const __renderPlaceholderFixed = renderPlaceholder;
renderPlaceholder = function(){
  if(state.currentPage==="olymp"){
    const page="olymp", title="Приказы";
    const responsible=state.responsibles?.[page]||"";
    const responsibleBlock=`<div class="responsible-line"><b>Ответственный за направление:</b><span>${escapeHtml(responsible||"не назначен")}</span>${(isAdmin()||state.currentUser?.roleKeys?.includes("director"))?`<button class="small-btn" onclick="setResponsible('${page}')">Изменить</button>`:""}</div>`;
    shell("Олимпиадное и конкурсное движение",responsibleBlock+"Готовый модуль олимпиадного и конкурсного движения.",`
      <div class="module-grid" style="margin-bottom:18px">${moduleCard("Приказы","Приказы по олимпиадному и конкурсному движению. Непрочитанные документы подсвечиваются.","left",true)}</div>
      <div class="olymp-embed"><iframe src="olympiad_module.html" title="Олимпиадное и конкурсное движение" loading="lazy"></iframe></div>`);
    return;
  }
  __renderPlaceholderFixed();
};


/* ---------- Home vacation block ---------- */
const __renderHomeBeforeVacation=renderHome;
renderHome=function(){
  __renderHomeBeforeVacation();
  const txt=String(state.vacationsText||"").trim();
  if(!txt)return;
  const right=document.querySelector("#content .home-right");
  if(right){
    right.insertAdjacentHTML("afterbegin",`<section class="card vacation-home-card"><h3>🏖️ Сроки каникул</h3><div class="vacation-text">${escapeHtml(txt)}</div></section>`);
  }
};

/* ---------- Final acknowledgement guard: uploader + all management roles ---------- */
window.whoRead=window.whoRead || function(){};



/* ===============================================================
   V8 FINAL PATCH — посещение уроков / анализы + расписание
   Everything is inside the main app IIFE so local helpers/state are in scope.
   =============================================================== */

/* ---------- Subject normalization / preservation ---------- */
function normalizeScheduleSubject(v){
  const s=String(v??'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  const n=s.toLocaleLowerCase('ru-RU');
  if(n==='россия мг' || n.includes('россия мг')) return 'Россия МГ';
  if(n==='ров') return 'РОВ';
  return s;
}
function looksLikeLessonNumber(v){
  const n=Number(String(v??'').trim());
  return Number.isInteger(n) && n>=1 && n<=20 && /^\d{1,2}$/.test(String(v??'').trim());
}
function classHeaderCell(v){return /^\s*\d{1,2}\s*[А-ЯЁA-Z]\s*$/iu.test(String(v??''));}
function detectSectionShift(rows, headerRow, selectedShift){
  const from=Math.max(0,headerRow-7), to=Math.min(rows.length,headerRow+4);
  for(let r=from;r<to;r++){
    const t=(rows[r]||[]).map(cellVal).join(' ');
    const m=t.match(/(^|\s)([12])\s*(?:-|–|—)?\s*(?:я|й)?\s*смена\b/i);
    if(m)return Number(m[2]);
  }
  return Number(selectedShift)||null;
}

/* ---------- Robust daily schedule parser ---------- */
parseScheduleWorkbook=function(wb,fileName,selectedShift){
  const manualDate=document.getElementById('scheduleDate')?.value||'';
  let dateIso=manualDate;
  const allEntries=[];

  // Parse every sheet and every timetable section. This is deliberate: some
  // school schedule workbooks place different shifts/tables on separate sheets.
  for(const sheetName of (wb.SheetNames||[])){
    const ws=wb.Sheets[sheetName];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
    if(!dateIso){
      for(const row of rows.slice(0,25)){
        const t=(row||[]).map(cellVal).join(' ');
        const d=parseDateFromText(t);
        if(d){dateIso=d;break;}
      }
    }

    const headerRows=[];
    for(let r=0;r<rows.length;r++){
      const row=rows[r]||[];
      const classCells=[];
      for(let c=0;c<row.length;c++) if(classHeaderCell(row[c])) classCells.push(c);
      if(classCells.length>=1)headerRows.push({row:r,cols:classCells});
    }
    if(!headerRows.length)continue;

    for(let h=0;h<headerRows.length;h++){
      const headerRow=headerRows[h].row;
      const endBoundary=headerRows[h+1]?.row ?? rows.length;
      const sectionShift=detectSectionShift(rows,headerRow,selectedShift);
      if(Number(sectionShift)!==Number(selectedShift))continue;
      const classes=headerRows[h].cols.map(c=>({className:normalizeClass(rows[headerRow][c]),subCol:c,roomCol:c+1}));
      const lessonRows=[];
      for(let r=headerRow+1;r<endBoundary;r++){
        const row=rows[r]||[];
        let lesson=null;
        for(let c=0;c<Math.min(8,row.length);c++){
          if(looksLikeLessonNumber(row[c])){lesson=Number(String(row[c]).trim());break;}
        }
        if(lesson!=null)lessonRows.push({row:r,lesson});
      }

      for(let i=0;i<lessonRows.length;i++){
        const start=lessonRows[i].row;
        const stop=lessonRows[i+1]?.row ?? endBoundary;
        const lesson=lessonRows[i].lesson;
        for(const cls of classes){
          let group=0;
          const cells=[];
          for(let r=start;r<stop;r++){
            const value=normalizeScheduleSubject(rows[r]?.[cls.subCol]);
            if(!value)continue;
            if(looksLikeLessonNumber(value) || /^(?:[12](?:-я|-й)?\s*смена|смена\s*[12])$/iu.test(value))continue;
            const teacherLike=looksLikeTeacherName(value);
            const room=cellVal(rows[r]?.[cls.roomCol]) || cellVal(rows[r+1]?.[cls.roomCol]);
            if(teacherLike)continue;
            // Skip obvious room-only cells accidentally placed in subject column.
            if(/^\d{1,4}(?:[.,]\d+)?$/.test(value))continue;
            let teacher='';
            for(let t=r+1;t<stop;t++){
              const candidate=cellVal(rows[t]?.[cls.subCol]);
              if(!candidate)continue;
              if(looksLikeTeacherName(candidate)){teacher=candidate;break;}
              // A different non-teacher text means we reached another subject.
              if(t>r+1 && !looksLikeTeacherName(candidate))break;
            }
            cells.push({date:dateIso||'',shift:Number(selectedShift),lesson,className:cls.className,subject:value,teacher,room,group:group++});
          }
          allEntries.push(...cells);
        }
      }
    }
  }

  if(!dateIso)throw new Error('Не удалось определить дату расписания. Укажите дату в поле «Дата расписания».');
  if(!Number(selectedShift))throw new Error('Не выбрана смена.');
  const seen=new Set();
  const unique=allEntries.filter(x=>{
    const key=[x.date,x.shift,x.lesson,x.className,x.subject,x.teacher,x.room].join('|');
    if(seen.has(key))return false;
    seen.add(key);return true;
  });
  if(!unique.length)throw new Error('Не удалось распознать ни одного урока для выбранной смены.');
  return {date:dateIso,shift:Number(selectedShift),entries:unique,classes:[...new Set(unique.map(x=>x.className))],fileName};
};

/* ---------- Server schedule loading: exact + teacher-row dedupe ---------- */
const __loadScheduleServerV8=loadScheduleServer;
loadScheduleServer=async function(){
  await __loadScheduleServerV8();
  const seen=new Set();
  state.schedule.entries=(state.schedule.entries||[]).filter(x=>{
    const key=[x.date,Number(x.shift),Number(x.lesson),normalizeClass(x.className),normalizeScheduleSubject(x.subject),normalizePersonName(x.teacher),String(x.room||'').trim()].join('|');
    if(!x.subject && !x.teacher)return false;
    if(looksLikeTeacherName(x.subject) && !x.teacher)return false;
    if(seen.has(key))return false;
    seen.add(key);return true;
  }).map(x=>({...x,subject:normalizeScheduleSubject(x.subject)}));
  return true;
};

/* ---------- Authoritative schedule upload ---------- */
window.uploadSchedule=async function(){
  if(!isDispatcher())return alert('Загрузка расписания доступна только диспетчеру и администратору.');
  const f=document.getElementById('scheduleFile')?.files?.[0];
  const selectedShift=Number(document.getElementById('scheduleShift')?.value||0);
  const dateInput=document.getElementById('scheduleDate')?.value||'';
  if(!f)return alert('Выберите Excel-файл расписания.');
  if(!dateInput)return alert('Укажите дату расписания.');
  if(!selectedShift)return alert('Укажите смену.');
  try{
    const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});
    const parsed=parseScheduleWorkbook(wb,f.name,selectedShift);
    // Дата из формы является источником истины для ежедневного расписания.
    // Excel может содержать дату создания/выгрузки файла, которая не совпадает с датой уроков.
    parsed.date=dateInput;
    await saveScheduleRows(parsed); // replaces exactly selected date + shift
    await loadScheduleServer();
    const info=document.getElementById('scheduleImportInfo');
    if(info)info.innerHTML=`Загружено: <b>${escapeHtml(parsed.date)}</b>, <b>${parsed.shift}-я смена</b>; классов: <b>${parsed.classes.length}</b>; записей: <b>${parsed.entries.length}</b>.`;
    alert(`Расписание загружено: ${parsed.date}, ${parsed.shift}-я смена. Записей: ${parsed.entries.length}.`);
    render();
  }catch(e){console.error(e);alert('Не удалось сохранить расписание: '+(e.message||e));}
};

/* ---------- Shift-aware sorting and display ---------- */
function scheduleSort(a,b){
  const sa=Number(a.shift)||99,sb=Number(b.shift)||99;
  return sa-sb || (Number(a.lesson)||99)-(Number(b.lesson)||99) || classSort(a.className,b.className) || String(a.subject||'').localeCompare(String(b.subject||''),'ru');
}
scheduleForUser=function(entries,mode){
  let arr=[];
  if(isGuest()) arr=[...entries];
  else if(mode==='mine') arr=entries.filter(x=>teacherMatches(x.teacher,state.currentUser.name));
  else if(mode&&mode.startsWith('class:')) arr=entries.filter(x=>x.className===mode.slice(6));
  return arr.sort(scheduleSort);
};
scheduleShiftFor=function(entries){
  const shifts=[...new Set(entries.map(x=>Number(x.shift)).filter(x=>x===1||x===2))].sort((a,b)=>a-b);
  if(!shifts.length)return '—';
  return `<div class="schedule-shift-badges">${shifts.map(s=>`<span class="schedule-shift-badge shift${s}">${s} смена</span>`).join('')}</div>`;
};
renderScheduleTable=function(entries,mode){
  const arr=scheduleForUser(entries,mode);
  if(!arr.length)return '<div class="schedule-empty">Расписание для выбранного варианта не найдено.</div>';
  return `<div class="schedule-view"><div class="schedule-shift-badges">${scheduleShiftFor(arr).replace(/^<div class="schedule-shift-badges">|<\/div>$/g,'')}</div><div class="table-wrap"><table class="data-table schedule-table"><tr><th>Смена</th><th>Урок</th><th>Класс</th><th>Предмет</th><th>Учитель</th><th>Кабинет</th></tr>${arr.map(x=>`<tr class="shift-row-${Number(x.shift)===2?2:1}"><td><span class="schedule-shift-badge shift${Number(x.shift)===2?2:1}">${Number(x.shift)} смена</span></td><td>${Number(x.lesson)}</td><td>${escapeHtml(x.className)}</td><td>${escapeHtml(normalizeScheduleSubject(x.subject)||'—')}</td><td>${escapeHtml(x.teacher||'—')}</td><td>${escapeHtml(x.room||'—')}</td></tr>`).join('')}</table></div></div>`;
};
renderScheduleSelector=function(day){
  const dt=day==='tomorrow'?nextSchoolDay():new Date(),iso=dateIsoLocal(dt);
  const classes=[...new Set((state.classRoster||[]).map(x=>x.name).filter(Boolean))].sort(classSort);
  return `<div class="schedule-choice"><select id="scheduleChoice_${day}" onchange="showScheduleChoice('${day}')"><option value="">Выберите вариант</option><option value="mine">Мое расписание</option>${classes.map(c=>`<option value="class:${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select></div><div id="scheduleResult_${day}"><div class="schedule-empty">Выберите «Мое расписание» или класс.</div></div>`;
};
window.showScheduleChoice=function(day){
  const sel=document.getElementById(`scheduleChoice_${day}`);if(!sel)return;
  const dt=day==='tomorrow'?nextSchoolDay():new Date();
  const result=document.getElementById(`scheduleResult_${day}`);if(!result)return;
  result.innerHTML=sel.value?renderScheduleTable(getScheduleForDate(dateIsoLocal(dt)),sel.value):'<div class="schedule-empty">Выберите вариант.</div>';
};
renderScheduleHomeSelector=function(day='today'){
  const classes=[...new Set((state.classRoster||[]).map(x=>x.name).filter(Boolean))].sort(classSort);
  const id=`homeScheduleChoice_${day}`,resultId=`homeScheduleResult_${day}`;
  return `<div class="schedule-choice"><select id="${id}" onchange="showHomeScheduleChoice('${day}')"><option value="">Выберите вариант</option><option value="mine">Мое расписание</option>${classes.map(c=>`<option value="class:${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select></div><div class="muted">Выберите «Мое расписание» или класс.</div><div id="${resultId}" style="margin-top:12px"><div class="schedule-empty">Выберите вариант.</div></div>`;
};
window.showHomeScheduleChoice=function(day='today'){
  const sel=document.getElementById(`homeScheduleChoice_${day}`),result=document.getElementById(`homeScheduleResult_${day}`);if(!sel||!result)return;
  const dt=day==='tomorrow'?nextSchoolDay():new Date();
  result.innerHTML=sel.value?renderScheduleTable(getScheduleForDate(dateIsoLocal(dt)),sel.value):'<div class="schedule-empty">Выберите вариант.</div>';
};
renderBaseScheduleSelector=function(){
  const classes=[...new Set((state.classRoster||[]).map(x=>x.name).filter(Boolean))].sort(classSort);
  return `<div class="schedule-choice"><select id="baseScheduleChoice" onchange="showBaseScheduleChoice()"><option value="">Выберите класс</option>${classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select></div><div class="muted">Выберите класс, чтобы увидеть базовое расписание.</div><div id="baseScheduleResult" style="margin-top:12px"><div class="schedule-empty">Класс не выбран.</div></div>`;
};
window.showBaseScheduleChoice=function(){
  const c=document.getElementById('baseScheduleChoice')?.value;if(!c)return;
  const arr=(state.schedule.baseEntries||[]).filter(x=>x.className===c).sort(scheduleSort);
  if(!arr.length){document.getElementById('baseScheduleResult').innerHTML='<div class="schedule-empty">Базовое расписание для класса не найдено.</div>';return;}
  const shifts=[...new Set(arr.map(x=>Number(x.shift)).filter(x=>x===1||x===2))].sort((a,b)=>a-b);
  const days=['Понедельник','Вторник','Среда','Четверг','Пятница'];
  const badges=shifts.map(s=>`<span class="schedule-shift-badge shift${s}">${s} смена</span>`).join('');
  let html=`<div class="schedule-shift-badges">${badges}</div><div class="table-wrap"><table class="data-table schedule-table"><tr><th>Смена</th><th>Урок</th>${days.map(d=>`<th>${d}</th>`).join('')}</tr>`;
  for(const shift of shifts){
    for(let lesson=1;lesson<=20;lesson++){
      const rows=arr.filter(x=>Number(x.shift)===shift&&Number(x.lesson)===lesson);
      if(!rows.length)continue;
      html+=`<tr class="shift-row-${shift}"><td><span class="schedule-shift-badge shift${shift}">${shift} смена</span></td><td>${lesson}</td>${days.map((_,i)=>{const cells=rows.filter(x=>x.dayIndex===i);return `<td>${cells.map(x=>`${escapeHtml(normalizeScheduleSubject(x.subject)||'—')}<br><span class="muted">${escapeHtml(x.teacher||'')}</span>`).join('<hr style="border:0;border-top:1px solid var(--line);margin:5px 0">')||'—'}</td>`;}).join('')}</tr>`;
    }
  }
  html+='</table></div>';document.getElementById('baseScheduleResult').innerHTML=html;
};


// Start the application only after the complete modular runtime is available.
(async()=>{
  if(!window.supabase)return;
  try{
    const {data:{session}}=await window.supabase.auth.getSession();
    if(session?.user && await window.loadRealEmployees(session.user)){
      await window.loadAppSettingsFromSupabase();
      await window.loadUserAssignments();
      await window.loadDocumentsFromSupabase();
      try{ if(typeof window.refreshRuntimeData==='function') await window.refreshRuntimeData(); }catch(e){}
      document.getElementById('authScreen')?.classList.add('hidden');
      document.getElementById('app')?.classList.remove('hidden');
      window.render();
    }
  }catch(e){ console.error('Ошибка запуска приложения:',e); }
})();
