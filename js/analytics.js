/* ANALYTICS.JS — Analytics module */
/* ---------- Visit analysis ---------- */
async function loadVisitAnalysesServer(){
  try{
    const rows=await sbRest('visit_analysis','select=*&order=uploaded_at.desc');
    const by={};
    (rows||[]).forEach(x=>by[String(x.notification_id)]={
      id:Number(x.id),notificationId:Number(x.notification_id),teacherEmployeeId:Number(x.teacher_employee_id),
      senderEmployeeId:Number(x.sender_employee_id),fileName:x.file_name||'',storageUrl:x.storage_url||'',storagePath:x.storage_path||'',
      uploadedBy:Number(x.uploaded_by),uploadedAt:x.uploaded_at
    });
    state.visitAnalyses=by;
    (state.notifications||[]).forEach(n=>n.analysis=by[String(n.id)]||null);
  }catch(e){console.warn('Не удалось загрузить анализы посещения уроков:',e);state.visitAnalyses={};}
}
function visitCanSeeNotification(n){
  if(!n||n.type!=='visit'||isGuest())return false;
  return isManager() || Number(n.teacherId)===Number(state.currentUser?.id);
}
function visitCanUploadAnalysis(n){
  return !!n && isManager() && Number(n.senderEmployeeId)===Number(state.currentUser?.id);
}
function visitCanSeeAnalysis(n){
  return visitCanSeeNotification(n) && !!n.analysis?.storageUrl;
}
function visitAnalysisButtons(n){
  if(!visitCanSeeNotification(n))return '';
  const parts=[];
  if(visitCanSeeAnalysis(n)){
    parts.push(`<a class="small-btn" href="${escapeHtml(n.analysis.storageUrl)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Анализ</a>`);
  }
window.visitAnalysisButtons = visitAnalysisButtons;
  if(visitCanUploadAnalysis(n)){
    parts.push(`<button class="small-btn ${n.analysis?.storageUrl?'':'green'}" onclick="event.stopPropagation();uploadVisitAnalysis(${Number(n.id)})">${n.analysis?.storageUrl?'Заменить анализ':'Загрузить анализ'}</button>`);
  }
  return parts.join('');
}
const __noticeHtmlBaseV8=noticeHtml;
noticeHtml=function(n){
  if(n?.type==='visit'){
    const actions=visitAnalysisButtons(n);
    return `<div class="notice ${n.read?'':'unread'}" onclick="readNotification(${Number(n.id)})"><div class="dot"></div><div style="flex:1;min-width:0"><strong>${escapeHtml(n.title||'Уведомление о посещении урока')}</strong>${n.read?'':' <span class="unread-marker">• новое</span>'}<p>${escapeHtml(n.text||'')}</p><small class="muted">${escapeHtml(n.visit?.date||n.date||'')}</small>${n.analysis?.storageUrl?`<div class="ack-info" style="margin-top:7px">📎 ${escapeHtml(n.analysis.fileName||'Файл анализа')}</div>`:''}${actions?`<div class="doc-actions visit-analysis-actions" style="margin-top:8px">${actions}</div>`:''}</div></div>`;
  }
  return __noticeHtmlBaseV8(n);
};

const __renderNotificationsBaseV8=renderNotifications;
renderNotifications=function(){
  __renderNotificationsBaseV8();
  loadVisitAnalysesServer().then(()=>{if(state.currentPage==='notifications')render();});
};

window.uploadVisitAnalysis=async function(notificationId){
  const n=(state.notifications||[]).find(x=>Number(x.id)===Number(notificationId));
  if(!n||!visitCanUploadAnalysis(n))return alert('Загрузить анализ может только заместитель/директор, отправивший это уведомление.');
  const input=document.createElement('input');input.type='file';input.accept='.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  input.onchange=async()=>{
    const f=input.files?.[0];if(!f)return;
    try{
      const uploaded=await uploadToYandexFolder(f,YANDEX_FOLDERS.visitAnalysis,'visitAnalysis','Анализ посещения урока');
      const url=uploaded.public_url||uploaded.url||'';
      if(!url)throw new Error('Яндекс.Диск не вернул ссылку на загруженный файл.');
      const existing=n.analysis;
      const payload={notification_id:Number(n.id),teacher_employee_id:Number(n.teacherId),sender_employee_id:Number(n.senderEmployeeId),file_name:f.name,storage_url:url,storage_path:uploaded.path||'',uploaded_by:Number(state.currentUser.id)};
      let saved;
      if(existing?.id)saved=await sbMutate('visit_analysis','PATCH',`id=eq.${encodeURIComponent(existing.id)}`,payload);
      else saved=await sbMutate('visit_analysis','POST','',payload);
      const row=Array.isArray(saved)?saved[0]:saved;
      n.analysis={id:Number(row?.id||existing?.id||Date.now()),notificationId:Number(n.id),teacherEmployeeId:Number(n.teacherId),senderEmployeeId:Number(n.senderEmployeeId),fileName:f.name,storageUrl:url,storagePath:payload.storage_path,uploadedBy:Number(state.currentUser.id),uploadedAt:new Date().toISOString()};
      state.visitAnalyses=state.visitAnalyses||{};state.visitAnalyses[String(n.id)]=n.analysis;save();
      alert('Анализ загружен на Яндекс.Диск.');render();
    }catch(e){console.error(e);alert('Не удалось загрузить анализ: '+(e.message||e));}
  };
  input.click();
};

/* ---------- Analytics module ---------- */
function attendanceClassesForReport(){
  const all=state.classRoster||[];
  const assigned=new Set([...(state.currentUser?.attendanceClasses||[]),...(state.currentUser?.classes||[])].map(String));
  return isManager()?all.slice():all.filter(r=>assigned.has(String(r.name)));
}
function attendanceShiftForClass(cls){
  const r=(state.classRoster||[]).find(x=>String(x.name)===String(cls));
  if(r?.shift)return Number(r.shift);
  const u=(state.users||[]).find(x=>(x.classes||[]).map(String).includes(String(cls))||(x.attendanceClasses||[]).map(String).includes(String(cls)));
  return Number(u?.shift?.[cls]||0)||0;
}
function attendanceTeacherForClass(cls){
  const exact=(state.users||[]).filter(u=>(u.classes||[]).map(String).includes(String(cls))).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ru'));
  if(exact[0])return exact[0].name;
  return (state.users||[]).filter(u=>(u.attendanceClasses||[]).map(String).includes(String(cls))).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ru'))[0]?.name||'';
}
function attendanceReportRange(){
  let from=document.getElementById('attDate')?.value||'';
  if(!from)from=dateInfo().iso;
  const input=document.getElementById('attDate');if(input)input.value=from;
  return {from,to:from};
}
function dateList(from,to){
  const out=[];let d=new Date(from+'T00:00:00');const end=new Date(to+'T00:00:00');
  while(d<=end){out.push(dateIsoLocal(d));d.setDate(d.getDate()+1);}return out;
}
function attendanceRecordMap(from,to){
  const m=new Map();(state.attendance||[]).filter(x=>(!from||x.date>=from)&&(!to||x.date<=to)).forEach(x=>m.set(`${x.date}::${x.className}`,x));return m;
}
const ATT_HEADERS_V9=['Дата','Класс','Учитель','По списку','Присутствуют','Надомники','Дистант','Грипп, ОРВИ, ОРЗ','Острокишечные заболевания','Энтеровирусная инфекция','Ветряная оспа','Семейные обстоятельства','Пневмония','Травмы','Зубная боль','ЖКТ','Аллергия','Другое','Выезды на конкурсы, соревнования, лагерь','Без уважительной причины','Погодные условия'];
function attendanceValue(x,key){if(!x)return '';if(key==='respiratory')return x.respiratory??x.flu??0;return x[key]??'';}
function attendanceReportRows(from,to){
  const map=attendanceRecordMap(from,to),rows=[];
  for(const date of dateList(from,to)){
    for(const r of attendanceClassesForReport().slice().sort((a,b)=>classSort(a.name,b.name))){
      const x=map.get(`${date}::${r.name}`),teacher=x?.teacher||attendanceTeacherForClass(r.name),base=[date,r.name,teacher,r.studentCount||x?.total||0];
      rows.push({date,className:r.name,shift:Number(r.shift)||attendanceShiftForClass(r.name),teacher,record:x,base});
    }
  }
  return rows;
}
function attendanceNum(x,key){
  if(!x)return 0;
  const v=key==='respiratory'?(x.respiratory??x.flu??0):x[key];
  return Number(v)||0;
}
function attendanceTotalRows(rows){
  const numericKeys=['total','present','home','remote','respiratory','intestinal','enterovirus','chickenpox','family','pneumonia','trauma','toothache','gi','allergy','other','events','noReason','weather'];
  const sums={1:{},2:{},all:{}};
  for(const sh of [1,2])numericKeys.forEach(k=>sums[sh][k]=0);
  numericKeys.forEach(k=>sums.all[k]=0);
  rows.forEach(r=>{
    const sh=Number(r.shift)===2?2:1, x=r.record;
    const vals={total:x?Number(x.total)||0:Number(r.base?.[3])||0,present:attendanceNum(x,'present'),home:attendanceNum(x,'home'),remote:attendanceNum(x,'remote'),respiratory:attendanceNum(x,'respiratory'),intestinal:attendanceNum(x,'intestinal'),enterovirus:attendanceNum(x,'enterovirus'),chickenpox:attendanceNum(x,'chickenpox'),family:attendanceNum(x,'family'),pneumonia:attendanceNum(x,'pneumonia'),trauma:attendanceNum(x,'trauma'),toothache:attendanceNum(x,'toothache'),gi:attendanceNum(x,'gi'),allergy:attendanceNum(x,'allergy'),other:attendanceNum(x,'other'),events:attendanceNum(x,'events'),noReason:attendanceNum(x,'noReason'),weather:attendanceNum(x,'weather')};
    numericKeys.forEach(k=>{sums[sh][k]+=vals[k];sums.all[k]+=vals[k];});
  });
  return sums;
}
function attendanceSummaryCells(s){
  return [s.total,s.present,s.home,s.remote,s.respiratory,s.intestinal,s.enterovirus,s.chickenpox,s.family,s.pneumonia,s.trauma,s.toothache,s.gi,s.allergy,s.other,s.events,s.noReason,s.weather].map(v=>`<td><b>${v}</b></td>`).join('');
}
function buildAttendanceAnalyticsReport(){
  const {from}=attendanceReportRange(), rows=attendanceReportRows(from,from), headers=ATT_HEADERS_V9;
  const missing1=[...new Set(rows.filter(r=>!r.record&&Number(r.shift)===1).map(r=>r.className))];
  const missing2=[...new Set(rows.filter(r=>!r.record&&Number(r.shift)===2).map(r=>r.className))];
  const body=rows.map(r=>{
    const x=r.record;
    const vals=x?[r.date,r.className,x.teacher||r.teacher,x.total,x.present,x.home,x.remote,attendanceValue(x,'respiratory'),x.intestinal,x.enterovirus,x.chickenpox,x.family,x.pneumonia,x.trauma,x.toothache,x.gi,x.allergy,x.other,x.events,x.noReason,x.weather]:[r.date,r.className,r.teacher,r.base[3],...Array(headers.length-4).fill('')];
    return `<tr class="${r.record?'':'attendance-missing-row'}">${vals.map(v=>`<td>${escapeHtml(v===null||v===undefined?'':String(v))}</td>`).join('')}</tr>`;
  }).join('');
  const sums=attendanceTotalRows(rows);
  const summary=(label,s)=>`<tr class="attendance-summary-row"><td colspan="3"><b>${label}</b></td>${attendanceSummaryCells(s)}</tr>`;
  const el=document.getElementById('attAnalytics');if(!el)return;
  el.innerHTML=`<div class="table-wrap attendance-analytics-wrap"><table class="data-table attendance-analytics-table"><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>${body||`<tr><td colspan="${headers.length}">Нет классов для отображения.</td></tr>`}${summary('1 смена',sums[1])}${summary('2 смена',sums[2])}${summary('Итого',sums.all)}</table></div><div class="attendance-missing"><div>1 смена: ${missing1.length?missing1.join(', '):'все классы заполнили форму'}</div><div>2 смена: ${missing2.length?missing2.join(', '):'все классы заполнили форму'}</div></div>`;
}
function filterAttendance(){buildAttendanceAnalyticsReport();}
function exportAttendance(){
  const {from}=attendanceReportRange(), rows=attendanceReportRows(from,from), data=rows.map(r=>{
    const x=r.record;
    return x?[r.date,r.className,x.teacher||r.teacher,x.total,x.present,x.home,x.remote,attendanceValue(x,'respiratory'),x.intestinal,x.enterovirus,x.chickenpox,x.family,x.pneumonia,x.trauma,x.toothache,x.gi,x.allergy,x.other,x.events,x.noReason,x.weather]:[r.date,r.className,r.teacher,r.base[3],...Array(ATT_HEADERS_V9.length-4).fill('')];
  });
  const sums=attendanceTotalRows(rows);
  const summaryRow=(label,s)=>[label,'','',s.total,s.present,s.home,s.remote,s.respiratory,s.intestinal,s.enterovirus,s.chickenpox,s.family,s.pneumonia,s.trauma,s.toothache,s.gi,s.allergy,s.other,s.events,s.noReason,s.weather];
  const allRows=[...data,summaryRow('1 смена',sums[1]),summaryRow('2 смена',sums[2]),summaryRow('Итого',sums.all)];
  if(window.XLSX){const XLSXLib=window.XLSX;const ws=XLSXLib.utils.aoa_to_sheet([ATT_HEADERS_V9,...allRows]);ws['!cols']=ATT_HEADERS_V9.map((h,i)=>({wch:i<4?18:16}));const wb=XLSXLib.utils.book_new();XLSXLib.utils.book_append_sheet(wb,ws,'Посещаемость');XLSXLib.writeFile(wb,'посещаемость.xlsx');}
  else downloadCSV(ATT_HEADERS_V9,allRows,'посещаемость.csv');
}
function exportJournalAnalytics(){
  const from=document.getElementById('jFrom')?.value||'',to=document.getElementById('jTo')?.value||'';
  const arr=(state.journalOverdue||[]).filter(x=>(!from||x.date>=from)&&(!to||x.date<=to));
  const grouped={};arr.forEach(x=>{const k=x.login||x.name;grouped[k]??={name:x.name||x.login,count:0,dates:[]};grouped[k].count+=Number(x.count||0);grouped[k].dates.push(x);});
  const rows=[['Учитель','Количество незаполненных страниц','Даты']];
  Object.values(grouped).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ru')).forEach(x=>rows.push([x.name,x.count,x.dates.map(d=>`${d.date}: ${d.count}`).join('; ')]));
  rows.push(['ИТОГО',arr.reduce((sum,x)=>sum+Number(x.count||0),0),'']);
  if(window.XLSX){const ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=[{wch:35},{wch:32},{wch:55}];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Контроль журнала');XLSX.writeFile(wb,'контроль_электронного_журнала.xlsx');}
  else downloadCSV(rows[0],rows.slice(1),'контроль_электронного_журнала.csv');
}
window.exportJournalAnalytics=exportJournalAnalytics;

function renderAnalytics(){
  if(!isManager()){shell('Аналитика','Доступна директору и заместителям.',`<div class="card"><div class="empty">Раздел аналитики доступен директору и заместителям.</div></div>`);return;}
  const visits=(state.notifications||[]).filter(n=>n.type==='visit').sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''),'ru'));
  const visitCards=visits.map(n=>{
    const vd=n.visit||{}, a=n.analysis;
    return `<div class="visit-analytics-item"><div class="visit-analytics-main"><strong>${escapeHtml(vd.teacher||state.users.find(u=>Number(u.id)===Number(n.teacherId))?.name||'Учитель')}</strong><div class="muted">${escapeHtml(vd.date||n.date||'')} · ${escapeHtml(vd.cls||'')} · ${escapeHtml(normalizeScheduleSubject(vd.subject)||'')}</div><div style="margin-top:6px">Посетил: ${escapeHtml(vd.deputy||n.senderName||'—')}</div><div class="muted" style="margin-top:4px">Цель: ${escapeHtml(vd.purpose||'')}</div></div><div class="visit-analytics-actions">${a?.storageUrl?`<a class="small-btn" href="${escapeHtml(a.storageUrl)}" target="_blank" rel="noopener">Просмотреть</a><a class="small-btn" href="${escapeHtml(a.storageUrl)}" target="_blank" rel="noopener" download>Скачать</a>`:'<span class="muted">Анализ пока не загружен</span>'}</div></div>`;
  }).join('')||'<div class="empty">Уведомлений о посещении уроков пока нет.</div>';
  shell('Аналитика','Контроль посещаемости, электронного журнала и сводных данных.',`
    <div class="analytics-workspace">
      <div class="card analytics-attendance-card"><h3>Посещаемость</h3><div class="toolbar analytics-date-row"><label style="margin:0">Дата <input id="attDate" type="date"></label><button class="btn green" onclick="filterAttendance()">Показать</button><button class="btn" onclick="exportAttendance()">Выгрузить Excel</button></div><div id="attAnalytics"></div></div>
      <div class="card analytics-journal-card"><h3>Контроль электронного журнала</h3><div class="toolbar"><button class="btn yellow-btn" onclick="document.getElementById('journalFile').click()">📎 Выбрать файл</button><input id="journalFile" type="file" accept=".xlsx,.xls,.csv" hidden onchange="handleJournalFile(event)"><button class="btn yellow-btn" onclick="processJournalUpload()">Загрузить и обработать</button></div><div id="journalUploadInfo" class="muted">В отчет попадают педагоги, на заполнившие темы и д/з в день проведения урока.</div><hr style="border:0;border-top:1px solid var(--line);margin:15px 0"><div class="toolbar"><button class="btn" onclick="journalPeriod('yesterday')">Вчера</button><button class="btn" onclick="journalPeriod('custom')">Произвольный период</button><label id="jDates" class="journal-period-row hidden">с <input id="jFrom" type="date"> по <input id="jTo" type="date"></label><button class="btn green" onclick="showJournalAnalytics()">Показать</button><button class="btn" onclick="exportJournalAnalytics()">Выгрузить Excel</button></div><div id="journalAnalytics"></div></div>
      <div class="card analytics-mydata-card"><h3>Сводная таблица «Мои данные»</h3><button class="btn green" onclick="exportMyData()">Выгрузить Excel</button><div class="table-wrap analytics-mydata-wrap" style="margin-top:12px"><table class="data-table"><tr><th>ФИО</th><th>Образование</th><th>Телефон</th><th>Стаж</th><th>Нагрузка</th><th>Квалификация</th><th>Предметы</th></tr>${state.users.filter(u=>u.roleKeys.includes('teacher')||u.roleKeys.includes('deputy')||u.roleKeys.includes('director')).map(u=>`<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml((state.myData[u.login]||{}).education||'—')}</td><td>${escapeHtml((state.myData[u.login]||{}).phone||'—')}</td><td>${escapeHtml((state.myData[u.login]||{}).totalExperience||'—')}</td><td>${escapeHtml((state.myData[u.login]||{}).load||'—')}</td><td>${escapeHtml((state.myData[u.login]||{}).qualification||'—')}</td><td>${escapeHtml((state.myData[u.login]||{}).subject1||'—')}</td></tr>`).join('')}</table></div></div>
    </div>
    <div class="card analytics-visits"><h3>Посещение уроков</h3><p class="muted">Уведомления о посещении уроков и загруженные Word-файлы анализа.</p>${visitCards}</div>`);
  const {from}=attendanceReportRange();
  if(document.getElementById('attDate'))document.getElementById('attDate').value=from;
  filterAttendance();
  showJournalAnalytics();
}

loadVisitAnalysesServer();

window.renderAnalytics=renderAnalytics;
window.filterAttendance=filterAttendance;
window.exportAttendance=exportAttendance;

/* TARGETED V10 PATCHES: daily schedule date, compact schedule, class shifts, attendance totals. */
(function(){
  // Daily schedule: use the date selected by the dispatcher, never the date guessed from Excel.
  const __oldUploadScheduleV10 = window.uploadSchedule;
  window.uploadSchedule = async function(){
    const dateInput=document.getElementById('scheduleDate')?.value||'';
    if(!dateInput){alert('Укажите дату расписания.');return;}
    // The authoritative uploader above already validates permissions/files; repeat only to guarantee date.
    if(!isDispatcher())return alert('Загрузка расписания доступна только диспетчеру и администратору.');
    const f=document.getElementById('scheduleFile')?.files?.[0];
    const selectedShift=Number(document.getElementById('scheduleShift')?.value||0);
    if(!f)return alert('Выберите Excel-файл расписания.');
    if(!selectedShift)return alert('Укажите смену.');
    try{
      const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});
      const parsed=parseScheduleWorkbook(wb,f.name,selectedShift);
      parsed.date=dateInput;
      await saveScheduleRows(parsed);
      await loadScheduleServer();
      const info=document.getElementById('scheduleImportInfo');
      if(info)info.innerHTML=`Загружено: <b>${escapeHtml(parsed.date)}</b>, <b>${parsed.shift}-я смена</b>; классов: <b>${parsed.classes.length}</b>; записей: <b>${parsed.entries.length}</b>.`;
      alert(`Расписание загружено: ${parsed.date}, ${parsed.shift}-я смена. Записей: ${parsed.entries.length}.`);
      render();
    }catch(e){console.error(e);alert('Не удалось сохранить расписание: '+(e.message||e));}
  };

  // Preserve class shift from Контингент in the admin edit flow.
  const __oldEditUserV10=window.editUser;
  window.editUser=function(id){
    return __oldEditUserV10(id);
  };

  // Shift-aware schedule display: 1st shift first, then 2nd; numbered lessons repeat within each shift.
  if(typeof renderScheduleTable==='function'){
    const __oldRST=renderScheduleTable;
    window.renderScheduleTable=function(entries){
      const arr=[...(entries||[])].sort((a,b)=>(Number(a.shift)||99)-(Number(b.shift)||99)||(Number(a.lesson)||99)-(Number(b.lesson)||99)||classSort(a.className,b.className));
      return __oldRST(arr);
    };
  }

  // Highlight shift badge in rendered schedule blocks without changing other functionality.
  const __oldRenderScheduleHome=window.renderScheduleHome;
  if(typeof __oldRenderScheduleHome==='function'){
    window.renderScheduleHome=function(){
      __oldRenderScheduleHome.apply(this,arguments);
      document.querySelectorAll('.schedule-shift').forEach(el=>{
        const t=el.textContent||'';
        el.classList.toggle('shift-1',t.includes('1'));
        el.classList.toggle('shift-2',t.includes('2')&&!t.includes('1'));
      });
    };
  }
})();


/* ===== FINAL TARGETED PATCH: schedule lookup + attendance totals ===== */
(function(){
  function sameClassName(a,b){
    return normalizeClass(a)===normalizeClass(b);
  }

  /* The Excel import is already correct. Do not change the schedule UI.
     The important fix is to keep the successfully saved daily schedule in
     the current state instead of immediately replacing it with a second
     server read. */
  window.uploadSchedule=async function(){
    if(!isDispatcher())return alert('Загрузка расписания доступна только диспетчеру и администратору.');
    const f=document.getElementById('scheduleFile')?.files?.[0];
    const selectedShift=Number(document.getElementById('scheduleShift')?.value||0);
    const dateInput=document.getElementById('scheduleDate')?.value||'';
    if(!f)return alert('Выберите Excel-файл расписания.');
    if(!dateInput)return alert('Укажите дату расписания.');
    if(!selectedShift)return alert('Укажите смену.');
    try{
      const XLSXLib=ensureXlsxLoaded();
      const wb=XLSXLib.read(await f.arrayBuffer(),{type:'array'});
      const parsed=parseScheduleWorkbook(wb,f.name,selectedShift);
      parsed.date=dateInput;
      if(!parsed.entries?.length)throw new Error('В файле не найдено ни одного урока для выбранной смены.');

      await saveScheduleRows(parsed);

      /* Keep exactly the rows that were just saved. This prevents the
         immediate post-upload refresh from clearing the page when the
         second REST read is temporarily stale. */
      const oldEntries=state.schedule.entries||[];
      state.schedule.entries=oldEntries
        .filter(x=>!(String(x.date)===String(parsed.date)&&Number(x.shift)===Number(parsed.shift)))
        .concat(parsed.entries.map(x=>({...x,date:parsed.date,shift:Number(parsed.shift)})));
      const now=new Date().toISOString();
      state.schedule.versions=(state.schedule.versions||[]).filter(v=>!(String(v.date)===String(parsed.date)&&Number(v.shift)===Number(parsed.shift)));
      state.schedule.versions.push({id:Date.now(),date:parsed.date,shift:Number(parsed.shift),fileName:f.name,uploadedAt:now,readBy:{[state.currentUser.login]:{at:now}}});
      state.schedule.uploadedFile=f.name;
      save();

      const info=document.getElementById('scheduleImportInfo');
      if(info)info.innerHTML=`Загружено: <b>${escapeHtml(parsed.date)}</b>, <b>${parsed.shift}-я смена</b>; классов: <b>${parsed.classes.length}</b>; записей: <b>${parsed.entries.length}</b>.`;
      alert(`Расписание загружено: ${parsed.date}, ${parsed.shift}-я смена. Записей: ${parsed.entries.length}.`);
      render();
    }catch(e){
      console.error(e);
      alert('Не удалось сохранить расписание: '+(e.message||e));
    }
  };

  /* Class names in the roster may contain a space ("6 А"), while the
     schedule parser normalizes them to "6А". Compare normalized names. */
  scheduleForUser=function(entries,mode){
    let arr=[];
    if(isGuest()) arr=[...(entries||[])];
    else if(mode==='mine') arr=(entries||[]).filter(x=>teacherMatches(x.teacher,state.currentUser.name));
    else if(mode&&mode.startsWith('class:')){
      const wanted=mode.slice(6);
      arr=(entries||[]).filter(x=>sameClassName(x.className,wanted));
    }
    return arr.sort(scheduleSort);
  };

  window.showBaseScheduleChoice=function(){
    const c=document.getElementById('baseScheduleChoice')?.value;
    if(!c)return;
    const arr=(state.schedule.baseEntries||[])
      .filter(x=>sameClassName(x.className,c))
      .sort(scheduleSort);
    const target=document.getElementById('baseScheduleResult');
    if(!target)return;
    if(!arr.length){
      target.innerHTML='<div class="schedule-empty">Базовое расписание для класса не найдено.</div>';
      return;
    }
    const shifts=[...new Set(arr.map(x=>Number(x.shift)).filter(x=>x===1||x===2))].sort((a,b)=>a-b);
    const days=['Понедельник','Вторник','Среда','Четверг','Пятница'];
    const badges=shifts.map(s=>`<span class="schedule-shift-badge shift${s}">${s} смена</span>`).join('');
    let html=`<div class="schedule-shift-badges">${badges}</div><div class="table-wrap"><table class="data-table schedule-table"><tr><th>Смена</th><th>Урок</th>${days.map(d=>`<th>${d}</th>`).join('')}</tr>`;
    for(const shift of shifts){
      for(let lesson=1;lesson<=20;lesson++){
        const rows=arr.filter(x=>Number(x.shift)===shift&&Number(x.lesson)===lesson);
        if(!rows.length)continue;
        html+=`<tr class="shift-row-${shift}"><td><span class="schedule-shift-badge shift${shift}">${shift} смена</span></td><td>${lesson}</td>${days.map((_,i)=>{
          const cells=rows.filter(x=>Number(x.dayIndex)===i);
          return `<td>${cells.map(x=>`${escapeHtml(normalizeScheduleSubject(x.subject)||'—')}<br><span class="muted">${escapeHtml(x.teacher||'')}</span>`).join('<hr style="border:0;border-top:1px solid var(--line);margin:5px 0">')||'—'}</td>`;
        }).join('')}</tr>`;
      }
    }
    html+='</table></div>';
    target.innerHTML=html;
  };
})();

/* ===== FINAL DAILY SCHEDULE LOOKUP PATCH ===== */
(function(){
  const __getScheduleForDateFinal = getScheduleForDate;
  getScheduleForDate = function(iso){
    const target=String(iso||'').slice(0,10);
    return (state.schedule.entries||[])
      .filter(x=>String(x.date||'').slice(0,10)===target)
      .sort(scheduleSort);
  };
  const __showScheduleChoiceFinal = window.showScheduleChoice;
  window.showScheduleChoice = function(day){
    const sel=document.getElementById('scheduleChoice_'+day); if(!sel)return;
    const dt=day==='tomorrow'?nextSchoolDay():new Date();
    const iso=dateIsoLocal(dt);
    const result=document.getElementById('scheduleResult_'+day); if(!result)return;
    if(!sel.value){result.innerHTML='<div class="schedule-empty">Выберите вариант.</div>';return;}
    const entries=getScheduleForDate(iso);
    result.innerHTML=renderScheduleTable(entries,sel.value);
  };
  window.__appShell=shell;
  window.__appEscapeHtml=escapeHtml;
  window.__appDateInfo=dateInfo;
  window.__appState=state;
  window.__appClassSort=classSort;
  window.__appSbMutate=sbMutate;
  window.__appSbRest=sbRest;
  window.__appGetCurrentAcademicYearId=typeof getCurrentAcademicYearId==='function'?getCurrentAcademicYearId:null;
})();

/* ===== END FINAL TARGETED PATCH ===== */

window.App = window.App || {};
window.App.analytics = {
  render:renderAnalytics,
  attendance:{render:buildAttendanceAnalyticsReport,filter:filterAttendance,export:exportAttendance}
};

if(typeof state!=='undefined' && state?.currentPage==='analytics') setTimeout(()=>renderAnalytics(),0);
