(() => {
  const SUPABASE_URL = "https://igxtfnoqjrykgntsftve.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2wiIxwtr6frhlkYSgoUPAw_T0dg6AAt";
  const SUPABASE_ADMIN_EMAIL = "druzhock@ya.ru";
  const SUPABASE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/admin-set-user-credentials`;
  const YANDEX_UPLOAD_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/yandex-disk-upload`;
  const YANDEX_FOLDERS = {
    security:"https://disk.yandex.ru/d/uV44vHHQeDnkdw",
    upbringing:"https://disk.yandex.ru/d/u7z5uV1QQuCEEQ",
    vseobuch:"https://disk.yandex.ru/d/O35JWAkiKSdmHQ",
    gia:"https://disk.yandex.ru/d/9r3qiQ5dxTnr6Q",
    ovz:"https://disk.yandex.ru/d/-NyUVQ77HmUPvA",
    attestation:"https://disk.yandex.ru/d/zs0EnJM-X0URxA",
    mydata:"https://disk.yandex.ru/d/7EkJDqDKSduDVg",
    transport:"https://disk.yandex.ru/d/e93HLmxwm2ecOg",
    career:"https://disk.yandex.ru/d/MT52nus5PgfJFw",
    psych:"https://disk.yandex.ru/d/Geci2NxJpfBgeQ",
    education:"https://disk.yandex.ru/d/AYLfigo9zJ9CmA",
    journal:"https://disk.yandex.ru/d/DA8UBHbPOmF2QQ",
    reports:"https://disk.yandex.ru/d/522hEgXqfaRQBg",
    olymp:"https://disk.yandex.ru/client/disk/SHKOLKA/Олимпиады",
    visitAnalysis:"https://disk.yandex.ru/client/disk/SHKOLKA/Посещение%20уроков"
  };
  const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const USERS = {guest:{login:"guest",password:"",name:"Гость",role:"Родитель / обучающийся",roleKey:"guest"}};


  const defaultState = {
    currentUser:null,
    tasks:[
      {id:"attendance",title:"Посещаемость",required:true,done:false,kind:"attendance"},
      {id:"food",title:"Питание",required:false,done:false,kind:"food"},
      {id:"journal",title:"Электронный журнал",required:false,done:false,kind:"journal"},
      {id:"schedule",title:"Расписание уроков",required:false,done:false,kind:"schedule"}
    ],
    transport:[],
    notifications:[],
    plan:[
      {id:1,date:"Сегодня",time:"14:00",title:"Оперативная работа педагогов",place:"Актовый зал",participants:"5–11 классы",responsible:"Елена Александровна",status:"Опубликовано",author:"Заместитель"},
      {id:2,date:"Завтра",time:"10:15",title:"Посещение урока",place:"Каб. 204",participants:"7Б",responsible:"Елена Александровна",status:"Опубликовано",author:"Заместитель"},
      {id:3,date:"Через 3 дня",time:"12:00",title:"Классный час 5А",place:"Каб. 205",participants:"5А",responsible:"",status:"На согласовании",author:"teacher"}
    ],
    attendance:[],
    journalOverdue:[],
    vacationsText:"Каникулы: сроки будут опубликованы администратором.",
    schedule:{
      entries:[],
      versions:[],
      uploadedFile:"",
      baseEntries:[],
      baseVersions:[],
      baseUploadedFile:"",
      bellMatrix:{
  shift1:{monday:[
    {n:0,start:"08:00",end:"08:30"},{n:1,start:"08:35",end:"09:15"},{n:2,start:"09:25",end:"10:05"},
    {n:3,start:"10:15",end:"10:55"},{n:4,start:"11:05",end:"11:45"},{n:5,start:"11:55",end:"12:35"},
    {n:6,start:"12:40",end:"13:20"},{n:7,start:"13:25",end:"14:05"}],
    weekdays:[
    {n:0,start:"",end:""},{n:1,start:"08:00",end:"08:40"},{n:2,start:"08:50",end:"09:30"},{n:3,start:"09:50",end:"10:30"},
    {n:4,start:"10:50",end:"11:30"},{n:5,start:"11:40",end:"12:20"},{n:6,start:"12:25",end:"13:05"},{n:7,start:"13:10",end:"13:50"}]},
  shift2Primary:{monday:[
    {n:0,start:"13:20",end:"13:50"},{n:1,start:"14:00",end:"14:40"},{n:2,start:"14:50",end:"15:30"},{n:3,start:"15:45",end:"16:25"},
    {n:4,start:"16:40",end:"17:20"},{n:5,start:"17:35",end:"18:15"},{n:6,start:"18:20",end:"19:00"},{n:7,start:"",end:""}],
    weekdays:[
    {n:0,start:"",end:""},{n:1,start:"13:10",end:"13:50"},{n:2,start:"14:05",end:"14:45"},{n:3,start:"15:00",end:"15:40"},
    {n:4,start:"15:55",end:"16:35"},{n:5,start:"16:50",end:"17:30"},{n:6,start:"17:35",end:"18:15"},{n:7,start:"18:20",end:"19:00"}]},
  shift2Grade6:{monday:[
    {n:0,start:"13:20",end:"13:50"},{n:1,start:"14:00",end:"14:40"},{n:2,start:"14:50",end:"15:30"},{n:3,start:"15:45",end:"16:25"},
    {n:4,start:"16:40",end:"17:20"},{n:5,start:"17:35",end:"18:15"},{n:6,start:"18:20",end:"19:00"},{n:7,start:"",end:""}],
    weekdays:[
    {n:0,start:"",end:""},{n:1,start:"14:05",end:"14:45"},{n:2,start:"15:00",end:"15:40"},{n:3,start:"15:55",end:"16:35"},
    {n:4,start:"16:50",end:"17:30"},{n:5,start:"17:35",end:"18:15"},{n:6,start:"18:20",end:"19:00"},{n:7,start:"",end:""}]}
},
      bellSchedules:{monday:[],weekdays:[]},
      bells:[
        {n:1,start:"08:30",end:"09:15"},{n:2,start:"09:25",end:"10:10"},{n:3,start:"10:30",end:"11:15"},
        {n:4,start:"11:25",end:"12:10"},{n:5,start:"12:30",end:"13:15"},{n:6,start:"13:25",end:"14:10"},{n:7,start:"14:20",end:"15:05"}
      ],
      today:[
        {lesson:1,time:"08:30",className:"5А",subject:"Биология",room:"204"},
        {lesson:2,time:"09:25",className:"6Б",subject:"Биология",room:"312"},
        {lesson:3,time:"10:30",className:"7А",subject:"Биология",room:"204"}
      ],
      classes:{
        "5А":[{lesson:1,time:"08:30",subject:"Русский язык",room:"201"},{lesson:2,time:"09:25",subject:"Математика",room:"201"}],
        "6Б":[{lesson:1,time:"08:30",subject:"История",room:"312"},{lesson:2,time:"09:25",subject:"Биология",room:"312"}]
      }
    },
    users:[],
    classRoster:[],
    dispatcherIds:[],

    adminBellTimes:true,
    myData:{},
    portfolio:{},
    transportSchedule:[],
    documents:[],
    dutySchedule:[
      {day:"Понедельник",name1:"Ирина Сергеевна",phone1:"+7 (000) 000-00-01",name2:"",phone2:""},
      {day:"Вторник",name1:"Елена Александровна",phone1:"+7 (000) 000-00-02",name2:"",phone2:""},
      {day:"Среда",name1:"",phone1:"",name2:"",phone2:""},
      {day:"Четверг",name1:"",phone1:"",name2:"",phone2:""},
      {day:"Пятница",name1:"",phone1:"",name2:"",phone2:""}
    ],
    responsibles:{}
  };

  const clone = obj => JSON.parse(JSON.stringify(obj));
  let state = loadState();

  function normalizeEmployeeName(row){
    const keys=["fio","full_name","fullName","name","ФИО","фио","ФИО сотрудника"];
    for(const k of keys){if(row?.[k])return String(row[k]).trim();}
    return [row?.last_name,row?.first_name,row?.middle_name,row?.фамилия,row?.имя,row?.отчество].filter(Boolean).join(" ").trim()||"Сотрудник";
  }
  function firstValue(row,keys){for(const k of keys){if(row?.[k]!=null&&String(row[k]).trim()!=="")return row[k];}return "";}
  function inferRoleKeys(row){
    const raw=String(firstValue(row,["system_role","systemRole","role","role_key","roleKey","системная_роль","системная роль"])||"").toLowerCase();
    const keys=[]; const map=[["admin","admin"],["администратор","admin"],["director","director"],["директор","director"],["deputy","deputy"],["заместитель","deputy"],["teacher","teacher"],["учитель","teacher"],["dispatcher","dispatcher"],["диспетчер","dispatcher"],["secretary","secretary"],["секретарь","secretary"]];
    map.forEach(([a,b])=>{if(raw.includes(a)&&!keys.includes(b))keys.push(b);}); return keys.length?keys:["teacher"];
  }
  async function sbRest(table,query="select=*"){
    const {data:{session}}=await supabase.auth.getSession(); if(!session)throw new Error("Нет активной сессии Supabase.");
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`}});
    if(!r.ok)throw new Error(`${table}: HTTP ${r.status}`); return r.json();
  }
  async function getCurrentAcademicYearId(){
    try{
      const rows=await sbRest("academic_years");
      const exact=(rows||[]).find(r=>Object.values(r||{}).some(v=>String(v??"").trim()==="2026-2027"));
      if(exact?.id!=null)return exact.id;
      const fuzzy=(rows||[]).find(r=>Object.values(r||{}).some(v=>String(v??"").includes("2026-2027")));
      return fuzzy?.id??"";
    }catch(e){
      console.warn("Не удалось определить текущий учебный год:",e);
      return "";
    }
  }
  function classNameFromRow(r){
    const explicit=String(firstValue(r,["name","class_name","className","название","класс"])||"").trim();
    if(explicit)return explicit;
    const grade=firstValue(r,["grade","класс_ступень"]);
    const letter=firstValue(r,["letter","буква"]);
    if(grade!=null && letter!=null && String(grade).trim()!=="" && String(letter).trim()!=="")return `${grade}${String(letter).trim()}`;
    return "";
  }
  async function loadClassRoster(){
    try{
      const rows=await sbRest("classes");
      const currentYearId=await getCurrentAcademicYearId();
      const local=state.classRoster||[];
      const localByName=Object.fromEntries(local.map(x=>[String(x.name),x]));
      const filtered=(rows||[]).filter(r=>r.is_active!==false && (!currentYearId || String(r.academic_year_id??r.academicYearId??"")===String(currentYearId)));
      state.classRoster=filtered.map(r=>{
        const name=classNameFromRow(r);
        const prev=localByName[name]||{};
        return {
          id:r.id,
          name,
          studentCount:+(prev.studentCount ?? (firstValue(r,["student_count","studentCount","students_count","students"]) || 0)),
          shift:+(prev.shift ?? (firstValue(r,["shift","смена"]) || 0)),
          academicYearId:firstValue(r,["academic_year_id","academicYearId"])||currentYearId||""
        };
      }).filter(r=>r.name);
      if(state.classRoster.length)save();
      return state.classRoster;
    }catch(e){
      console.warn("Не удалось загрузить классы:",e);
      state.classRoster=state.classRoster||[];
      return state.classRoster;
    }
  }
  function classRosterForUser(u){
    const all=state.classRoster||[];
    if(["admin","director","deputy"].some(r=>u?.roleKeys?.includes(r)))return all.slice().sort((a,b)=>classSort(a.name,b.name));
    const names=[...(u?.attendanceClasses||[]),...(u?.classes||[]),...(u?.replacement||[])].filter(Boolean).map(String);
    return all.filter(r=>names.includes(r.name)).sort((a,b)=>classSort(a.name,b.name));
  }
  async function loadRealEmployees(authUser){
    try{
      const rows=await sbRest("employees");
      await loadClassRoster();
      let accounts=[],roles=[],userRoles=[],classLeaders=[];
      try{accounts=await sbRest("employee_accounts");}catch(e){console.warn(e);}
      try{classLeaders=await sbRest("class_leaders");}catch(e){console.warn(e);}
      try{roles=await sbRest("roles");}catch(e){console.warn(e);}
      try{userRoles=await sbRest("user_roles");}catch(e){console.warn(e);}

      const roleById={};
      roles.forEach(r=>{
        const id=r.id??r.role_id??r.code;
        if(id!=null)roleById[String(id)]=String(r.code??r.key??r.name??r.role_code??"").toLowerCase();
      });

      const accByEmp={};
      accounts.forEach(a=>{if(a.employee_id!=null)accByEmp[String(a.employee_id)]=a;});

      const accByAuth={};
      accounts.forEach(a=>{
        const aid=a.auth_user_id??a.user_id;
        if(aid)accByAuth[String(aid)]=a;
      });

      const leaderClassesByEmp={};
      (classLeaders||[]).forEach(cl=>{
        const emp=cl.employee_id??cl.employeeId??cl.emp_id;
        let cn=String(firstValue(cl,["class_name","className","name","класс"])||"").trim();
        const classId=cl.class_id??cl.classId;
        if(!cn&&classId!=null){
          const rr=(state.classRoster||[]).find(x=>String(x.id)===String(classId));
          cn=rr?.name||"";
        }
        if(emp!=null&&cn)(leaderClassesByEmp[String(emp)]??=[]).push(cn);
      });

      const rolesByAuth={};
      userRoles.forEach(ur=>{
        const vals=Object.values(ur).map(String),auth=vals.find(v=>v===authUser.id);
        if(!auth)return;
        const rid=ur.role_id??ur.roleId??ur.roles_id;
        const code=roleById[String(rid)]??String(ur.role_code??ur.code??ur.role??"").toLowerCase();
        if(code)(rolesByAuth[auth]??=[]).push(code);
      });

      const normalizeRoles=(raw)=>{
        const mapped=(raw||[]).map(k=>{
          const x=String(k).toLowerCase();
          return x.includes("admin")?"admin":x.includes("director")?"director":x.includes("deputy")?"deputy":x.includes("dispatcher")?"dispatcher":x.includes("secretary")?"secretary":"teacher";
        });
        const clean=[...new Set(mapped)].filter(Boolean);
        return clean.length?clean:["teacher"];
      };

      state.users=rows.map((row,i)=>{
        const id=row.id??row.employee_id??i+1,acc=accByEmp[String(id)]||{},authId=acc.auth_user_id??acc.user_id;
        let roleKeys=authId&&rolesByAuth[authId]?normalizeRoles(rolesByAuth[authId]):inferRoleKeys(row);
        if(authId===authUser.id && authUser.id==="452539e6-f627-4767-bcf6-a22a10c0c997")roleKeys=["admin"];
        const email=firstValue(row,["email","mail","Эл. почта","электронная_почта"]);
        const login=firstValue(acc,["login","username","логин"])||firstValue(row,["login","username","логин"])||(authId===authUser.id?"admin":email||`employee_${id}`);
        const leaderClasses=[...(leaderClassesByEmp[String(id)]||[])];
        return {id,name:normalizeEmployeeName(row),login,roleKeys,roles:rolesText(roleKeys),classes:leaderClasses,shift:{},attendanceClasses:leaderClasses.slice(),replacement:[],email,phone:firstValue(row,["phone","telephone","Телефон"]),qualification:firstValue(row,["qualification","Квалификация"]),dbRow:row,authUserId:authId};
      });

      const metadataEmployeeId=authUser?.user_metadata?.employee_id;
      const metadataLogin=String(authUser?.user_metadata?.login||"").trim();
      const metadataName=String(authUser?.user_metadata?.name||"").trim();
      const ownAcc=accByAuth[authUser.id]||null;
      const targetId=metadataEmployeeId!=null?String(metadataEmployeeId):String(ownAcc?.employee_id??"");
      let me=null;

      // Normal case: the employee row is visible through RLS.
      if(targetId)me=state.users.find(u=>String(u.id)===targetId)||null;
      if(!me)me=state.users.find(u=>u.authUserId===authUser.id)||null;
      if(!me&&metadataLogin)me=state.users.find(u=>String(u.login).toLowerCase()===metadataLogin.toLowerCase())||null;
      if(!me&&authUser.email){
        const email=String(authUser.email).toLowerCase();
        me=state.users.find(u=>String(u.email||"").toLowerCase()===email)||null;
      }

      // Fallback for a teacher whose employees row is hidden by RLS.
      // We already have the verified employee_id/login/name in Auth user_metadata.
      if(!me && targetId){
        const roleKeys=authUser.id==="452539e6-f627-4767-bcf6-a22a10c0c997"?["admin"]:normalizeRoles(rolesByAuth[authUser.id]);
        const leaderClasses=[...(leaderClassesByEmp[targetId]||[])];
        me={
          id:Number(targetId),
          name:metadataName||"Сотрудник",
          login:metadataLogin||ownAcc?.login||String(authUser.email||"").split("@")[0],
          roleKeys,
          roles:rolesText(roleKeys),
          classes:leaderClasses,
          shift:{},
          attendanceClasses:leaderClasses.slice(),
          replacement:[],
          email:authUser.email||"",
          phone:"",
          qualification:"",
          dbRow:null,
          authUserId:authUser.id
        };
      }

      if(!me){
        const hint=metadataEmployeeId!=null?` employee_id=${metadataEmployeeId}`:"";
        throw new Error(`В таблице employees не найден сотрудник, связанный с текущей учётной записью.${hint}`);
      }

      const effectiveLogin=metadataLogin||me.login||ownAcc?.login||String(authUser.email||"").split("@")[0];
      state.currentUser={...me,login:effectiveLogin,name:me.name||metadataName||"Пользователь"};
      state.realEmployeesLoaded=true;
      save();
      return true;
    }catch(e){
      console.error(e);
      state.realEmployeesError=e.message||String(e);
      return false;
    }
  }
  function yandexFolderForPage(page){return YANDEX_FOLDERS[page]||"";}
  async function sbMutate(table,method,query,body){
    const {data:{session}}=await supabase.auth.getSession();
    if(!session)throw new Error("Нет активной сессии Supabase.");
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}${query?`?${query}`:""}`,{
      method,
      headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json",Prefer:"return=representation"},
      body:body==null?undefined:JSON.stringify(body)
    });
    if(!r.ok)throw new Error(`${table}: HTTP ${r.status} ${await r.text()}`);
    return await r.json().catch(()=>[]);
  }
  async function loadAppSettingsFromSupabase(){
    try{
      const rows=await sbRest("app_settings","select=key,value"); const by={};(rows||[]).forEach(r=>by[String(r.key)]=r.value);
      if(by.responsibles)state.responsibles=by.responsibles;
      if(by.dutySchedule)state.dutySchedule=by.dutySchedule;
      if(by.vacationsText!=null)state.vacationsText=String(by.vacationsText);
      if(by.bellMatrix){state.schedule.bellMatrix=by.bellMatrix;state.schedule.bellSchedules={monday:by.bellMatrix.shift1?.monday||[],weekdays:by.bellMatrix.shift1?.weekdays||[]};state.schedule.bells=by.bellMatrix.shift1?.weekdays||[];}
      if(Array.isArray(by.dispatcherIds))state.dispatcherIds=by.dispatcherIds.map(Number);
      if(by.transportSchedule)state.transportSchedule=by.transportSchedule;
    }catch(e){console.warn("Не удалось загрузить постоянные настройки:",e);}
  }
  async function saveAppSetting(key,value){
    const payload={key,value,updated_at:new Date().toISOString()};
    try{
      const updated=await sbMutate("app_settings","PATCH",`key=eq.${encodeURIComponent(key)}`,{value,updated_at:payload.updated_at});
      if(Array.isArray(updated)&&updated.length)return true;
      const inserted=await sbMutate("app_settings","POST","",payload);
      return Array.isArray(inserted)&&inserted.length>0;
    }catch(e){
      console.warn("Не удалось сохранить настройку",key,e);
      return false;
    }
  }
  async function loadUserAssignments(){
    try{
      const rows=isAdmin()?await sbRest("user_assignments","select=*"):await sbRest("user_assignments","select=*&employee_id=eq."+encodeURIComponent(state.currentUser?.id));
      const by={};(rows||[]).forEach(r=>by[String(r.employee_id)]=r);
      (state.users||[]).forEach(u=>{const r=by[String(u.id)];if(!r)return;u.attendanceClasses=Array.isArray(r.attendance_classes)?r.attendance_classes:[];u.replacement=Array.isArray(r.replacement_classes)?r.replacement_classes:[];u.shift=r.shift||{};});
    }catch(e){console.warn("Не удалось загрузить назначения пользователей:",e);}
  }
  async function saveUserAssignments(u){
    const payload={employee_id:Number(u.id),attendance_classes:u.attendanceClasses||[],replacement_classes:u.replacement||[],shift:u.shift||{},updated_at:new Date().toISOString()};
    try{const updated=await sbMutate("user_assignments","PATCH",`employee_id=eq.${encodeURIComponent(Number(u.id))}`,{attendance_classes:payload.attendance_classes,replacement_classes:payload.replacement_classes,shift:payload.shift,updated_at:payload.updated_at});if(Array.isArray(updated)&&updated.length)return true;await sbMutate("user_assignments","POST","",payload);return true;}catch(e){console.warn("Не удалось сохранить назначения",u.id,e);return false;}
  }
  async function syncClassLeadersForUser(u){
    try{
      const yearId=await getCurrentAcademicYearId();
      const wanted=(u.classes||[]).map(normalizeClass).filter(Boolean);
      const ids=(state.classRoster||[]).filter(r=>wanted.includes(normalizeClass(r.name))).map(r=>Number(r.id));
      await sbMutate("class_leaders","DELETE",`employee_id=eq.${encodeURIComponent(u.id)}`);
      for(const classId of ids)await sbMutate("class_leaders","POST","",{employee_id:Number(u.id),class_id:classId,academic_year_id:yearId||null});
      return true;
    }catch(e){console.warn("Не удалось сохранить классное руководство:",e);return false;}
  }
  async function loadDocumentsFromSupabase(){
    try{
      const docs=await sbRest("document_records","select=*&order=uploaded_at.desc");
      const acks=await sbRest("document_ack","select=document_id,employee_id,ack_at");
      const loginByEmp={};(state.users||[]).forEach(u=>loginByEmp[String(u.id)]=u.login);
      const ackMap={};(acks||[]).forEach(a=>(ackMap[a.document_id]??={})[loginByEmp[String(a.employee_id)]||String(a.employee_id)]={at:a.ack_at});
      const serverDocs=(docs||[]).map(d=>({id:Number(d.id),sectionKey:d.section_key,title:d.title,fileName:d.file_name,data:"",url:d.storage_url||"",storagePath:d.storage_path||"",uploadedBy:d.uploaded_by,uploadedByName:d.uploaded_by_name,uploadedAt:d.uploaded_at,targetType:d.target_type,targetUsers:d.target_users||[],targetAll:!!d.target_all,targetClassLeaderAll:!!d.target_class_leader_all,targetClassLeaderParallels:d.target_class_leader_parallels||[],targetEmployeeIds:d.target_employee_ids||[],readBy:ackMap[d.id]||{}}));
      const serverIds=new Set(serverDocs.map(d=>String(d.id)));
      const localOnly=(state.documents||[]).filter(d=>!serverIds.has(String(d.id)));
      state.documents=[...serverDocs,...localOnly];
      save();
    }catch(e){console.warn("Документы Supabase пока недоступны:",e);}
  }
  async function uploadToYandexFolder(file,folderUrl,page,title){
    const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error("Сессия завершена. Войдите заново.");
    const form=new FormData();form.append("file",file);form.append("folderPublicUrl",folderUrl);form.append("page",page);form.append("title",title);form.append("fileName",file.name);
    const r=await fetch(YANDEX_UPLOAD_FUNCTION_URL,{method:"POST",headers:{Authorization:`Bearer ${session.access_token}`,apikey:SUPABASE_PUBLISHABLE_KEY},body:form});
    const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||`Ошибка загрузки на Яндекс Диск: ${r.status}`);return p;
  }
  async function saveDocumentRecord(record){return await sbMutate("document_records","POST","",record);}
  async function acknowledgeDocumentRecord(id){
    const employeeId=Number(state.currentUser.id),now=new Date().toISOString();
    try{
      const updated=await sbMutate("document_ack","PATCH",`document_id=eq.${encodeURIComponent(id)}&employee_id=eq.${encodeURIComponent(employeeId)}`,{ack_at:now});
      if(Array.isArray(updated)&&updated.length)return updated[0];
    }catch(_e){}
    const inserted=await sbMutate("document_ack","POST","",{document_id:Number(id),employee_id:employeeId,ack_at:now});
    return Array.isArray(inserted)?inserted[0]:inserted;
  }
  function loadState(){
    try{
      const saved=localStorage.getItem("schoolSolutionsMVP_v4");
      const result=saved ? deepMerge(clone(defaultState),JSON.parse(saved)) : clone(defaultState);
      result.users=result.users||[];
      result.classRoster=result.classRoster||[];
      result.users=result.users.filter(u=>u.login!=="secretary");
      result.notifications=(result.notifications||[]).filter(n=>!(n.id===1||n.id===2||/Подготовить сведения к оперативному совещанию|К вам завтра придут на урок/.test(String(n.text||"")+" "+String(n.title||""))));
      result.transport=(result.transport||[]).filter(t=>!(t.id===1||/утренний рейс отправится на 15 минут позже/.test(String(t.text||""))));
      result.users.forEach(u=>{u.roleKeys=u.roleKeys||["teacher"];u.roles=u.roles||rolesText(u.roleKeys);});
      result.responsibles=result.responsibles||{};result.responsibles.transport=result.responsibles.transport||"";
      result.dutySchedule=(result.dutySchedule||[]).map(x=>({day:x.day,name1:x.name1||x.name||"",phone1:x.phone1||x.phone||"",name2:x.name2||"",phone2:x.phone2||""}));
      result.transportSchedule=result.transportSchedule||[];
      result.schedule=result.schedule||{entries:[],versions:[],uploadedFile:""};
      result.schedule.entries=result.schedule.entries||[];result.schedule.versions=result.schedule.versions||[];result.schedule.baseEntries=result.schedule.baseEntries||[];result.schedule.baseVersions=result.schedule.baseVersions||[];
      return result;
    }catch(e){return clone(defaultState);}
  }
  function deepMerge(a,b){Object.keys(b||{}).forEach(k=>{if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&a[k]) a[k]=deepMerge(a[k],b[k]); else a[k]=b[k];});return a;}
  function save(){localStorage.setItem("schoolSolutionsMVP_v4",JSON.stringify(state));}
  function dateIsoLocal(d){const x=d instanceof Date?d:new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;}
  function dateInfo(){const d=new Date(),days=["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"],months=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;return {day:days[d.getDay()],full:`${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,iso};}
  function nextSchoolDay(base=new Date()){const d=new Date(base);d.setHours(12,0,0,0);do{d.setDate(d.getDate()+1);}while(d.getDay()===0||d.getDay()===6);return d;}
  function formatRuDate(d){return d.toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"});}
  function ensureBellMatrix(){
    const bm=state.schedule.bellMatrix||null;
    if(bm)return bm;
    const oldM=state.schedule.bellSchedules?.monday||[];
    const oldW=state.schedule.bellSchedules?.weekdays||[];
    const cloneB=a=>(a||[]).map(x=>({n:+x.n||0,start:x.start||"",end:x.end||""}));
    state.schedule.bellMatrix={
      shift1:{monday:cloneB(oldM),weekdays:cloneB(oldW)},
      shift2Primary:{monday:cloneB(oldM),weekdays:cloneB(oldW)},
      shift2Grade6:{monday:cloneB(oldM),weekdays:cloneB(oldW)}
    };
    return state.schedule.bellMatrix;
  }
  function bellCell(arr,n){
    const b=(arr||[]).find(x=>+x.n===n);
    return b&&(b.start||b.end)?`${escapeHtml(b.start)}${b.end?" — "+escapeHtml(b.end):""}`:"";
  }
  function renderBellMatrixTable(editable=false){
    const bm=ensureBellMatrix();
    const groups=[
      ["I смена","shift1"],
      ["II смена (начальные классы, 7, 8 классы)","shift2Primary"],
      ["II смена 6 классы","shift2Grade6"]
    ];
    const head=`<table class="bell-matrix ${editable?"bell-matrix-edit":"defer"}"><thead><tr>
      <th rowspan="2">урок</th>${groups.map(g=>`<th colspan="2">${g[0]}</th>`).join("")}
      </tr><tr>${groups.map(()=>`<th>понедельник</th><th>вторник-пятница</th>`).join("")}</tr></thead><tbody>`;
    let body="";
    for(let n=0;n<=7;n++){
      body+=`<tr><th>${n}</th>`;
      groups.forEach(([_,key])=>{
        ["monday","weekdays"].forEach(day=>{
          const b=(bm[key]?.[day]||[]).find(x=>+x.n===n)||{};
          if(!editable){
            body+=`<td>${b.start?`${escapeHtml(b.start)}${b.end?" - "+escapeHtml(b.end):""}`:""}</td>`;
          }else{
            body+=`<td><input class="bell-time" data-bell-key="${key}" data-bell-day="${day}" data-bell-n="${n}" data-part="start" type="time" value="${escapeHtml(b.start||"")}"><span> — </span><input class="bell-time" data-bell-key="${key}" data-bell-day="${day}" data-bell-n="${n}" data-part="end" type="time" value="${escapeHtml(b.end||"")}"></td>`;
          }
        });
      });
      body+="</tr>";
    }
    return head+body+"</tbody></table>";
  }
  function roleLabel(k){return USERS[k]?.role||"Пользователь";}
  function initials(name){return name.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();}
  function isManager(){return ["admin","director","deputy"].some(r=>state.currentUser?.roleKeys?.includes(r));}
  function isAdmin(){return state.currentUser?.roleKeys?.includes("admin");}
  function isSecretary(){return state.currentUser?.roleKeys?.includes("secretary");}
  function isDispatcher(){return isAdmin()||state.currentUser?.roleKeys?.includes("dispatcher")||state.dispatcherIds.includes(state.currentUser?.id);}
  function canManageOrders(){return ["admin","director","deputy"].some(r=>state.currentUser?.roleKeys?.includes(r))||isSecretary();}
  function isGuest(){return state.currentUser?.roleKeys?.includes("guest");}
  function roleName(k){return ({admin:"Администратор",director:"Директор",deputy:"Заместитель директора",teacher:"Учитель",dispatcher:"Диспетчер",secretary:"Секретарь",guest:"Родитель / обучающийся"}[k]||k);}
  function rolesText(keys){return (keys||[]).map(roleName).join(" + ");}

  function unread(){return state.notifications.filter(n=>!n.read).length;}
  function pendingTasks(){return state.tasks.filter(t=>t.required&&!t.done).length;}
  function newTransport(){return state.transport.filter(t=>!t.read).length;}
  function unreadOrderCounts(){
    const counts={};
    (state.documents||[]).forEach(d=>{
      const title=String(d.sectionKey||"").split("::")[1]||"";
      if(!title.includes("Приказы"))return;
      const page=String(d.sectionKey||"").split("::")[0];
      if(!userCanSeeDoc(d))return;
      if((d.readBy||{})[state.currentUser?.login])return;
      counts[page]=(counts[page]||0)+1;
    });
    return counts;
  }
  function updateBadges(){
    const p=pendingTasks(),n=unread(),tr=newTransport(),orders=unreadOrderCounts();
    const tb=document.getElementById("taskBadge"),nb=document.getElementById("notificationBadge"),tnb=document.getElementById("topNotifyBadge"),trb=document.getElementById("transportBadge");
    if(tb){tb.textContent=p?"!":"✓";tb.style.background=p?"var(--red)":"var(--green-700)";}
    if(nb){nb.textContent=n;nb.classList.toggle("hidden",!n);}
    if(tnb){tnb.textContent=n;tnb.classList.toggle("hidden",!n);}
    if(trb){trb.textContent=tr;trb.classList.toggle("hidden",!tr);}
    document.querySelectorAll(".order-badge").forEach(el=>{
      const page=el.id.replace("orderBadge_","");
      const count=orders[page]||0;
      el.textContent=count;
      el.style.display=count?"inline-flex":"none";
    });
  }
  function render(){
    const d=dateInfo();
    document.getElementById("sideDate").textContent=`${d.day}, ${d.full}`;
    document.getElementById("profileName").textContent=state.currentUser.name;
    document.getElementById("profileRole").textContent=state.currentUser.roles||state.currentUser.role||"Пользователь";
    document.getElementById("avatar").textContent=initials(state.currentUser.name);
    updateBadges();
    document.querySelectorAll(".nav-item").forEach(b=>{
      const guestAllowedNav=["home","transport","schedule","vseobuch","education","journal","ovz","olymp","gia"];
      b.classList.toggle("active",b.dataset.page===state.currentPage);
      b.classList.toggle("guest-hidden",isGuest()&&!guestAllowedNav.includes(b.dataset.page));
    });
    const pages={home:renderHome,tasks:renderTasks,attendance:renderAttendance,transport:renderTransport,plan:renderPlan,notifications:renderNotifications,
      vseobuch:renderPlaceholder,education:renderPlaceholder,journal:renderPlaceholder,upbringing:renderPlaceholder,ovz:renderPlaceholder,olymp:renderPlaceholder,
      gia:renderPlaceholder,attestation:renderPlaceholder,career:renderPlaceholder,psych:renderPlaceholder,security:renderPlaceholder,reports:renderPlaceholder,archive:renderPlaceholder,analytics:()=>window.renderAnalytics(),
      mydata:renderMyData,settings:renderSettings,admin:renderAdmin,schedule:renderSchedule};
    pages[state.currentPage]?.();
  }
  function shell(title,subtitle,body){document.getElementById("content").innerHTML=`<div class="section-title"><div><h2>${title}</h2><div class="muted">${subtitle||""}</div></div></div>${body}`;}
  function taskHtml(t){
    if(t.kind==="food") return `<div class="task"><span style="font-size:18px">🍽️</span><span>${t.title}</span><a class="task-link" href="${state.foodUrl||'https://www.avangard.ru/SchoolFeedingJournal/login.xhtml'}" target="_blank" rel="noopener">Открыть ↗</a></div>`;
    if(t.kind==="journal"){
      const overdue=state.journalOverdue.filter(x=>x.login===state.currentUser.login).reduce((s,x)=>s+x.count,0);
      return `<div class="task"><span style="font-size:18px">📘</span><span>${t.title}</span>${overdue?`<span class="required">⚠ Просрочено: ${overdue} стр.</span>`:""}<a class="task-link" href="${state.journalUrl||'https://de.edu.orb.ru/#journals'}" target="_blank" rel="noopener">Открыть ↗</a></div>`;
    }
    if(t.kind==="schedule") return `<div class="task"><span style="font-size:18px">🕒</span><span>${t.title}</span><a class="task-link" href="#" onclick="event.preventDefault();navigate('schedule')">Просмотреть →</a></div>`;
    return `<div class="task ${t.done?'done':''}"><input type="checkbox" class="auto-check" ${t.done?'checked':''} disabled><span>${t.title}</span><a class="task-link" href="#" onclick="event.preventDefault();navigate('attendance')">Заполнить →</a></div>`;
  }
  function noticeHtml(n){return `<div class="notice ${n.read?'':'unread'}" onclick="readNotification(${n.id})"><div class="dot"></div><div><strong>${n.title}</strong>${n.read?'':' <span class="unread-marker">• новое</span>'}<p>${n.text}</p><small class="muted">${n.date}</small></div></div>`;}
  function givenNamePatronymic(name){
    const p=String(name||"").trim().split(/\s+/).filter(Boolean);
    return p.length>=3?p.slice(1,3).join(" "):p.length>=2?p.slice(1).join(" "):p[0]||"";
  }
  function renderHome(){
    const d=dateInfo();
    const bell=(d.day==="понедельник"?state.schedule.bellSchedules?.monday:state.schedule.bellSchedules?.weekdays)||state.schedule.bells||[];
    const dutyRows=state.dutySchedule.map(x=>`<tr><td>${escapeHtml(x.day)}</td><td>${escapeHtml(x.name1||"—")}</td><td>${escapeHtml(x.phone1||"—")}</td><td>${escapeHtml(x.name2||"—")}</td><td>${escapeHtml(x.phone2||"—")}</td></tr>`).join("");
    document.getElementById("content").innerHTML=`<div class="hero"><div><h1>Добро пожаловать, ${escapeHtml(givenNamePatronymic(state.currentUser.name))}!</h1><p>Ваш рабочий кабинет в виртуальной учительской.</p></div><div class="hero-date">${d.day}<span>${d.full}</span></div></div>
      <div class="home-layout">
        <div class="home-main">
          <div class="home-top-row">
            <section class="card home-equal-card"><h3>✅ Текущие задачи</h3><div class="muted">На сегодня</div><div style="margin-top:10px">${state.tasks.filter(t=>t.kind!=="schedule").map(taskHtml).join("")}</div>${pendingTasks()?`<div class="muted" style="margin-top:10px;color:var(--red);font-weight:700">❗ Есть обязательная задача, требующая выполнения.</div>`:""}</section>
            <section class="card home-equal-card"><h3>🔔 Уведомления</h3>${state.notifications.slice(0,5).map(noticeHtml).join("")||'<div class="empty">Нет уведомлений.</div>'}<button class="btn" style="margin-top:10px" onclick="navigate('notifications')">Все уведомления →</button></section>
          </div>
        </div>
        <aside class="home-right">
          <section class="card"><h3>👮 Дежурство администрации</h3><div class="table-wrap"><table class="data-table duty-table"><tr><th>День</th><th>ФИО 1</th><th>Телефон</th><th>ФИО 2</th><th>Телефон</th></tr>${dutyRows}</table></div></section>
          <section class="card"><h3>🕘 Расписание звонков</h3><div class="table-wrap">${renderBellMatrixTable(false)}</div></section>
        </aside>
      </div>`;
  }
  function renderTasks(){
    shell("Текущие задачи","Питание и электронный журнал открываются на внешних ресурсах; расписание доступно только для просмотра.",
      `<div class="card" style="max-width:950px">${state.tasks.map(taskHtml).join("")}<div style="margin-top:15px"><button class="btn green" onclick="navigate('attendance')">Открыть форму посещаемости</button></div></div>`);
  }
  function renderAttendance(){
    const roster=classRosterForUser(state.currentUser);
    const availableClasses=roster.map(r=>r.name);
    const cls=availableClasses[0]||"";
    const firstTotal=(roster.find(r=>r.name===cls)?.studentCount||0);
    shell("Посещаемость","Компактная форма ежедневного учета.",
      `<div class="card form-card compact-form-card compact-attendance">
      <div class="attendance-row">
        <div class="field"><label>Класс</label><select id="attClass" ${availableClasses.length===1?'class="readonly"':''} onchange="recalcAttendance()">${availableClasses.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}</select>${availableClasses.length===0?'<small class="muted">Нет доступных классов. Администратор должен загрузить таблицу классов.</small>':(["admin","director","deputy"].some(r=>state.currentUser?.roleKeys?.includes(r))?'<small class="muted">Для администрации доступны все классы.</small>':'')}</div>
        <div class="field"><label>Количество обучающихся</label><input id="attTotal" class="readonly" value="${firstTotal}" readonly></div>
        <div class="field"><label>Количество надомников</label><input id="attHome" type="number" min="0" value="0" oninput="recalcAttendance()"></div>
        <div class="field"><label>Количество присутствующих</label><input id="attPresent" class="readonly" value="${firstTotal}" readonly></div>
      </div>
      <div class="attendance-row three">
        <div class="field"><label>Отстранены на утреннем фильтре по причине заболевания</label><input id="attFiltered" type="number" min="0" value="0" oninput="recalcAttendance()"></div>
        <div class="field"><label>Количество детей на дистанте по заявлению родителей</label><input id="attRemote" type="number" min="0" value="0" oninput="recalcAttendance()"></div>
        <div class="field"><label>Количество питающихся</label><input id="attFood" type="number" min="0" value="0"></div>
      </div>
      <div class="present-box" id="attSummary">Присутствуют: ${firstTotal} · Не явились: 0</div>
      <div class="reason-band">Количество детей, неявившихся по причине:</div>
      <div class="section-band">Заболевания</div>
      <div class="attendance-row six">
        ${attField("Грипп","flu")}${attField("ОРВИ","orvi")}${attField("ОРЗ","orz")}${attField("Острокишечные заболевания","intestinal")}${attField("Энтеровирусная инфекция","enterovirus")}${attField("Ветряная оспа","chickenpox")}
      </div>
      <div class="attendance-row"><div class="field"><label>Семейные обстоятельства</label><input class="att-input reason" data-key="family" type="number" min="0" value="0" oninput="recalcAttendance()"></div></div>
      <div class="section-band">Прочие заболевания — всего: <span id="otherTotal">0</span></div>
      <div class="attendance-row six">
        ${attField("Пневмония","pneumonia","other")}${attField("Травмы","trauma","other")}${attField("Зубная боль","toothache","other")}${attField("ЖКТ","gi","other")}${attField("Аллергия","allergy","other")}${attField("Другое","other","other")}
      </div>
      <div class="section-band">Другие причины</div>
      <div class="attendance-row three">${attField("Выезды на конкурсы, соревнования, лагерь","events")}${attField("Без уважительной причины","noReason")}${attField("Погодные условия","weather")}</div>
      <div id="attValidation"></div>
      <div class="toolbar" style="justify-content:flex-end;margin-top:12px"><button class="btn green" onclick="submitAttendance()">Отправить посещаемость</button></div>
      </div>`);
    recalcAttendance();
    document.getElementById("attClass")?.addEventListener("change",()=>{const c=document.getElementById("attClass")?.value||"";const total=(state.classRoster||[]).find(r=>r.name===c)?.studentCount||0;if(document.getElementById("attTotal"))document.getElementById("attTotal").value=total;if(document.getElementById("attPresent"))document.getElementById("attPresent").value=total;recalcAttendance();});
  }
  function attField(label,id,cls="reason"){return `<div class="field"><label>${label}</label><input class="att-input ${cls}" data-key="${id}" type="number" min="0" value="0" oninput="recalcAttendance()"></div>`;}
  function renderTransport(){
    const can=isManager();
    const rows=state.transportSchedule||[];
    const responsible=state.responsibles?.transport||"";
    const responsibleBlock=`<div class="responsible-line"><b>Ответственный за направление:</b><span>${escapeHtml(responsible||"не назначен")}</span>${(isAdmin()||state.currentUser?.roleKeys?.includes("director"))?`<button class="small-btn" onclick="setResponsible('transport')">Изменить</button>`:""}</div>`;
    shell("Подвоз",responsibleBlock+"Оперативная информация и расписание подвоза.",
      `<div class="transport-layout">
        <div class="card"><h3>💬 Сообщения</h3>
          ${can?`<div class="doc-upload transport-message-form"><label>Заголовок</label><input id="transportTitle" placeholder="Например: Изменение маршрута №3"><label>Текст сообщения</label><textarea id="transportText" placeholder="Введите текст сообщения"></textarea><button class="btn green" onclick="submitTransportMessage()">Подтвердить отправку сообщения</button></div>`:""}
          ${state.transport.map(t=>`<div class="transport" style="border-left-color:${t.level==='important'?'var(--red)':'var(--yellow)'}"><strong>${escapeHtml(t.title)}${t.read?'':' · новое'}</strong><p>${escapeHtml(t.text)}</p><small class="muted">${escapeHtml(t.date||"")}</small></div>`).join("")||'<div class="empty">Сообщений пока нет.</div>'}
          <div style="margin-top:16px"><div class="module-card" onclick="openDocs('transport','Списки на подвоз')"><div class="module-card-title">Списки на подвоз</div><div class="muted">Документы и списки обучающихся, использующих школьный подвоз.</div><div class="module-folder">📂 Открыть папку →</div></div></div>
        </div>
        <div class="card"><h3>🚌 Расписание подвоза</h3>
          ${rows.length?`<div class="table-wrap"><table class="data-table transport-schedule-table"><tr><th>Маршрут</th><th>Время</th><th>Направление</th></tr>${rows.map(x=>`<tr><td>${escapeHtml(x.route)}</td><td>${escapeHtml(x.time)}</td><td>${escapeHtml(x.direction)}</td></tr>`).join("")}</table></div>`:'<div class="empty">Расписание подвоза пока не загружено.</div>'}
        </div>
      </div>`);
  }
  function renderPlan(){
    const canEdit=isManager(), teacherAdd=!isGuest();
    shell("План работы","Общий план формируют заместители. Учитель может предложить мероприятие для своего класса.",
      `<div class="card"><div class="toolbar">${teacherAdd?`<button class="btn green" onclick="addPlan()">＋ Добавить мероприятие</button>`:""}${canEdit?`<span class="chip">Режим редактирования заместителя/директора</span>`:""}</div>
      <div class="table-wrap"><table class="data-table"><tr><th>Дата</th><th>Время</th><th>Мероприятие</th><th>Место</th><th>Участники</th><th>Ответственный</th><th>Статус</th><th>Действия</th></tr>
      ${state.plan.map(x=>`<tr><td>${x.date}</td><td>${x.time}</td><td>${x.title}</td><td>${x.place}</td><td>${x.participants}</td><td>${x.responsible||"—"}</td><td><span class="chip">${x.status}</span></td><td>${canEdit?`<div class="icon-actions">${x.status==="На согласовании"?`<button class="small-btn" onclick="publishPlan(${x.id})">Опубликовать</button>`:""}<button class="small-btn" onclick="editPlan(${x.id})">Изменить</button><button class="small-btn danger" onclick="deletePlan(${x.id})">Удалить</button></div>`:"—"}</td></tr>`).join("")}</table></div></div>`);
  }
  function renderSchedule(){
    const canDispatch=isDispatcher();
    if(isGuest()){renderGuestSchedulePage();return;}
    const d=dateInfo(), tomorrow=nextSchoolDay();
    const newSched=hasUnreadSchedule();
    shell("Расписание",`Расписание уроков. ${newSched?'<span class="schedule-new-badge">● есть непрочитанные изменения</span>':''}`,
      `<div class="schedule-page-grid">
        <div class="card ${newSched?'schedule-new':''}">
          <h3>Расписание на сегодня <span class="muted">(${d.full})</span></h3>
          ${renderScheduleSelector("today")}
        </div>
        <div class="card">
          <h3>Расписание на завтра <span class="muted">(${tomorrow.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})})</span></h3>
          ${renderScheduleSelector("tomorrow")}
        </div>
        <div class="card">
          <h3>Базовое расписание</h3>
          ${renderBaseScheduleSelector()}
        </div>
      </div>
      ${canDispatch?`<div class="card" style="margin-top:16px"><h3>Загрузка расписания на конкретную дату</h3>
        <div class="schedule-import-grid"><div><label>Файл расписания</label><input id="scheduleFile" type="file" accept=".xlsx,.xls,.csv"></div><div><label>Дата расписания</label><input id="scheduleDate" type="date" value="${dateIsoLocal(nextSchoolDay())}"></div><div><label>Смена</label><select id="scheduleShift"><option value="">Выберите смену</option><option value="1">1 смена</option><option value="2">2 смена</option></select></div></div>
        <p class="muted">Загрузить расписание может только диспетчер или администратор. При повторной загрузке той же даты и смены предыдущая версия полностью заменяется.</p>
        <button class="btn green" style="margin-top:12px" onclick="uploadSchedule()">Загрузить и опубликовать</button><div id="scheduleImportInfo" class="muted" style="margin-top:10px"></div>
      </div>
      <div class="card" style="margin-top:16px"><h3>Загрузка базового расписания</h3>
        <div class="schedule-import-grid"><div><label>Файл базового расписания</label><input id="baseScheduleFile" type="file" accept=".xlsx,.xls,.csv"></div><div><label>Смена</label><select id="baseScheduleShift"><option value="">Выберите смену</option><option value="1">1 смена</option><option value="2">2 смена</option></select></div></div>
        <p class="muted">Базовых расписаний два — для 1-й и 2-й смены. Новая загрузка выбранной смены полностью заменяет старое базовое расписание этой смены.</p>
        <button class="btn green" style="margin-top:12px" onclick="uploadBaseSchedule()">Загрузить базовое расписание</button><div id="baseScheduleImportInfo" class="muted" style="margin-top:10px"></div>
      </div>`:""}`);
    if(newSched) markScheduleRead();
  }
  function renderNotifications(){
    const can=isManager();
    shell("Уведомления","Оповещения о посещении уроков и короткие сообщения.",
      `<div class="card"><div class="toolbar">${can?`<button class="btn green" onclick="sendVisit()">＋ Уведомление о посещении урока</button><button class="btn" onclick="sendText()">＋ Сообщение учителю</button>`:""}<button class="btn" onclick="markNotificationsRead()">Отметить все прочитанными</button></div>${state.notifications.map(noticeHtml).join("")}</div>`);
  }
  function renderPlaceholder(){
    const names={vseobuch:"Всеобуч",education:"Учебная работа",journal:"Электронный журнал",upbringing:"Воспитательная работа",ovz:"Обучающиеся с ОВЗ и инвалидностью",olymp:"Олимпиадное и конкурсное движение",gia:"ЕГЭ / ОГЭ",attestation:"Методическая работа",career:"Профориентация",psych:"Социально-психологическая служба",security:"Безопасность",reports:"Отчеты",archive:"Архив"};
    const page=state.currentPage;
    const responsible=state.responsibles?.[page]||"";
    const responsibleBlock=`<div class="responsible-line"><b>Ответственный за направление:</b><span>${escapeHtml(responsible||"не назначен")}</span>${(isAdmin()||state.currentUser?.roleKeys?.includes("director"))?`<button class="small-btn" onclick="setResponsible('${page}')">Изменить</button>`:""}</div>`;
    if(isGuest()&&!guestPageAllowed(page)){shell("Доступ ограничен",responsibleBlock+"Режим гостя — только просмотр доступных разделов.",`<div class="card"><div class="empty">Раздел недоступен пользователю Гость.</div></div>`);return;}
    if(page==="olymp"){
      shell(names[page],responsibleBlock+"Готовый модуль олимпиадного и конкурсного движения.",
        `<div class="module-grid" style="margin-bottom:18px">${moduleCard("Приказы","Приказы по олимпиадному и конкурсному движению. Непрочитанные документы подсвечиваются.","left",true)}</div>
         <div class="olymp-embed"><iframe src="olympiad_module.html" title="Олимпиадное и конкурсное движение" loading="lazy"></iframe></div>`);
      return;
    }
    if(page==="vseobuch"){shell("Всеобуч",responsibleBlock+"Документы и материалы по работе с контингентом.",`<div class="module-grid">${moduleCard("Контингент","Приказы по контингенту, численность детей в классах, микрорайон, списки иностранцев, ОВЗ","left")}${moduleCard("Приказы","Новые приказы по школе. Непрочитанные документы подсвечиваются.","right",true)}${moduleCard("Личные дела","Нормативные документы, образцы документов, приказы","left")}${moduleCard("Прием и перевод","Документы по приему и переводу обучающихся","right")}${moduleCard("Семейное образование","Документы и материалы по семейному образованию","left")}${moduleCard("Работа с иностранными гражданами","Документы и материалы по работе с иностранными гражданами","right")}</div>`);return;}
    if(page==="education"){shell("Учебная работа",responsibleBlock+"Документы, графики и материалы учебного процесса.",`<div class="module-grid">${moduleCard("Календарные учебные графики","Материалы календарных учебных графиков","right")}${moduleCard("Приказы","Новые приказы по школе. Непрочитанные документы подсвечиваются.","left",true)}${normativeCard()}${moduleCard("Диагностические работы","Диагностические материалы и результаты")}${moduleCard("ВПР","Всероссийские проверочные работы")}${moduleCard("Промежуточная аттестация","Документы и материалы промежуточной аттестации")}${moduleCard("Сроки каникул","Сроки и график каникул")}</div>`);return;}
    if(page==="journal"){shell("Электронный журнал",responsibleBlock+"Инструкции и ответы на часто задаваемые вопросы.",`<div class="module-grid">${moduleCard("Приказы","Новые приказы по электронному журналу. Непрочитанные документы подсвечиваются.","left",true)}${moduleCard("Для учителя","Инструкции по работе с электронным журналом и ответы на частые вопросы")}${moduleCard("Для родителей","Инструкции по доступу и работе с электронным журналом, ответы на частые вопросы")}</div>`);return;}
    if(page==="upbringing"){shell("Воспитательная работа",responsibleBlock+"Материалы воспитательной деятельности.",`<div class="module-grid orderable">${moduleCard("План воспитательной работы","Планирование воспитательной работы","left")}${moduleCard("Приказы","Новые приказы по школе. Непрочитанные документы подсвечиваются.","right",true)}${normativeCard()}${moduleCard("Движение первых","Материалы и документы")}${moduleCard("Классное руководство","Материалы и документы по классному руководству")}${moduleCard("Орлята России","Материалы и документы программы «Орлята России»")}${moduleCard("Положения о школьных мероприятиях","Положения и регламенты школьных мероприятий")}${moduleCard("Разговоры о важном","Материалы цикла «Разговоры о важном»")}${moduleCard("Россия мои горизонты","Материалы цикла «Россия — мои горизонты»")}${moduleCard("Пушкинская карта","Материалы и документы по Пушкинской карте")}</div>`);return;}
    if(page==="ovz"){shell("Обучающиеся с ОВЗ и инвалидностью",responsibleBlock+"Документы и материалы по сопровождению обучающихся.",`<div class="module-grid orderable">${moduleCard("Списки детей с ОВЗ и инвалидностью","Списки обучающихся и необходимые материалы")}${moduleCard("Приказы","Новые приказы по школе. Непрочитанные документы подсвечиваются.","right",true)}${normativeCard()}${moduleCard("Рабочие программы по нозологиям","Рабочие программы и материалы")}${moduleCard("Домашнее обучение","Документы и материалы по организации домашнего обучения")}</div>`);return;}
    if(page==="gia"){shell("ЕГЭ / ОГЭ",responsibleBlock+"Материалы государственной итоговой аттестации.",`<div class="gia-grid"><div class="gia-half grade9"><h3>ОГЭ — 9 класс</h3>${giaHalf("9 класс")}</div><div class="gia-half grade11"><h3>ЕГЭ — 11 класс</h3>${giaHalf("11 класс")}</div></div>`);return;}
    if(page==="attestation"){shell("Методическая работа",responsibleBlock+"Организация методической деятельности педагогов.",`<div class="module-grid orderable">${moduleCard("График предметных недель","График и материалы предметных недель")}${moduleCard("Приказы","Новые приказы по школе. Непрочитанные документы подсвечиваются.","right",true)}${moduleCard("Аттестация","Материалы по аттестации педагогических работников")}${moduleCard("Повышение квалификации","Курсы, программы и документы по повышению квалификации")}${moduleCard("Конкурсы профессионального мастерства","Конкурсы и материалы для участия")}${moduleCard("Методическая копилка","Общие методические материалы школы")}</div><div class="yellow-section-title">Работа методических объединений</div><div class="module-grid orderable">${["МО Начальной школы","МО Естественнонаучного цикла","МО Русского языка и литературы","МО Математики","МО Истории и обществознания","МО Иностранных языков","МО Физической культуры и ОБЗР","МО Технологии, ИЗО, Музыки"].map(x=>moduleCard(x,"Файлы методического объединения могут добавлять все пользователи, кроме гостя.")).join("")}</div>`);return;}
    if(page==="career"){shell("Профориентация",responsibleBlock+"Материалы и документы по профориентационной работе.",`<div class="module-grid">${moduleCard("Расписание мероприятий","Календарь мероприятий по профориентации","left")}${moduleCard("Приказы","Новые приказы по профориентации. Непрочитанные документы подсвечиваются.","right",true)}${normativeCard()}${moduleCard("Предпрофильные классы (5–9)","Информация о предпрофильных и профильных направлениях","left")}${moduleCard("Билет в будущее","Материалы и информация проекта «Билет в будущее»","right")}</div>`);return;}
    if(page==="psych"){shell(names[page],responsibleBlock+"Материалы социально-психологической службы.",`<div class="module-grid">${moduleCard("Консультации","Документы и материалы консультационной работы")}${moduleCard("Профилактика","Документы и материалы профилактической работы")}${moduleCard("Родительские собрания","Материалы и документы для родительских собраний")}${moduleCard("Тестирования","Материалы и документы по тестированию")}</div>`);return;}
    if(page==="security"){shell(names[page],responsibleBlock+"Документы и материалы по безопасности.",`<div class="module-grid">${moduleCard("Инструкции ТБ","Инструкции по технике безопасности","left")}${moduleCard("Приказы","Новые приказы по безопасности. Непрочитанные документы подсвечиваются.","right",true)}${securityNormativeCard()}${moduleCard("Шаблоны и образцы","Шаблоны и образцы документов")}</div>`);return;}
    if(page==="reports"){shell("Отчеты",responsibleBlock+"Периодические отчеты заполняются по аналогии с посещаемостью и сводятся в аналитике.",`<div class="module-grid">${moduleCard("Отчеты на начало года","Формы отчетов")}<div class="module-card" onclick="openInputDiagnostics()"><div class="module-card-title">Отчеты за 1 триместр</div><div class="muted">Формы отчетов</div><div class="module-folder">📂 Открыть папку →</div></div>${moduleCard("Отчеты за 2 триместр","Формы отчетов")}${moduleCard("Отчеты за год","Формы отчетов")}</div>`);return;}
    shell(names[page],"Рабочий раздел «Школы решений».",`<div class="card"><h3>${names[page]}</h3><p class="muted">Содержимое раздела подключается поэтапно.</p></div>`);
  }
  function guestPageAllowed(page){return ["home","transport","schedule","vseobuch","education","journal","ovz","olymp","gia"].includes(page);}
  function guestAllowed(page,title){if(!isGuest())return true;const allow={vseobuch:["Прием и перевод","Семейное образование"],education:["Сроки каникул"],journal:["Для родителей"],ovz:[],olymp:["__ALL__"],gia:["Расписание","Нормативные документы"]};if(page==="olymp")return true;if(title==="Нормативные документы")return true;return (allow[page]||[]).includes(title);}
  function docKey(page,title){return `${page}::${title}`;}
  function userCanSeeDoc(doc){
    if(!doc||!state.currentUser)return false;
    const u=state.currentUser;
    const isOrder=String(doc.sectionKey||"").split("::")[1]?.includes("Приказы");
    if(isOrder && ["admin","director","deputy"].some(r=>u.roleKeys?.includes(r)))return true;
    if(doc.targetAll || doc.targetType==="all")return true;
    const isClassLeader=(u.classes||[]).length>0;
    if(doc.targetClassLeaderAll || doc.targetType==="classleaders")if(isClassLeader)return true;
    const parallels=(doc.targetClassLeaderParallels||[]).map(String);
    if(parallels.length && isClassLeader && (u.classes||[]).some(c=>parallels.includes(String(c).match(/^\d+/)?.[0])))return true;
    if((doc.targetUsers||[]).includes(u.login))return true;
    if(doc.targetType==="specific" && (doc.targetUsers||[]).includes(u.login))return true;
    return false;
  }
  function unreadDocs(page,title){return state.documents.some(d=>d.sectionKey===docKey(page,title)&&userCanSeeDoc(d)&&!(d.readBy||{})[state.currentUser.login]);}
  window.setResponsible=function(page){if(!(isAdmin()||state.currentUser?.roleKeys?.includes("director")))return;const v=prompt("ФИО заместителя, ответственного за направление:",state.responsibles?.[page]||"");if(v===null)return;state.responsibles[page]=v.trim();save();render();};
  function moduleCard(title,text,side="",hasNew=false){if(!guestAllowed(state.currentPage,title))return ``;const isNew=unreadDocs(state.currentPage,title)||hasNew&&unreadDocs(state.currentPage,title);return `<div class="module-card ${side} ${isNew?'module-new':''}" onclick="openDocs('${escapeHtml(state.currentPage)}','${escapeHtml(title)}')"><div class="module-card-title">${escapeHtml(title)}${isNew?'<span class="new-dot">● новое</span>':''}</div><div class="muted">${escapeHtml(text)}</div><div class="module-folder">📂 Открыть папку →</div></div>`;}
  function normativeCard(){return `<div class="normative-card"><h3>Нормативные документы</h3><div class="normative-cols"><div onclick="openDocs(state.currentPage,'Нормативные документы — Федеральные')"><b>Федеральные документы</b><p>📂 Открыть</p></div><div onclick="openDocs(state.currentPage,'Нормативные документы — Региональные/муниципальные')"><b>Региональные / муниципальные документы</b><p>📂 Открыть</p></div><div onclick="openDocs(state.currentPage,'Нормативные документы — Локальные')"><b>Локальные документы</b><p>📂 Открыть</p></div></div></div>`;}
  function normativeCardNoLocal(exam=""){const suffix=exam?` ${exam}`:"";return `<div class="normative-card full"><h3>Нормативные документы${suffix}</h3><div class="normative-cols two-cols"><div onclick="openDocs('gia','Нормативные документы — Федеральные${suffix}')"><b>Федеральные документы${suffix}</b><p>📂 Открыть</p></div><div onclick="openDocs('gia','Нормативные документы — Региональные/муниципальные${suffix}')"><b>Региональные / муниципальные документы${suffix}</b><p>📂 Открыть</p></div></div></div>`;}
  function securityNormativeCard(){return `<div class="normative-card"><h3>Нормативные документы</h3><div class="normative-cols"><div onclick="openDocs('security','Нормативные документы — Федеральные')"><b>Федеральные документы</b><p>📂 Открыть</p></div><div onclick="openDocs('security','Нормативные документы — Региональные/муниципальные')"><b>Региональные / муниципальные документы</b><p>📂 Открыть</p></div><div onclick="openDocs('security','Нормативные документы — Локальные')"><b>Локальные документы</b><p>📂 Открыть</p></div></div></div>`;}
  function giaHalf(label){const exam=label==="9 класс"?"ОГЭ":"ЕГЭ";return `${moduleCard(`Расписание ${exam}`,`Расписание консультаций, тренировочных мероприятий, экзаменов ${exam}`)}${moduleCard(`Выбор предметов ${exam}`,`Выбор предметов для ${label}`)}${moduleCard(`Приказы ${exam}`,`Приказы по ${exam}. Новые документы подсвечиваются.`,"left",true)}${normativeCardNoLocal(exam)}${moduleCard(`Тренировочные/Пробные ${exam}`,`Тренировочные и пробные мероприятия для ${label}`)}${moduleCard(`Создание особых условий ${exam}`,`Материалы и документы для ${label}`)}${moduleCard(`Работники ППЭ ${exam}`,`Сведения и документы для ${label}`)}`;}
  function renderMyData(){
    const d=state.myData[state.currentUser.login]||{};
    const fields=[
      ["Фамилия, имя, отчество","fullName"],["Организация","orgShort"],["Образование / диплом","education"],["Переподготовка","retraining"],["Телефон","phone"],["Эл. почта","email"],["Возраст","age"],["Общий стаж","totalExperience"],["Педагогический стаж","pedExperience"],["Ветеран труда, год","veteran"],["Научная степень","degree"],["Жилье","housing"],["Нуждаетесь в улучшении жилья","housingNeed"],["Количество учеников","students"],["Нагрузка (часов в неделю)","load"],["Квалификация","qualification"],["Предмет 1","subject1"],["Классы по предмету 1","classes1"],["Учащиеся по предмету 1","students1"],["Предмет 2","subject2"],["Классы по предмету 2","classes2"],["Учащиеся по предмету 2","students2"],["Повышение квалификации","cpd"],["Результативность ВОШ 2025/2026","olymp"],["Результативность ЕГЭ 2022/2023","ege"],["Награды муниципального уровня","awardsMunicipal"],["Награды регионального/всероссийского уровня","awardsRegional"],["Методические мероприятия","methodical"],["Эксперт ОГЭ/ЕГЭ/аттестации","expert"],["Конкурсы профессионального мастерства","proContests"]
    ];
    const portfolio=state.portfolio[state.currentUser.login]||[];
    shell("Мои данные","Личные сведения и портфолио.",`<div class="grid">
      <div class="card span6 mydata-half"><h3 style="cursor:pointer" onclick="toggleTeacherQuestionnaire()">📝 Анкета педагога <span class="muted">— нажмите, чтобы раскрыть</span></h3><div id="teacherQuestionnaire" class="hidden"><div class="form-grid compact-mydata" style="margin-top:12px">${fields.map(([label,key])=>`<div class="field"><label>${label}</label><input id="md_${key}" value="${escapeHtml(d[key]||"")}"></div>`).join("")}</div><div class="toolbar" style="justify-content:flex-end;margin-top:14px"><button class="btn green" onclick="saveMyData()">Сохранить анкету</button></div></div></div>
      <div class="card span6 mydata-half"><h3>📁 Портфолио</h3><p class="muted">Каждый пользователь может добавлять свои документы.</p><div class="doc-upload"><input id="portfolioFile" type="file"><button class="btn green" style="margin-top:10px" onclick="uploadPortfolio()">＋ Добавить документ</button></div><div class="portfolio-list">${portfolio.map((f,i)=>`<div class="portfolio-item"><span>📄 ${escapeHtml(f.name)}</span><span><a href="${escapeHtml(f.url||f.data||"")}" target="_blank" rel="noopener">Открыть</a> <button class="small-btn danger" onclick="deletePortfolio(${i})">Удалить</button></span></div>`).join("")||'<div class="empty">Портфолио пока пусто.</div>'}</div></div>
    </div>`);
  }
  window.toggleTeacherQuestionnaire=function(){document.getElementById("teacherQuestionnaire")?.classList.toggle("hidden");};
  function renderAdmin(){
    if(!isAdmin()){shell("Администрирование","Доступно администратору.",`<div class="card"><div class="empty">Недостаточно прав.</div></div>`);return;}
    const respNames={transport:"Подвоз",vseobuch:"Всеобуч",education:"Учебная работа",journal:"Электронный журнал",upbringing:"Воспитательная работа",ovz:"Обучающиеся с ОВЗ и инвалидностью",olymp:"Олимпиадное и конкурсное движение",gia:"ЕГЭ / ОГЭ",attestation:"Методическая работа",career:"Профориентация",psych:"Социально-психологическая служба",security:"Безопасность",reports:"Отчеты",archive:"Архив"};
    shell("Администрирование","Пользователи, роли, расписание, дежурство и ответственные за направления.",
      `<div class="admin-grid">
      <div class="card admin-span12"><h3>Пользователи и доступы</h3><div class="toolbar"><button class="btn green" onclick="addUser()">＋ Добавить пользователя</button></div><div class="table-wrap"><table class="data-table"><tr><th>ФИО</th><th>Логин</th><th>Роли</th><th>Классное руководство / смена</th><th>Посещаемость</th><th>Замещения</th><th></th></tr>${state.users.map(u=>`<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.login)}</td><td>${escapeHtml(u.roles||rolesText(u.roleKeys))}</td><td>${Object.entries(u.shift||{}).map(([c,s])=>`${escapeHtml(c)} — ${s} смена`).join("<br>")||"—"}</td><td>${(u.attendanceClasses||[]).join(", ")||"—"}</td><td>${(u.replacement||[]).join(", ")||"—"}</td><td><button class="small-btn" onclick="editUser(${u.id})">Изменить</button> <button class="small-btn danger" onclick="deleteUser(${u.id})">Удалить</button> <button class="small-btn" onclick="setUserCredentials(${u.id})">Логин / пароль</button></td></tr>`).join("")}</table></div><p class="role-hint">Секретарь — дополнительная роль существующего пользователя, как и Диспетчер. Отдельной учётной записи секретаря нет.</p></div>
      <div class="card"><h3>Диспетчер расписания</h3><label>Назначить диспетчера</label><select id="dispatcherSelect">${state.users.filter(u=>!u.roleKeys.includes("guest")).map(u=>`<option value="${u.id}" ${u.roleKeys.includes("dispatcher")||state.dispatcherIds.includes(u.id)?"selected":""}>${escapeHtml(u.name)}</option>`).join("")}</select><button class="btn green" style="margin-top:12px" onclick="saveDispatcher()">Сохранить</button></div>
      <div class="card"><h3>Секретарь</h3><label>Назначить до 5 пользователей с ролью «Секретарь»</label><select id="secretarySelect" class="secretary-multi" multiple size="7">${state.users.filter(u=>!u.roleKeys.includes("guest")).map(u=>`<option value="${u.id}" ${u.roleKeys.includes("secretary")?"selected":""}>${escapeHtml(u.name)}</option>`).join("")}</select><button class="btn green" style="margin-top:12px" onclick="saveSecretary()">Сохранить</button><p class="muted">Можно выбрать не более 5 человек. Каждый секретарь входит под своим обычным логином и получает права роли «Секретарь».</p></div>
      <div class="card admin-span12"><h3>Расписание звонков</h3><p class="muted">Таблица соответствует утверждённому расписанию школы: три группы по сменам, отдельно понедельник и вторник-пятница.</p><div class="table-wrap">${renderBellMatrixTable(true)}</div><button class="btn green" style="margin-top:12px" onclick="saveBellMatrix()">Сохранить расписание звонков</button></div>
      <div class="card admin-span12"><h3>Контингент классов</h3><p class="muted">Excel-файл с тремя столбцами: «Класс» / «Кол-во учеников» / «Смена». Классы сохраняются в Supabase; прежние классы только деактивируются после успешной проверки новой загрузки.</p><div class="roster-upload"><input id="rosterFile" type="file" accept=".xlsx,.xls,.csv"><button class="btn green" style="margin-top:10px" onclick="uploadClassRoster()">Загрузить и заменить данные</button><div id="rosterInfo" class="roster-meta">В системе загружено классов: ${(state.classRoster||[]).length}.</div></div></div>
      <div class="card"><h3>Ответственные за направления</h3><p class="muted">Администратор указывает ФИО заместителя, курирующего каждый модуль.</p><div class="responsible-admin-list">${Object.entries(respNames).map(([k,n])=>`<label>${n}<input id="resp_${k}" value="${escapeHtml(state.responsibles[k]||"")}" placeholder="ФИО заместителя"></label>`).join("")}</div><button class="btn green" style="margin-top:12px" onclick="saveResponsibles()">Сохранить ответственных</button></div>
      <div class="card admin-span12"><h3>Дежурство администрации</h3><div class="table-wrap"><table class="data-table duty-table"><tr><th>День</th><th>ФИО 1</th><th>Телефон 1</th><th>ФИО 2</th><th>Телефон 2</th></tr>${state.dutySchedule.map((x,i)=>`<tr><td>${escapeHtml(x.day)}</td><td><input id="duty_name1_${i}" value="${escapeHtml(x.name1||"")}"></td><td><input id="duty_phone1_${i}" value="${escapeHtml(x.phone1||"")}"></td><td><input id="duty_name2_${i}" value="${escapeHtml(x.name2||"")}"></td><td><input id="duty_phone2_${i}" value="${escapeHtml(x.phone2||"")}"></td></tr>`).join("")}</table></div><button class="btn green" style="margin-top:12px" onclick="saveDuty()">Сохранить график дежурства</button></div>
      <div class="card admin-span12"><h3>Сроки каникул</h3><p class="muted">Сюда можно вставить полный график каникул на учебный год — несколько строк, таблицу или текстовый приказ.</p><label>Расписание каникул</label><textarea id="vacationsText" class="vacations-editor" rows="12" placeholder="Например:\nОсенние каникулы — ...\nЗимние каникулы — ...\nВесенние каникулы — ...\nЛетние каникулы — ...">${escapeHtml(state.vacationsText||"")}</textarea><button class="btn green" style="margin-top:12px" onclick="saveVacations()">Сохранить расписание каникул</button></div>
      </div>`);
  }
  function renderSettings(){shell("Настройки","Настройки пользователя.",`<div class="card" style="max-width:800px"><div class="settings-row"><b>Логин</b><div>${state.currentUser.login}</div></div><div class="settings-row"><b>Роль</b><div>${state.currentUser.roles||state.currentUser.role}</div></div><div class="settings-row"><b>Смена пароля</b><div><button class="btn" onclick="changePassword()">Изменить пароль</button></div></div></div>`);}
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
  window.recalcAttendance=function(){
    const total=+(document.getElementById("attTotal")?.value||0), inputs=[...document.querySelectorAll(".att-input")], absent=inputs.reduce((s,e)=>s+(+e.value||0),0)+(+(document.getElementById("attFiltered")?.value||0))+(+(document.getElementById("attHome")?.value||0))+(+(document.getElementById("attRemote")?.value||0));
    const other=[...document.querySelectorAll(".att-input.other")].reduce((s,e)=>s+(+e.value||0),0);
    const present=Math.max(0,total-absent);
    if(document.getElementById("attPresent"))document.getElementById("attPresent").value=present;
    if(document.getElementById("attSummary"))document.getElementById("attSummary").textContent=`Присутствуют: ${present} · Не явились: ${absent}`;
    if(document.getElementById("otherTotal"))document.getElementById("otherTotal").textContent=other;
    const v=document.getElementById("attValidation");if(v)v.innerHTML=absent>total?'<div class="warning-box">⚠ Количество указанных отсутствующих превышает количество детей в классе. Проверьте данные.</div>':'';
  };
  window.submitAttendance=function(){
    recalcAttendance();
    const cls=document.getElementById("attClass").value,total=+document.getElementById("attTotal").value,present=+document.getElementById("attPresent").value;
    const all={};document.querySelectorAll(".att-input").forEach(e=>all[e.dataset.key]=+e.value||0);
    const rec={date:dateInfo().iso,className:cls,total,present,filtered:+document.getElementById("attFiltered").value||0,home:+document.getElementById("attHome").value||0,food:+document.getElementById("attFood").value||0,remote:+document.getElementById("attRemote").value||0,...all,teacher:state.currentUser.name};
    state.attendance=state.attendance.filter(x=>!(x.date===rec.date&&x.className===cls&&x.teacher===rec.teacher));state.attendance.push(rec);
    const t=state.tasks.find(x=>x.id==="attendance");if(t)t.done=true;save();alert("Посещаемость отправлена и сохранена в аналитике.");navigate("home");
  };
  function classSort(a,b){const pa=String(a).match(/(\d+)\s*([А-ЯA-ZЁа-яa-zё]*)/i)||[],pb=String(b).match(/(\d+)\s*([А-ЯA-ZЁа-яa-zё]*)/i)||[];return (+pa[1]||0)-(+pb[1]||0)||String(pa[2]||'').localeCompare(String(pb[2]||''),'ru');}
  window.journalPeriod=function(kind){document.getElementById("jDates").classList.toggle("hidden",kind!=="custom");if(kind==="yesterday"){const d=new Date();d.setDate(d.getDate()-1);const s=dateIsoLocal(d);document.getElementById("jFrom").value=s;document.getElementById("jTo").value=s;}};
  window.showJournalAnalytics=function(){
    const from=document.getElementById("jFrom")?.value||"",to=document.getElementById("jTo")?.value||"";
    const arr=state.journalOverdue.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to));
    const grouped={};arr.forEach(x=>{grouped[x.login]??={name:x.name,count:0,dates:[]};grouped[x.login].count+=x.count;grouped[x.login].dates.push(x);});
    const el=document.getElementById("journalAnalytics");if(!el)return;
    const total=arr.reduce((sum,x)=>sum+Number(x.count||0),0);
    el.innerHTML=`<div class="journal-total">Всего незаполненных страниц: <b>${total}</b></div><div class="table-wrap journal-table-wrap"><table class="data-table"><tr><th>Педагог</th><th>Просрочено страниц</th><th>Даты</th></tr>${Object.values(grouped).map((x,i)=>`<tr><td>${x.name}</td><td><button class="link-button" onclick="toggleJournalDates('jd_${i}')">${x.count}</button></td><td><div id="jd_${i}" class="hidden">${x.dates.map(d=>`<div>${d.date} — ${d.count} стр.</div>`).join("")}</div><span>${x.dates.map(d=>d.date).join(', ')}</span></td></tr>`).join("")||'<tr><td colspan="3">Нет просрочек за период.</td></tr>'}</table></div>`;
  };
  window.toggleJournalDates=function(id){document.getElementById(id)?.classList.toggle('hidden');};
  window.addPlan=function(){const title=prompt("Мероприятие:");if(!title)return;state.plan.push({id:Date.now(),date:prompt("Дата:","15.08")||"",time:prompt("Время:","12:00")||"",title,place:prompt("Место:","Кабинет")||"",participants:prompt("Участники:","Мой класс")||"",responsible:isManager()?state.currentUser.name:"",status:isManager()?"Опубликовано":"На согласовании",author:state.currentUser.login});save();render();};
  window.publishPlan=function(id){const x=state.plan.find(p=>p.id===id);if(x){x.status="Опубликовано";x.responsible=x.responsible||state.currentUser.name;save();render();}};
  window.editPlan=function(id){const x=state.plan.find(p=>p.id===id);if(!x)return;x.title=prompt("Мероприятие:",x.title)||x.title;x.date=prompt("Дата:",x.date)||x.date;x.time=prompt("Время:",x.time)||x.time;x.place=prompt("Место:",x.place)||x.place;x.participants=prompt("Участники:",x.participants)||x.participants;save();render();};
  window.deletePlan=function(id){if(confirm("Удалить мероприятие?")){state.plan=state.plan.filter(x=>x.id!==id);save();render();}};
  window.submitTransportMessage=function(){
    if(!isManager())return;
    const title=document.getElementById("transportTitle")?.value.trim(),text=document.getElementById("transportText")?.value.trim();
    if(!title||!text)return alert("Заполните заголовок и текст сообщения.");
    state.transport.unshift({id:Date.now(),level:"important",title,text,date:"Сегодня",read:false});
    save();render();
  };
  window.addTransport=function(){state.currentPage="transport";render();};
  function closeNotifyModal(){document.getElementById("notifyModal")?.remove();}
  function openNotifyModal(kind){
    if(!isManager())return;
    closeNotifyModal();
    const users=(state.users||[]).filter(u=>!u.roleKeys?.includes("guest"));
    const teachers=users.filter(u=>u.roleKeys?.includes("teacher"));
    const managers=users.filter(u=>u.roleKeys?.some(r=>["director","deputy"].includes(r)));
    const classes=[...new Set(users.flatMap(u=>u.classes||[]).filter(Boolean))].sort((a,b)=>{const na=parseInt(a)||0,nb=parseInt(b)||0;return na-nb||String(a).localeCompare(String(b),"ru")});
    const modal=document.createElement("div");modal.id="notifyModal";modal.className="notify-modal-backdrop";
    if(kind==="text"){
      modal.innerHTML=`<div class="notify-modal" role="dialog" aria-modal="true"><h3>Сообщение учителю</h3><p class="muted">Выберите адресата по ФИО и введите текст сообщения.</p><div class="notify-form"><div class="notify-row"><label for="notifyRecipient">ФИО пользователя</label><input id="notifyRecipient" list="notifyRecipients" placeholder="Начните вводить ФИО"><datalist id="notifyRecipients">${users.map(u=>`<option value="${escapeHtml(u.name)}"></option>`).join("")}</datalist></div><div class="notify-row"><label for="notifyText">Сообщение</label><textarea id="notifyText" placeholder="Введите текст сообщения"></textarea></div></div><div class="notify-modal-actions"><button class="btn" onclick="closeNotifyModal()">Отмена</button><button class="btn green" onclick="submitTextNotification()">Отправить</button></div></div>`;
    }else{
      modal.innerHTML=`<div class="notify-modal" role="dialog" aria-modal="true"><h3>Уведомление о посещении урока</h3><p class="muted">Заполните все пять строк.</p><div class="notify-form"><div class="notify-row"><label for="visitTeacher">ФИО учителя, которого посещают</label><input id="visitTeacher" list="visitTeachers" placeholder="Начните вводить ФИО"><datalist id="visitTeachers">${teachers.map(u=>`<option value="${escapeHtml(u.name)}"></option>`).join("")}</datalist></div><div class="notify-row"><label for="visitVisitor">ФИО заместителя</label><input id="visitVisitor" list="visitManagers" placeholder="Начните вводить ФИО"><datalist id="visitManagers">${managers.map(u=>`<option value="${escapeHtml(u.name)}"></option>`).join("")}</datalist></div><div class="notify-row"><label for="visitClass">Класс</label><input id="visitClass" list="visitClasses" placeholder="Например, 7Б"><datalist id="visitClasses">${classes.map(c=>`<option value="${escapeHtml(c)}"></option>`).join("")}</datalist></div><div class="notify-row"><label for="visitSubject">Предмет</label><input id="visitSubject" placeholder="Например, биология"></div><div class="notify-row"><label for="visitGoal">Цель визита</label><textarea id="visitGoal" placeholder="Введите цель посещения"></textarea></div></div><div class="notify-modal-actions"><button class="btn" onclick="closeNotifyModal()">Отмена</button><button class="btn green" onclick="submitVisitNotification()">Отправить</button></div></div>`;
    }
    modal.addEventListener("click",e=>{if(e.target===modal)closeNotifyModal();});document.body.appendChild(modal);
  }
  window.closeNotifyModal=closeNotifyModal;
  window.closeNotifyModal=function(){document.querySelectorAll(".notify-modal-backdrop").forEach(x=>x.remove());};
  window.sendText=function(){
    const users=state.users.filter(u=>!u.roleKeys.includes("guest"));
    const html=`<div class="notify-modal-backdrop"><div class="notify-modal"><h3>Сообщение учителю</h3><div class="notify-form"><div class="notify-row"><label>ФИО учителя</label><input id="notifyTeacherName" list="notifyTeacherList" placeholder="Начните вводить ФИО"><datalist id="notifyTeacherList">${users.map(u=>`<option value="${escapeHtml(u.name)}"></option>`).join("")}</datalist></div><div class="notify-row"><label>Сообщение</label><textarea id="notifyMessage" rows="5" placeholder="Введите сообщение"></textarea></div></div><div class="notify-modal-actions"><button class="btn" onclick="closeNotifyModal()">Отмена</button><button class="btn green" onclick="submitTextNotification()">Отправить</button></div></div></div>`;
    document.body.insertAdjacentHTML("beforeend",html);
  };
  window.submitTextNotification=function(){
    const name=document.getElementById("notifyTeacherName")?.value.trim(),msg=document.getElementById("notifyMessage")?.value.trim();
    const u=state.users.find(x=>x.name.toLowerCase()===name.toLowerCase())||state.users.find(x=>x.name.toLowerCase().includes(name.toLowerCase()));
    if(!u)return alert("Выберите учителя из списка ФИО."); if(!msg)return alert("Введите сообщение.");
    state.notifications.unshift({id:Date.now(),type:"text",title:"Новое сообщение",text:msg,date:"Сегодня",read:false,teacher:u.login});save();closeNotifyModal();render();
  };
  window.sendVisit=function(){
    const teachers=state.users.filter(u=>u.roleKeys.includes("teacher")&&!u.roleKeys.includes("guest"));
    const deputies=state.users.filter(u=>u.roleKeys.includes("deputy")||u.roleKeys.includes("director"));
    const classes=[...new Set((state.schedule?.entries||[]).map(x=>x.className).concat(state.users.flatMap(u=>u.classes||[])).filter(Boolean))].sort();
    const subjects=[...new Set((state.schedule?.entries||[]).map(x=>x.subject).filter(Boolean))].sort();
    const html=`<div class="notify-modal-backdrop"><div class="notify-modal"><h3>Уведомление о посещении урока</h3><div class="notify-form"><div class="notify-row"><label>1. Учитель</label><input id="visitTeacherName" list="visitTeacherList" placeholder="Начните вводить ФИО"><datalist id="visitTeacherList">${teachers.map(u=>`<option value="${escapeHtml(u.name)}"></option>`).join("")}</datalist></div><div class="notify-row"><label>2. Заместитель / директор</label><input id="visitDeputyName" list="visitDeputyList" placeholder="Начните вводить ФИО"><datalist id="visitDeputyList">${deputies.map(u=>`<option value="${escapeHtml(u.name)}"></option>`).join("")}</datalist></div><div class="notify-row"><label>3. Класс</label><input id="visitClass" list="visitClassList" placeholder="Например, 7Б"><datalist id="visitClassList">${classes.map(c=>`<option value="${escapeHtml(c)}"></option>`).join("")}</datalist></div><div class="notify-row"><label>4. Предмет</label><input id="visitSubject" list="visitSubjectList" placeholder="Предмет"><datalist id="visitSubjectList">${subjects.map(x=>`<option value="${escapeHtml(x)}"></option>`).join("")}</datalist></div><div class="notify-row"><label>5. Цель посещения</label><textarea id="visitPurpose" rows="3" placeholder="Цель посещения урока"></textarea></div></div><div class="notify-modal-actions"><button class="btn" onclick="closeNotifyModal()">Отмена</button><button class="btn green" onclick="submitVisitNotification()">Отправить</button></div></div></div>`;
    document.body.insertAdjacentHTML("beforeend",html);
  };
  window.submitVisitNotification=function(){
    const tn=document.getElementById("visitTeacherName")?.value.trim(),dn=document.getElementById("visitDeputyName")?.value.trim(),cls=document.getElementById("visitClass")?.value.trim(),subject=document.getElementById("visitSubject")?.value.trim(),purpose=document.getElementById("visitPurpose")?.value.trim();
    const teacher=state.users.find(u=>u.name.toLowerCase()===tn.toLowerCase())||state.users.find(u=>u.name.toLowerCase().includes(tn.toLowerCase()));
    const deputy=state.users.find(u=>u.name.toLowerCase()===dn.toLowerCase())||state.users.find(u=>u.name.toLowerCase().includes(dn.toLowerCase()));
    if(!teacher||!deputy||!cls||!subject||!purpose)return alert("Заполните все 5 строк и выберите ФИО из списков.");
    state.notifications.unshift({id:Date.now(),type:"visit",title:"Уведомление о посещении урока",text:`Класс: ${cls}. Предмет: ${subject}. Цель: ${purpose}. Посетитель: ${deputy.name}.`,date:"Сегодня",read:false,teacher:teacher.login,visit:{teacher:teacher.name,deputy:deputy.name,cls,subject,purpose}});save();closeNotifyModal();render();
  };
  window.readNotification=function(id){const n=state.notifications.find(x=>x.id===id);if(n){n.read=true;save();render();}};
  window.markNotificationsRead=function(){state.notifications.forEach(n=>n.read=true);save();render();};
  window.saveMyData=function(){const d={};document.querySelectorAll('[id^="md_"]').forEach(e=>d[e.id.slice(3)]=e.value.trim());state.myData[state.currentUser.login]=d;save();alert("Анкета сохранена.");render();};
  window.exportMyData=function(){const keys=Object.keys(state.myData), rows=keys.map(k=>[k,...Object.values(state.myData[k])]);downloadCSV(["Логин","Данные анкеты"],rows,"мои_данные.csv");};
  window.addUser=function(){
    if(!isAdmin())return;
    const name=prompt("ФИО:");if(!name)return;
    const login=prompt("Логин:","newuser");if(!login)return;
    const password=prompt("Пароль:","1234")||"1234";
    const roleInput=prompt("Роли через запятую: teacher, director, deputy, dispatcher, secretary, admin","teacher")||"teacher";
    const roleKeys=roleInput.split(",").map(x=>x.trim()).filter(Boolean);
    state.users.push({id:Date.now(),name,login,password,roleKeys,roles:rolesText(roleKeys),classes:[],shift:{},attendanceClasses:[],replacement:[]});
    save();render();
  };
  window.editUser=function(id){
    if(!isAdmin())return;
    const u=state.users.find(x=>x.id===id);if(!u)return;
    const name=prompt("ФИО пользователя:",u.name);if(name===null)return;
    const roles=prompt("Роли через запятую: teacher, director, deputy, dispatcher, secretary, admin",(u.roleKeys||[]).filter(r=>r!=="guest").join(","));if(roles===null)return;
    const classes=prompt("Классы классного руководства через запятую (например: 5А, 6Б):",(u.classes||[]).join(","));if(classes===null)return;
    const attendance=prompt("Классы для посещаемости через запятую:",(u.attendanceClasses||[]).join(","));if(attendance===null)return;
    const replacement=prompt("Классы замещений через запятую:",(u.replacement||[]).join(","));if(replacement===null)return;
    u.name=name.trim();
    u.roleKeys=roles.split(",").map(x=>x.trim()).filter(Boolean);
    if(!u.roleKeys.length)u.roleKeys=["teacher"];
    u.roles=rolesText(u.roleKeys);
    u.classes=classes.split(",").map(x=>x.trim()).filter(Boolean);
    u.shift=u.shift||{};
    // Смена классного руководства берётся из справочника классов,
    // загруженного из файла «Контингент». Не ставим 1-ю смену автоматически.
    const rosterShiftByClass=Object.fromEntries((state.classRoster||[]).map(r=>[String(r.name).trim(),Number(r.shift)||0]));
    u.classes.forEach(c=>{
      const rosterShift=rosterShiftByClass[String(c).trim()];
      if(rosterShift===1||rosterShift===2) u.shift[c]=rosterShift;
      else if(!u.shift[c]) u.shift[c]=0;
    });
    Object.keys(u.shift).forEach(c=>{if(!u.classes.includes(c))delete u.shift[c];});
    u.attendanceClasses=attendance.split(",").map(x=>x.trim()).filter(Boolean);
    u.replacement=replacement.split(",").map(x=>x.trim()).filter(Boolean);
    if(!u.roleKeys.includes("dispatcher"))state.dispatcherIds=(state.dispatcherIds||[]).filter(x=>x!==u.id);
    save();
    Promise.all([syncClassLeadersForUser(u),saveUserAssignments(u)]).then(()=>{alert("Данные пользователя сохранены.");render();});
  };
  window.editUserRoles=function(id){return editUser(id);};
  window.deleteUser=function(id){
    if(!isAdmin())return;
    const u=state.users.find(x=>x.id===id);if(!u)return;
    if(u.id===state.currentUser.id)return alert("Нельзя удалить текущую учетную запись администратора.");
    if(!confirm(`Удалить пользователя «${u.name}»? Это действие удалит его учетную запись из текущего MVP.`))return;
    state.users=state.users.filter(x=>x.id!==id);
    state.dispatcherIds=(state.dispatcherIds||[]).filter(x=>x!==id);
    if(u.roleKeys?.includes("secretary")){}
    delete state.myData[u.login];
    delete state.portfolio[u.login];
    save();render();
  };
  window.setUserCredentials=async function(id){
    if(!isAdmin())return;
    const u=state.users.find(x=>x.id===id);if(!u)return;
    const existingLogin=String(u.login||"").startsWith("employee_")?"":String(u.login||"");
    const modal=document.createElement("div");
    modal.className="notify-modal-backdrop";
    modal.id="credentialsModal";
    modal.innerHTML=`<div class="notify-modal" role="dialog" aria-modal="true" style="width:min(560px,100%)">
      <h3>Данные для входа</h3>
      <p class="muted">${escapeHtml(u.name)}</p>
      <div class="notify-form">
        <div class="notify-row"><label for="credLogin">Логин</label><input id="credLogin" autocomplete="off" value="${escapeHtml(existingLogin)}" placeholder="Например: ivanova.mp"></div>
        <div class="notify-row"><label for="credPassword">Новый пароль</label><input id="credPassword" type="password" autocomplete="new-password" minlength="6" placeholder="Не менее 6 символов"></div>
      </div>
      <p class="muted" style="margin-top:12px">Пароль не сохраняется в базе приложения. Он передаётся в защищённую функцию Supabase и хранится только в Auth.</p>
      <div class="notify-modal-actions">
        <button class="btn" onclick="closeCredentialsModal()">Отмена</button>
        <button class="btn green" id="saveCredentialsBtn" onclick="saveUserCredentials(${Number(id)})">Сохранить данные доступа</button>
      </div>
      <div class="error" id="credentialsError"></div>
    </div>`;
    modal.addEventListener("click",e=>{if(e.target===modal)closeCredentialsModal();});
    document.body.appendChild(modal);
    document.getElementById("credLogin")?.focus();
  };
  window.closeCredentialsModal=function(){document.getElementById("credentialsModal")?.remove();};
  window.saveUserCredentials=async function(id){
    if(!isAdmin())return;
    const u=state.users.find(x=>x.id===id);if(!u)return;
    const login=document.getElementById("credLogin")?.value.trim().toLowerCase()||"";
    const password=document.getElementById("credPassword")?.value||"";
    const err=document.getElementById("credentialsError");
    const btn=document.getElementById("saveCredentialsBtn");
    if(!login){err.textContent="Введите логин.";return;}
    if(!/^[a-z0-9._-]{3,40}$/.test(login)){err.textContent="Логин: 3–40 символов, только латинские буквы, цифры, точка, дефис или _.";
      return;}
    if(password.length<6){err.textContent="Пароль должен содержать не менее 6 символов.";return;}
    if(btn)btn.disabled=true; err.textContent="Сохраняем…";
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session)throw new Error("Сессия администратора завершена. Войдите заново.");
      const r=await fetch(SUPABASE_FUNCTION_URL,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${session.access_token}`,
          "apikey":SUPABASE_PUBLISHABLE_KEY
        },
        body:JSON.stringify({employeeId:Number(u.id),login,password})
      });
      const payload=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(payload.error||`Ошибка ${r.status}`);
      u.login=login;
      u.authUserId=payload.authUserId||u.authUserId;
      save();
      closeCredentialsModal();
      alert(`Данные доступа для ${u.name} сохранены.\n\nЛогин: ${login}\nПароль установлен.`);
      render();
    }catch(e){
      err.textContent=e.message||"Не удалось сохранить данные доступа.";
      if(btn)btn.disabled=false;
    }
  };
  window.resetPassword=function(id){return setUserCredentials(id);};
  function renderBellEditorTable(){const monday=state.schedule.bellSchedules?.monday||[],weekdays=state.schedule.bellSchedules?.weekdays||[];const max=Math.max(monday.length,weekdays.length);let html="";for(let i=0;i<max;i++){const a=monday[i],b=weekdays[i];html+=`<tr><td>${i<max?`<b>${i+1}</b>`:""}</td><td>Урок ${i+1}</td><td><input id="monday_s_${i}" type="time" value="${a?.start||b?.start||"08:30"}"></td><td><input id="monday_e_${i}" type="time" value="${a?.end||b?.end||"09:15"}"></td><td><span class="muted">Пн</span></td></tr>`;html+=`<tr><td></td><td>Урок ${i+1}</td><td><input id="weekdays_s_${i}" type="time" value="${b?.start||a?.start||"08:30"}"></td><td><input id="weekdays_e_${i}" type="time" value="${b?.end||a?.end||"09:15"}"></td><td><span class="muted">Вт–Пт</span></td></tr>`;}return html;}
  function renderBellRows(kind){const arr=state.schedule.bellSchedules?.[kind]||[];return arr.map((b,i)=>`<div class="bell-row"><input id="${kind}_n_${i}" type="number" min="1" value="${b.n}"><input id="${kind}_s_${i}" type="time" value="${b.start}"><span>—</span><input id="${kind}_e_${i}" type="time" value="${b.end}"><button class="small-btn danger" onclick="removeBellRow('${kind}',${i})">×</button></div>`).join("");}
  window.addBellRow=function(kind){state.schedule.bellSchedules[kind].push({n:state.schedule.bellSchedules[kind].length+1,start:"08:30",end:"09:15"});save();render();};
  window.removeBellRow=function(kind,i){state.schedule.bellSchedules[kind].splice(i,1);save();render();};
  window.saveBellMatrix=async function(){
    const bm=ensureBellMatrix();
    document.querySelectorAll(".bell-time").forEach(inp=>{
      const key=inp.dataset.bellKey,day=inp.dataset.bellDay,n=+inp.dataset.bellN,part=inp.dataset.part; const arr=bm[key][day];
      let row=arr.find(x=>+x.n===n); if(!row){row={n,start:"",end:""};arr.push(row);} row[part]=inp.value||"";
    });
    ["shift1","shift2Primary","shift2Grade6"].forEach(k=>["monday","weekdays"].forEach(day=>{bm[k][day]=bm[k][day].sort((a,b)=>+a.n-+b.n);}));
    state.schedule.bellMatrix=bm;state.schedule.bellSchedules={monday:bm.shift1.monday,weekdays:bm.shift1.weekdays};state.schedule.bells=bm.shift1.weekdays;save();await saveAppSetting("bellMatrix",bm);alert("Расписание звонков сохранено.");render();
  };
  window.saveVacations=async function(){state.vacationsText=document.getElementById("vacationsText").value;save();await saveAppSetting("vacationsText",state.vacationsText);alert("Сроки каникул сохранены.");render();};
  window.saveDispatcher=async function(){
    if(!isAdmin())return; const id=+document.getElementById("dispatcherSelect").value;
    state.users.forEach(u=>{if(u.roleKeys?.includes("dispatcher")){u.roleKeys=u.roleKeys.filter(r=>r!=="dispatcher");u.roles=rolesText(u.roleKeys);}});
    const u=state.users.find(x=>x.id===id);if(u&&!u.roleKeys.includes("dispatcher"))u.roleKeys.push("dispatcher");
    if(u)u.roles=rolesText(u.roleKeys);state.dispatcherIds=[id];save();await saveAppSetting("dispatcherIds",state.dispatcherIds);alert("Диспетчер назначен.");render();
  };
  window.saveSecretary=async function(){
    if(!isAdmin())return;
    const select=document.getElementById("secretarySelect");
    const ids=[...(select?.selectedOptions||[])].map(o=>Number(o.value)).filter(Number.isFinite);
    if(ids.length>5)return alert("Можно назначить роль «Секретарь» не более чем 5 пользователям.");
    state.users.forEach(u=>{u.roleKeys=(u.roleKeys||[]).filter(r=>r!=="secretary");u.roles=rolesText(u.roleKeys);});
    ids.forEach(id=>{
      const u=state.users.find(x=>Number(x.id)===id);
      if(u && !u.roleKeys.includes("secretary")){u.roleKeys.push("secretary");u.roles=rolesText(u.roleKeys);}
    });
    state.__secretaryEmployeeIds=ids;
    state.__secretaryEmployeeId=ids[0]??null; // compatibility with the old setting
    save();
    const ok=await saveAppSetting("secretaryEmployeeIds",ids);
    await saveAppSetting("secretaryEmployeeId",ids[0]??null); // keep old key for backward compatibility
    if(!ok)console.warn("Не удалось сохранить список секретарей в Supabase.");
    alert(`Роль «Секретарь» назначена: ${ids.length} пользователям.`);
    render();
  };
  window.saveResponsibles=async function(){
    if(!isAdmin())return; const keys=["transport","vseobuch","education","journal","upbringing","ovz","olymp","gia","attestation","career","psych","security","reports","archive"];
    keys.forEach(k=>state.responsibles[k]=document.getElementById(`resp_${k}`)?.value.trim()||"");save();await saveAppSetting("responsibles",state.responsibles);alert("Ответственные за направления сохранены.");render();
  };
  window.saveDuty=async function(){
    if(!(isAdmin()||state.currentUser.roleKeys.includes("deputy")))return;
    state.dutySchedule.forEach((x,i)=>{x.name1=document.getElementById(`duty_name1_${i}`)?.value.trim()||"";x.phone1=document.getElementById(`duty_phone1_${i}`)?.value.trim()||"";x.name2=document.getElementById(`duty_name2_${i}`)?.value.trim()||"";x.phone2=document.getElementById(`duty_phone2_${i}`)?.value.trim()||"";});save();await saveAppSetting("dutySchedule",state.dutySchedule);alert("График дежурства сохранён.");render();
  };
  function normalizeClass(s){return String(s||"").trim().toUpperCase().replace(/\s+/g,"");}
  function parseDateFromText(v){const s=String(v??"").trim();if(!s)return null;let m=s.match(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})\b/);if(m)return `${m[3]}-${String(+m[2]).padStart(2,"0")}-${String(+m[1]).padStart(2,"0")}`;m=s.match(/\b(\d{1,2})[.\/-](\d{1,2})\b/);if(m)return `${new Date().getFullYear()}-${String(+m[2]).padStart(2,"0")}-${String(+m[1]).padStart(2,"0")}`;m=s.match(/\b(\d{1,2})\s+([А-Яа-яЁё]+)(?:\s+(\d{4}))?\b/);if(!m)return null;const months={января:0,февраля:1,марта:2,апреля:3,мая:4,июня:5,июля:6,августа:7,сентября:8,октября:9,ноября:10,декабря:11};const mon=months[m[2].toLowerCase()];if(mon===undefined)return null;const y=m[3]?+m[3]:new Date().getFullYear();return `${y}-${String(mon+1).padStart(2,"0")}-${String(+m[1]).padStart(2,"0")}`;}
  function cellVal(v){return v==null?"":String(v).trim();}
  function looksLikeTeacherName(v){const s=String(v||"").trim();if(!s)return false;try{if(flexibleUserByName(s,teacherLikeUsers()))return true;}catch(e){}return /^[А-ЯЁ][а-яё-]{2,}\s+[А-ЯЁ]\.?\s*[А-ЯЁ]\.?$/i.test(s);}
  function parseScheduleWorkbook(wb,fileName,selectedShift){
    const ws=wb.Sheets[wb.SheetNames[0]];
    const a=XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:false});
    let dateIso=null,shift=selectedShift?+selectedShift:null;
    for(const row of a.slice(0,15)){
      for(const cell of (row||[])){
        const d=parseDateFromText(cell);
        if(d){dateIso=d;break;}
      }
      const text=(row||[]).map(cellVal).join(" ");
      const sm=text.match(/([12])\s*(?:смена|см)/i);
      if(sm&&!selectedShift)shift=+sm[1];
      if(dateIso)break;
    }
    const manualDate=document.getElementById("scheduleDate")?.value||"";
    if(manualDate)dateIso=manualDate;
    if(!dateIso)throw new Error("Не удалось определить дату расписания. Укажите дату вручную в поле «Дата расписания».");
    if(!shift)throw new Error("Не выбрана смена.");

    // В файле расписания школы заголовок находится в строке с '#',
    // затем для каждого класса идут две колонки: предмет/кабинет.
    let headerRow=a.findIndex(row=>String(row?.[0]||"").trim()==="#");
    if(headerRow<0){
      headerRow=3;
    }
    const header=a[headerRow]||[];
    const classes=[];
    for(let c=1;c<header.length;c+=2){
      const className=normalizeClass(header[c]);
      if(className)classes.push({className,subCol:c,roomCol:c+1});
    }
    if(!classes.length)throw new Error("Не удалось определить классы в файле.");

    const isLessonNumber=v=>/^\d{1,2}$/.test(cellVal(v));
    const entries=[];
    let r=headerRow+1;
    while(r<a.length){
      if(!isLessonNumber(a[r]?.[0])){r++;continue;}
      const lesson=Number(cellVal(a[r][0]));
      let rr=r+1;
      while(rr<a.length && !isLessonNumber(a[rr]?.[0]))rr++;

      for(const c of classes){
        // Основной предмет располагается в строке номера урока,
        // преподаватель — в следующей строке.
        const subject=cellVal(a[r]?.[c.subCol]);
        const room=cellVal(a[r]?.[c.roomCol]);
        const teacher=cellVal(a[r+1]?.[c.subCol]);
        if(subject && !looksLikeTeacherName(subject)){
          entries.push({id:`${dateIso}_${shift}_${c.className}_${lesson}_${c.subCol}_base`,date:dateIso,shift,lesson,className:c.className,subject,room,teacher,group:0});
        }

        // Дополнительные группы/подгруппы внутри блока урока:
        // каждая реальная дополнительная запись состоит из пары
        // «предмет» + следующая строка «учитель».
        let k=r+2, group=1;
        while(k<rr){
          const extraSubject=cellVal(a[k]?.[c.subCol]);
          const extraTeacher=cellVal(a[k+1]?.[c.subCol]);
          if(extraSubject && !looksLikeTeacherName(extraSubject) && extraTeacher && looksLikeTeacherName(extraTeacher)){
            const extraRoom=cellVal(a[k]?.[c.roomCol])||cellVal(a[k+1]?.[c.roomCol]);
            entries.push({id:`${dateIso}_${shift}_${c.className}_${lesson}_${c.subCol}_g${group}`,date:dateIso,shift,lesson,className:c.className,subject:extraSubject,room:extraRoom,teacher:extraTeacher,group});
            group++;
            k+=2;
          }else{
            k++;
          }
        }
      }
      r=rr;
    }

    // Защита от повторной записи одного и того же урока.
    const seen=new Set();
    const unique=entries.filter(x=>{
      const key=[x.date,x.shift,x.lesson,x.className,x.subject,x.teacher,x.room].join("|");
      if(seen.has(key))return false;
      seen.add(key);return true;
    });
    return {date:dateIso,shift,entries:unique,classes:[...new Set(unique.map(x=>x.className))],fileName};
  }

  function parseBaseScheduleWorkbook(wb,fileName,selectedShift){
    const ws=wb.Sheets[wb.SheetNames[0]], a=XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:false});
    const days=["Понедельник","Вторник","Среда","Четверг","Пятница"];
    const entries=[]; let currentClass="", shift=selectedShift?+selectedShift:null;
    for(let r=0;r<a.length;r++){
      const row=a[r]||[];
      const first=cellVal(row[0]);
      const cm=first.match(/Класс\s*-\s*(.+)/i);
      if(cm){currentClass=normalizeClass(cm[1]);continue;}
      const rowText=row.map(cellVal).join(" ");
      const sm=rowText.match(/([12])\s*(?:смена|см)/i);if(sm&&!shift)shift=+sm[1];
      const lesson=+first;
      if(!currentClass||!lesson||lesson>20)continue;
      for(let c=1;c<=5;c++){
        const subject=cellVal(row[c]);
        if(!subject)continue;
        let teacher="";
        if(r+1<a.length && !+cellVal(a[r+1]?.[0])) teacher=cellVal(a[r+1]?.[c]);
        let group=0;
        let rr=r+1;
        while(rr<a.length && !+cellVal(a[rr]?.[0]) && !String(a[rr]?.[0]||"").toLowerCase().includes("класс -")) rr++;
        for(let k=r+2;k<rr;k++){
          const extra=cellVal(a[k]?.[c]);
          if(extra && !/^[А-ЯЁA-Z][^]*\s[А-ЯЁA-Z]\./u.test(extra) && extra!==subject) {
            // Дополнительный предмет/группа. Учитель обычно следует следующей строкой.
            let extraTeacher=cellVal(a[k+1]?.[c]);
            if(extraTeacher) entries.push({id:`base_${selectedShift}_${currentClass}_${lesson}_${c}_${k}`,shift:+selectedShift,day:days[c-1],dayIndex:c-1,lesson,className:currentClass,subject:extra,teacher:extraTeacher,group:++group});
          }
        }
        entries.push({id:`base_${selectedShift}_${currentClass}_${lesson}_${c}`,shift:+selectedShift,day:days[c-1],dayIndex:c-1,lesson,className:currentClass,subject,teacher,group});
      }
    }
    if(!shift)throw new Error("Не выбрана смена.");
    const valid=entries.filter(x=>x.shift===shift);
    return {shift,entries:valid,classes:[...new Set(valid.map(x=>x.className))],fileName};
  }

  window.uploadSchedule=function(){
    if(!isDispatcher())return alert("Загрузка расписания доступна только диспетчеру и администратору.");
    const f=document.getElementById("scheduleFile")?.files[0], selectedShift=document.getElementById("scheduleShift")?.value;
    if(!f)return alert("Выберите Excel-файл расписания.");
    if(!selectedShift)return alert("Укажите, это 1-я или 2-я смена.");
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const wb=XLSX.read(e.target.result,{type:"array"});
        const parsed=parseScheduleWorkbook(wb,f.name,selectedShift);
        const old=state.schedule.entries.filter(x=>x.date===parsed.date&&x.shift===parsed.shift);
        state.schedule.entries=state.schedule.entries.filter(x=>!(x.date===parsed.date&&x.shift===parsed.shift));
        state.schedule.entries.push(...parsed.entries);
        const now=new Date().toISOString();
        const version={id:Date.now(),date:parsed.date,shift:parsed.shift,fileName:f.name,uploadedAt:now,count:parsed.entries.length,readBy:{[state.currentUser.login]:{at:now}}};
        state.schedule.versions=(state.schedule.versions||[]).filter(v=>!(v.date===parsed.date&&v.shift===parsed.shift));
        state.schedule.versions.push(version);state.schedule.uploadedFile=f.name;
        save();
        const info=document.getElementById("scheduleImportInfo");
        if(info)info.innerHTML=`Распознано: <b>${parsed.date}</b>, <b>${parsed.shift}-я смена</b>, классов: <b>${parsed.classes.length}</b>, записей уроков: <b>${parsed.entries.length}</b>. ${old.length?"Предыдущее расписание этой даты и смены заменено.":"Расписание добавлено."}`;
        alert(`Расписание загружено: ${parsed.date}, ${parsed.shift}-я смена, ${parsed.entries.length} записей.`);
        render();
      }catch(err){console.error(err);alert("Не удалось обработать файл расписания: "+(err.message||"проверьте формат Excel."));}
    };
    reader.readAsArrayBuffer(f);
  };

  window.uploadBaseSchedule=function(){
    if(!isDispatcher())return alert("Загрузка базового расписания доступна только диспетчеру и администратору.");
    const f=document.getElementById("baseScheduleFile")?.files[0], selectedShift=document.getElementById("baseScheduleShift")?.value;
    if(!f)return alert("Выберите Excel-файл базового расписания.");
    if(!selectedShift)return alert("Укажите, это 1-я или 2-я смена.");
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const wb=XLSX.read(e.target.result,{type:"array"});
        const parsed=parseBaseScheduleWorkbook(wb,f.name,selectedShift);
        state.schedule.baseEntries=(state.schedule.baseEntries||[]).filter(x=>x.shift!==parsed.shift);
        state.schedule.baseEntries.push(...parsed.entries);
        const now=new Date().toISOString();
        state.schedule.baseVersions=(state.schedule.baseVersions||[]).filter(v=>v.shift!==parsed.shift);
        state.schedule.baseVersions.push({id:Date.now(),shift:parsed.shift,fileName:f.name,uploadedAt:now,count:parsed.entries.length});
        state.schedule.baseUploadedFile=f.name;
        save();
        const info=document.getElementById("baseScheduleImportInfo");
        if(info)info.innerHTML=`Распознано: <b>${parsed.shift}-я смена</b>, классов: <b>${parsed.classes.length}</b>, записей: <b>${parsed.entries.length}</b>. Предыдущая версия этой смены заменена.`;
        alert(`Базовое расписание ${parsed.shift}-й смены загружено.`);
        render();
      }catch(err){console.error(err);alert("Не удалось обработать базовое расписание: "+(err.message||"проверьте формат Excel."));}
    };
    reader.readAsArrayBuffer(f);
  };

  function getScheduleForDate(iso){const target=String(iso||'').slice(0,10);return (state.schedule.entries||[]).filter(x=>String(x.date||'').slice(0,10)===target).sort((a,b)=>Number(a.shift||99)-Number(b.shift||99)||Number(a.lesson||99)-Number(b.lesson||99)||classSort(a.className,b.className));}
  function normalizePersonName(v){return String(v||"").toLowerCase().replace(/ё/g,"е").replace(/[^а-яa-z0-9 ]/gi," ").replace(/\s+/g," ").trim();}
  function teacherMatches(entryTeacher,userName){
    const a=normalizePersonName(entryTeacher),b=normalizePersonName(userName);
    if(!a||!b)return false;
    if(a===b)return true;
    const as=a.split(" "),bs=b.split(" ");
    if(as[0]===bs[0])return true;
    const initials=as.slice(1).map(x=>x[0]).join("");
    const fullInitials=bs.slice(1).map(x=>x[0]).join("");
    return as[0]===bs[0] && initials && fullInitials && initials===fullInitials;
  }
  function scheduleForUser(entries,mode){
    if(isGuest())return entries;
    if(mode==="mine")return entries.filter(x=>teacherMatches(x.teacher,state.currentUser.name));
    if(mode&&mode.startsWith("class:")){const wanted=mode.slice(6);return entries.filter(x=>normalizeClass(x.className)===normalizeClass(wanted));}
    return [];
  }
  function scheduleShiftFor(entries){const shifts=[...new Set(entries.map(x=>x.shift))];return shifts.length?shifts.join(", "):"—";}
  function renderScheduleTable(entries,mode){
    const arr=scheduleForUser(entries,mode);
    if(!arr.length)return '<div class="schedule-empty">Расписание для выбранного варианта не найдено.</div>';
    return `<div class="schedule-view"><div class="schedule-shift">Смена: ${escapeHtml(scheduleShiftFor(arr))}</div><div class="table-wrap"><table class="data-table"><tr><th>Урок</th><th>Класс</th><th>Предмет</th><th>Учитель</th><th>Кабинет</th></tr>${arr.map(x=>`<tr><td>${x.lesson}</td><td>${escapeHtml(x.className)}</td><td>${escapeHtml(x.subject||"—")}</td><td>${escapeHtml(x.teacher||"—")}</td><td>${escapeHtml(x.room||"—")}</td></tr>`).join("")}</table></div></div>`;
  }
  function renderScheduleSelector(day){
    const d=dateInfo(),dt=day==="tomorrow"?nextSchoolDay():new Date(),iso=dateIsoLocal(dt);
    const entries=getScheduleForDate(iso);
    const classes=(state.currentUser.classes||[]).filter(Boolean);
    const options=classes.map(c=>`<option value="class:${escapeHtml(c)}">${escapeHtml(c)} — классное руководство</option>`).join("");
    return `<div class="schedule-choice"><select id="scheduleChoice_${day}" onchange="showScheduleChoice('${day}')"><option value="">Выберите вариант</option><option value="mine">Мое расписание</option>${options}</select></div><div id="scheduleResult_${day}"><div class="schedule-empty">Выберите «Мое расписание»${classes.length?" или свой класс":"."}.</div></div>`;
  }
  window.showScheduleChoice=function(day){
    const sel=document.getElementById("scheduleChoice_"+day);if(!sel)return;
    const d=dateInfo(),dt=day==="tomorrow"?nextSchoolDay():new Date();
    document.getElementById("scheduleResult_"+day).innerHTML=sel.value?renderScheduleTable(getScheduleForDate(dateIsoLocal(dt)),sel.value):'<div class="schedule-empty">Выберите вариант.</div>';
  };
  function renderScheduleHomeSelector(day="today"){
    const classes=(state.currentUser.classes||[]).filter(Boolean);
    const id=`homeScheduleChoice_${day}`,resultId=`homeScheduleResult_${day}`;
    return `<div class="schedule-choice"><select id="${id}" onchange="showHomeScheduleChoice('${day}')"><option value="">Выберите вариант</option><option value="mine">Мое расписание</option>${classes.map(c=>`<option value="class:${escapeHtml(c)}">${escapeHtml(c)} — классное руководство</option>`).join("")}</select></div>
      <div class="muted">Выберите «Мое расписание»${classes.length?" или свой класс":"."}.</div>
      <div id="${resultId}" style="margin-top:12px"><div class="schedule-empty">Выберите вариант.</div></div>`;
  }
  window.showHomeScheduleChoice=function(day="today"){
    const sel=document.getElementById(`homeScheduleChoice_${day}`);if(!sel)return;
    const result=document.getElementById(`homeScheduleResult_${day}`);if(!result)return;
    const d=dateInfo(),dt=day==="tomorrow"?nextSchoolDay():new Date();
    if(!sel.value){result.innerHTML='<div class="schedule-empty">Выберите вариант.</div>';return;}
    result.innerHTML=renderScheduleTable(getScheduleForDate(dateIsoLocal(dt)),sel.value);
  };
  function hasUnreadSchedule(){return (state.schedule.versions||[]).some(v=>!(v.readBy||{})[state.currentUser.login]);}
  function markScheduleRead(){(state.schedule.versions||[]).forEach(v=>{v.readBy=v.readBy||{};v.readBy[state.currentUser.login]={at:new Date().toISOString()};});save();}
  function renderBaseScheduleSelector(){
    const classes=[...new Set((state.schedule.baseEntries||[]).map(x=>x.className))].sort(classSort);
    return `<div class="schedule-choice"><select id="baseScheduleChoice" onchange="showBaseScheduleChoice()"><option value="">Выберите класс</option>${classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}</select></div>
      <div class="muted">Выберите класс, чтобы увидеть базовое расписание.</div>
      <div id="baseScheduleResult" style="margin-top:12px"><div class="schedule-empty">Класс не выбран.</div></div>`;
  }
  window.showBaseScheduleChoice=function(){
    const c=document.getElementById("baseScheduleChoice")?.value;if(!c)return;
    const arr=(state.schedule.baseEntries||[]).filter(x=>x.className===c);
    if(!arr.length){document.getElementById("baseScheduleResult").innerHTML='<div class="schedule-empty">Базовое расписание для класса не найдено.</div>';return;}
    const shifts=[...new Set(arr.map(x=>x.shift))];
    const days=["Понедельник","Вторник","Среда","Четверг","Пятница"];
    let html=`<div class="schedule-shift">Смена: ${escapeHtml(shifts.join(", "))}</div><div class="table-wrap"><table class="data-table"><tr><th>Урок</th>${days.map(d=>`<th>${d}</th>`).join("")}</tr>`;
    for(let lesson=1;lesson<=20;lesson++){
      if(!arr.some(x=>x.lesson===lesson))continue;
      html+=`<tr><td>${lesson}</td>${days.map((_,i)=>{const cells=arr.filter(x=>x.lesson===lesson&&x.dayIndex===i);const cell=cells.map(x=>escapeHtml(x.subject)+(x.teacher?"<br><span class=\"muted\">"+escapeHtml(x.teacher)+"</span>":"")).join("<hr style=\"border:0;border-top:1px solid var(--line);margin:5px 0\">")||"—";return "<td>"+cell+"</td>";}).join("")}</tr>`;
    }
    html+=`</table></div>`;
    document.getElementById("baseScheduleResult").innerHTML=html;
  };
  function renderGuestHomeSchedule(){const classes=[...new Set((state.schedule.entries||[]).map(x=>x.className))].sort();return `<section class="card"><h3>📅 Расписание уроков</h3><p class="muted">Выберите класс — расписание появится только для выбранного класса.</p><select id="guestClass" class="schedule-class-select" onchange="renderGuestSelectedSchedule()"><option value="">Выберите класс</option>${classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}</select><div id="guestScheduleResult" style="margin-top:14px"><div class="schedule-empty">Класс не выбран.</div></div></section>`;}
  window.renderGuestSelectedSchedule=function(){const c=document.getElementById("guestClass")?.value;if(!c)return;const d=dateInfo(),tom=nextSchoolDay();const filter=a=>a.filter(x=>x.className===c);document.getElementById("guestScheduleResult").innerHTML=`<div class="schedule-columns"><div><h4>Сегодня <span class="muted">(${d.full})</span></h4>${renderScheduleTable(filter(getScheduleForDate(d.iso)),"class:"+c)}</div><div><h4>Завтра <span class="muted">(${tom.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})})</span></h4>${renderScheduleTable(filter(getScheduleForDate(dateIsoLocal(tom))),"class:"+c)}</div></div>`;};
  function renderGuestSchedulePage(){const classes=[...new Set((state.schedule.entries||[]).map(x=>x.className))].sort();shell("Расписание","Режим просмотра для гостя.",`<div class="card"><p class="muted">Выберите класс — расписание появится только для выбранного класса.</p><select id="guestClassPage" class="schedule-class-select" onchange="renderGuestPageSchedule()"><option value="">Выберите класс</option>${classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}</select><div id="guestPageScheduleResult" style="margin-top:14px"><div class="schedule-empty">Класс не выбран.</div></div></div>`);}
  window.renderGuestPageSchedule=function(){const c=document.getElementById("guestClassPage")?.value;if(!c)return;const d=dateInfo(),tom=nextSchoolDay();const filter=a=>a.filter(x=>x.className===c);document.getElementById("guestPageScheduleResult").innerHTML=`<div class="schedule-columns"><div><h3>Сегодня <span class="muted">(${d.full})</span></h3>${renderScheduleTable(filter(getScheduleForDate(d.iso)),"class:"+c)}</div><div><h3>Завтра <span class="muted">(${tom.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})})</span></h3>${renderScheduleTable(filter(getScheduleForDate(dateIsoLocal(tom))),"class:"+c)}</div></div>`;};

  function docUploadAllowed(page,title){if(isGuest())return false;if(title.includes("Приказы"))return canManageOrders();return true;}
  function docTargetLabel(d){
    const parts=[];
    if(d.targetAll)parts.push("Все");
    if(d.targetClassLeaderAll)parts.push("Все классные руководители");
    if((d.targetClassLeaderParallels||[]).length)parts.push("Классные руководители "+d.targetClassLeaderParallels.join(", ")+" классов");
    if((d.targetUsers||[]).length)parts.push("Конкретные учителя: "+d.targetUsers.map(l=>state.users.find(u=>u.login===l)?.name||l).join(", "));
    if(parts.length)return parts.join(" + ");
    if(d.targetType==="all")return "Все";
    if(d.targetType==="classleaders")return "Классные руководители";
    return "Конкретные пользователи";
  }
  function markDocsReadForCurrent(key){/* ознакомление фиксируется только кнопкой «Ознакомился» */}
  function sectionDocs(page,title){const key=docKey(page,title);const rows=state.documents.filter(d=>d.sectionKey===key);if(page==="gia"&&/ ОГЭ$/.test(title)){const legacyTitles=[title.replace(/ ОГЭ$/,""),title.replace(/ ОГЭ$/," — Федеральные"),title.replace(/ ОГЭ$/," — Региональные/муниципальные")];rows.push(...state.documents.filter(d=>d.sectionKey.startsWith("gia::")&&legacyTitles.includes(d.sectionKey.slice(5))));}return rows.filter((d,i,a)=>a.findIndex(x=>String(x.id)===String(d.id))===i);}
  window.openDocs=function(page,title){state.currentPage=page;renderDocSection(page,title);};
  function renderDocSection(page,title){
    const docs=sectionDocs(page,title),canUpload=docUploadAllowed(page,title),manager=canViewAckReport();
    const order=title.includes("Приказы");
    shell(title,"Документы раздела. Для приказов ознакомление фиксируется отдельной кнопкой.",`${canUpload?`<div class="doc-upload"><div class="doc-upload-grid"><div><label>Документ</label><input id="docFile" type="file"></div><div><label>Название документа</label><input id="docTitle" placeholder="Например: Приказ №..."></div></div>${order?`<div style="margin-top:12px"><label>Для кого предназначен приказ</label>
<div class="target-grid target-grid-four">
<label class="target-choice"><input type="checkbox" id="targetAll" onchange="toggleDocTarget()"> Все</label>
<label class="target-choice"><input type="checkbox" id="targetClassLeaderAll" onchange="toggleDocTarget()"> Все классные руководители</label>
<label class="target-choice"><input type="checkbox" id="targetClassLeaderParallel" onchange="toggleDocTarget()"> Классные руководители по параллелям</label>
<label class="target-choice"><input type="checkbox" id="targetSpecific" onchange="toggleDocTarget()"> Конкретные учителя</label>
</div>
<div id="parallelBox" class="checkbox-list hidden" style="margin-top:8px">${[...new Set(state.users.flatMap(u=>(u.classes||[]).map(c=>String(c).match(/^\d+/)?.[0]).filter(Boolean)))].sort((a,b)=>+a-+b).map(p=>`<label><input type="checkbox" value="${p}"> ${p} классы</label>`).join("")}</div>
<div id="specificUsersBox" class="checkbox-list hidden" style="margin-top:8px">${state.users.filter(u=>!u.roleKeys.includes("guest")).map(u=>`<label><input type="checkbox" value="${escapeHtml(u.login)}"> ${escapeHtml(u.name)}</label>`).join("")}</div>
</div>`:""}<button class="btn green" style="margin-top:12px" onclick="uploadDocument('${escapeHtml(page)}','${escapeHtml(title)}')">＋ Загрузить документ</button></div>`:""}${docs.length?`<div class="doc-list">${docs.map(d=>renderDocItem(d,manager)).join("")}</div>`:'<div class="empty">Документов пока нет.</div>'}`);
  }
  function renderDocItem(d,manager){
    const seen=d.readBy?.[state.currentUser.login];
    const unread=userCanSeeDoc(d)&&!seen;
    const isOrder=d.sectionKey.split('::')[1]?.includes("Приказы");
    const ackAt=typeof seen==="object"?seen.at:null;
    return `<div class="doc-item ${unread?'unread':''}">
      <div class="doc-item-title">📄 ${escapeHtml(d.title||d.fileName)} ${unread?'<span class="unread-marker">• новое</span>':''}</div>
      <div class="doc-meta">Загружен: ${escapeHtml(d.uploadedByName||"")} · ${new Date(d.uploadedAt).toLocaleString('ru-RU')}</div>
      ${isOrder?`<div class="doc-targets">Предназначен: ${escapeHtml(docTargetLabel(d))}</div>`:""}
      ${ackAt?`<div class="ack-info">✓ Ознакомлен: ${new Date(ackAt).toLocaleString('ru-RU')}</div>`:""}
      <div class="doc-actions">${(d.url||d.data)?`<a class="btn" href="${escapeHtml(d.url||d.data)}" target="_blank" rel="noopener">Открыть</a>`:""}${userCanSeeDoc(d)&&!seen?`<button class="btn green" onclick="ackDocument(${d.id})">✓ Ознакомился</button>`:""}${isOrder&&manager?`<button class="btn" onclick="whoRead(${d.id})">Кто ознакомился</button>`:""}${canDeleteDocument(d)?`<button class="btn danger" onclick="deleteDocument(${d.id})">Удалить</button>`:""}</div>
    </div>`;
  }
  window.toggleDocSpecific=function(show){document.getElementById("specificUsersBox")?.classList.toggle("hidden",!show);};
  window.toggleDocTarget=function(){
    document.getElementById("parallelBox")?.classList.toggle("hidden",!document.getElementById("targetClassLeaderParallel")?.checked);
    document.getElementById("specificUsersBox")?.classList.toggle("hidden",!document.getElementById("targetSpecific")?.checked);
  };
  window.uploadDocument=async function(page,title){
    const f=document.getElementById("docFile")?.files[0];if(!f)return alert("Выберите документ.");
    const folderUrl=yandexFolderForPage(page);if(!folderUrl)return alert("Для этого раздела ещё не настроена папка Яндекс Диска.");
    const name=document.getElementById("docTitle")?.value.trim()||f.name;
    let targetType="all",targetUsers=[],targetAll=true,targetClassLeaderAll=false,targetClassLeaderParallels=[];
    if(title.includes("Приказы")){
      if(!canManageOrders())return alert("Приказы могут загружать только директор, заместитель директора, администратор и секретарь.");
      targetAll=!!document.getElementById("targetAll")?.checked;targetClassLeaderAll=!!document.getElementById("targetClassLeaderAll")?.checked;
      targetClassLeaderParallels=[...document.querySelectorAll("#parallelBox input:checked")].map(x=>x.value);
      targetUsers=[...document.querySelectorAll('#specificUsersBox input:checked')].map(x=>x.value);
      const any=targetAll||targetClassLeaderAll||targetClassLeaderParallels.length||targetUsers.length;if(!any)return alert("Выберите хотя бы одного адресата.");
      targetType=targetAll?"all":targetUsers.length?"specific":"classleaders";
    }
    try{
      const targetEmployeeIds=(state.users||[]).filter(u=>{
        if(targetAll)return !u.roleKeys?.includes("guest");
        if(targetUsers.includes(u.login))return true;
        if(targetClassLeaderAll&&u.classes?.length)return true;
        if(targetClassLeaderParallels.length&&(u.classes||[]).some(c=>targetClassLeaderParallels.includes(String(c).match(/^\d+/)?.[0])))return true;
        return false;
      }).map(u=>Number(u.id)).filter(Number.isFinite);
      const uploaded=await uploadToYandexFolder(f,folderUrl,page,title);
      const record={section_key:docKey(page,title),title:name,file_name:f.name,storage_url:uploaded.public_url||uploaded.url||"",storage_path:uploaded.path||"",uploaded_by:state.currentUser.login,uploaded_by_name:state.currentUser.name,target_type:targetType,target_users:targetUsers,target_all:targetAll,target_class_leader_all:targetClassLeaderAll,target_class_leader_parallels:targetClassLeaderParallels,target_employee_ids:targetEmployeeIds};
      const saved=await saveDocumentRecord(record);const d=Array.isArray(saved)?saved[0]:saved;
      state.documents.unshift({id:Number(d?.id||Date.now()),sectionKey:record.section_key,title:name,fileName:f.name,data:"",url:record.storage_url,storagePath:record.storage_path,uploadedBy:record.uploaded_by,uploadedByName:record.uploaded_by_name,uploadedAt:new Date().toISOString(),targetType,targetUsers,targetAll,targetClassLeaderAll,targetClassLeaderParallels,targetEmployeeIds,readBy:{}});
      save();alert("Документ загружен и сохранён на Яндекс Диске.");renderDocSection(page,title);
    }catch(e){console.error(e);alert("Не удалось загрузить документ: "+(e.message||"проверьте настройку Яндекс Диска."));}
  };
  window.ackDocument=async function(id){
    const d=state.documents.find(x=>x.id===id);if(!d||!userCanSeeDoc(d))return;
    try{await acknowledgeDocumentRecord(id);}catch(e){return alert("Не удалось сохранить ознакомление: "+(e.message||"ошибка Supabase"));}
    d.readBy=d.readBy||{};d.readBy[state.currentUser.login]={at:new Date().toISOString()};save();renderDocSection(state.currentPage,d.sectionKey.split('::')[1]);
  };
  window.whoRead=function(id){
    const d=state.documents.find(x=>x.id===id);if(!d||!canManageOrders()||!d.sectionKey.split('::')[1]?.includes("Приказы"))return;
    const recipients=state.users.filter(u=>{
      if(u.roleKeys.includes("guest"))return false;
      if(d.targetAll||d.targetType==="all")return true;
      if(d.targetClassLeaderAll||d.targetType==="classleaders")if((u.classes||[]).length)return true;
      const ps=(d.targetClassLeaderParallels||[]).map(String);
      if(ps.length&&(u.classes||[]).some(c=>ps.includes(String(c).match(/^\d+/)?.[0])))return true;
      return (d.targetUsers||[]).includes(u.login);
    });
    const rows=recipients.map(u=>{const seen=d.readBy?.[u.login];return [d.title||d.fileName,u.name,seen?(typeof seen==="object"?new Date(seen.at).toLocaleString('ru-RU'):""):"Не ознакомлен"];});
    const headers=["Название приказа","ФИО ознакомившегося","Дата и время ознакомления"];
    const csv=[headers,...rows];downloadCSV(csv[0],csv.slice(1),`ознакомление_${d.id}.csv`);
    const lines=rows.map(r=>`<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(r[1])}</td><td>${escapeHtml(r[2])}</td></tr>`).join("");
    const w=window.open("","_blank","width=900,height=600");if(w){w.document.write(`<title>Ознакомление с приказом</title><h2>Кто ознакомился</h2><table border="1" cellpadding="8" style="border-collapse:collapse"><tr><th>Название приказа</th><th>ФИО</th><th>Дата и время</th></tr>${lines}</table>`);w.document.close();}
  };
  function canDeleteDocument(d){return isAdmin() || d?.uploadedBy===state.currentUser?.login;}
  window.deleteDocument=async function(id){
    const d=state.documents.find(x=>x.id===id);if(!d||!canDeleteDocument(d))return;
    if(!confirm(`Удалить карточку документа «${d.title||d.fileName}»? Сам файл останется на Яндекс Диске.`))return;
    try{if(d.id)await sbMutate("document_records","DELETE",`id=eq.${encodeURIComponent(d.id)}`);}catch(e){return alert("Не удалось удалить карточку документа: "+(e.message||"ошибка Supabase"));}
    state.documents=state.documents.filter(x=>x.id!==id);save();renderDocSection(state.currentPage,d.sectionKey.split("::")[1]);
  };
  window.uploadPortfolio=async function(){
    if(isGuest())return alert("В режиме гостя добавление документов недоступно.");
    const f=document.getElementById("portfolioFile")?.files[0];if(!f)return alert("Выберите документ.");
    const folderUrl=yandexFolderForPage("mydata");if(!folderUrl)return alert("Для «Мои данные» не настроена папка Яндекс Диска.");
    try{const uploaded=await uploadToYandexFolder(f,folderUrl,"mydata","Портфолио");state.portfolio[state.currentUser.login]=state.portfolio[state.currentUser.login]||[];state.portfolio[state.currentUser.login].push({name:f.name,url:uploaded.public_url||uploaded.url||"",uploadedAt:new Date().toISOString()});save();alert("Документ добавлен на Яндекс Диск.");render();}
    catch(e){alert("Не удалось загрузить документ: "+(e.message||"ошибка Яндекс Диска."));}
  };
  window.deletePortfolio=function(i){const a=state.portfolio[state.currentUser.login]||[];if(confirm("Удалить документ из портфолио?")){a.splice(i,1);state.portfolio[state.currentUser.login]=a;save();render();}};
    window.uploadClassRoster=async function(){
      if(!isAdmin())return;
      const f=document.getElementById("rosterFile")?.files?.[0];
      if(!f)return alert("Выберите Excel-файл.");
      try{
        const data=await f.arrayBuffer();
        const wb=XLSX.read(data,{type:"array"});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
        const normalizeKey=k=>String(k||"").toLowerCase().replace(/[^a-zа-яё0-9]/gi,"");
        const get=(row,candidates)=>{
          for(const key of Object.keys(row)){
            const nk=normalizeKey(key);
            if(candidates.some(c=>nk===normalizeKey(c)||nk.includes(normalizeKey(c))))return row[key];
          }
          return "";
        };
        const normalizeClassName=value=>String(value||"").trim().replace(/\s+/g,"").replace(/-/g,"").toUpperCase();
        const parsed=rows.map((r,i)=>{
          const rawName=get(r,["Класс","class","class_name"]);
          const name=normalizeClassName(rawName);
          const m=name.match(/^(\d{1,2})([А-ЯЁA-Z])$/);
          const studentCount=+String(get(r,["Кол-во учеников","Количество учеников","student_count","students"])||0).replace(/,/g,".");
          const shift=+String(get(r,["Смена","shift"])||0);
          return {row:i+2,name,grade:m?+m[1]:0,letter:m?m[2]:"",studentCount,shift};
        }).filter(x=>x.name);
        const invalid=parsed.filter(x=>!x.grade||!x.letter||x.grade<1||x.grade>11);
        if(!parsed.length)throw new Error("Не найдены строки с классами.");
        if(invalid.length)throw new Error(`Не удалось распознать класс(ы): ${invalid.map(x=>`строка ${x.row}: ${x.name}`).join(", ")}. Используйте формат 6А, 6Б, 7А и т.п.`);
        const duplicateNames=parsed.filter((x,i,a)=>a.findIndex(y=>y.name===x.name)===i && a.filter(y=>y.name===x.name).length>1).map(x=>x.name);
        if(duplicateNames.length)throw new Error(`В Excel повторяются классы: ${duplicateNames.join(", ")}. Оставьте по одной строке на класс.`);

        const yearId=await getCurrentAcademicYearId();
        const {data:{session}}=await supabase.auth.getSession();
        if(!session)throw new Error("Нет активной сессии Supabase.");
        if(!yearId)throw new Error("Не найден учебный год 2026-2027 в таблице academic_years.");

        // Важно: больше не пытаемся сначала найти класс через SELECT, а затем POST.
        // Даже если SELECT ограничен RLS, upsert корректно обработает уже существующий
        // класс по уникальному ключу (grade, letter, academic_year_id).
        for(const item of parsed){
          const resp=await fetch(`${SUPABASE_URL}/rest/v1/classes?on_conflict=grade,letter,academic_year_id`,{
            method:"POST",
            headers:{
              apikey:SUPABASE_PUBLISHABLE_KEY,
              Authorization:`Bearer ${session.access_token}`,
              "Content-Type":"application/json",
              Prefer:"resolution=merge-duplicates,return=minimal"
            },
            body:JSON.stringify({
              grade:item.grade,
              letter:item.letter,
              is_active:true,
              academic_year_id:yearId,
              student_count:item.studentCount,
              shift:item.shift
            })
          });
          if(!resp.ok){
            const txt=await resp.text();
            throw new Error(`Не удалось сохранить класс ${item.name}: HTTP ${resp.status} ${txt}`);
          }
        }

        // Только после успешного upsert всех строк деактивируем классы,
        // которых нет в новой ведомости.
        let currentRows=[];
        try{
          currentRows=await sbRest("classes");
        }catch(e){
          console.warn("Не удалось прочитать классы для деактивации:",e);
        }
        const existing=(currentRows||[]).filter(r=>String(r.academic_year_id??"")===String(yearId));
        const wanted=new Set(parsed.map(x=>x.name));
        for(const old of existing){
          const oldName=classNameFromRow(old);
          if(oldName && !wanted.has(oldName) && old.is_active!==false){
            const resp=await fetch(`${SUPABASE_URL}/rest/v1/classes?id=eq.${encodeURIComponent(old.id)}`,{
              method:"PATCH",
              headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json",Prefer:"return=minimal"},
              body:JSON.stringify({is_active:false})
            });
            if(!resp.ok)throw new Error(`Не удалось деактивировать прежний класс ${oldName}: HTTP ${resp.status}`);
          }
        }

        state.classRoster=parsed.map(x=>({name:x.name,grade:x.grade,letter:x.letter,studentCount:x.studentCount,shift:x.shift,academicYearId:yearId}));
        save();
        const info=document.getElementById("rosterInfo");
        if(info)info.textContent=`Загружено классов: ${parsed.length}. Данные классов сохранены в Supabase для 2026-2027 учебного года.`;
        alert(`Контингент обновлён: ${parsed.length} классов.`);
        render();
      }catch(e){
        console.error(e);
        alert("Не удалось обновить контингент: "+(e.message||"проверьте Excel и права доступа."));
      }
    };
  window.changePassword=function(){const p=prompt("Новый пароль:");if(p)alert("В MVP пароль изменен локально. В серверной версии изменение будет сохранено в учетной записи.");};
  function downloadCSV(headers,rows,name){const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")).join("\n");const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}
  function searchCatalogue(){return [
    ["Главная","home"],["Расписание","schedule"],["Подвоз","transport"],["Уведомления","notifications"],["Всеобуч","vseobuch"],["Учебная работа","education"],["Электронный журнал","journal"],["Воспитательная работа","upbringing"],["Обучающиеся с ОВЗ и инвалидностью","ovz"],["Олимпиадное и конкурсное движение","olymp"],["ЕГЭ / ОГЭ","gia"],["Методическая работа","attestation"],["Безопасность","security"],["Профориентация","career"],["Социально-психологическая служба","psych"],["Отчеты","reports"],["Архив","archive"],["Аналитика","analytics"],["Мои данные","mydata"],["Настройки","settings"],["Администрирование","admin"],
    ["График предметных недель","attestation"],["Приказы","attestation"],["Аттестация","attestation"],["Конкурсы профессионального мастерства","attestation"],["Повышение квалификации","attestation"],["Методическая копилка","attestation"],
    ...["МО Начальной школы","МО Естественнонаучного цикла","МО Русского языка и литературы","МО Математики","МО Истории и обществознания","МО Иностранных языков","МО Физической культуры и ОБЗР","МО Технологии, ИЗО, Музыки"].map(x=>[x,"attestation"])
  ];}
  function performGlobalSearch(q){
    const query=String(q||"").trim().toLowerCase();
    if(!query)return;
    const results=[];
    searchCatalogue().forEach(([title,page])=>{if(title.toLowerCase().includes(query))results.push({title,page,type:"Раздел виртуальной учительской"});});
    (state.documents||[]).forEach(d=>{const t=String(d.title||d.fileName||"");if(t.toLowerCase().includes(query))results.push({title:t,page:d.sectionKey?.split("::")[0]||"home",sectionTitle:d.sectionKey?.split("::")[1]||"",type:"Документ"});});
    (state.users||[]).forEach(u=>{if(String(u.name||"").toLowerCase().includes(query)||String(u.login||"").toLowerCase()===query)results.push({title:u.name,page:"admin",type:"Сотрудник"});});
    const html=results.length?results.slice(0,40).map(r=>{
      const click=r.type==="Документ"?`openDocs('${escapeHtml(r.page)}','${escapeHtml(r.sectionTitle||r.title)}')`:`navigate('${escapeHtml(r.page)}')`;
      return `<div class="search-result" onclick="${click}"><strong>${escapeHtml(r.title)}</strong><small>${escapeHtml(r.type)}</small></div>`;
    }).join(""):('<div class="card"><div class="empty">Ничего не найдено.</div></div>');
    shell("Результаты поиска",`По запросу «${escapeHtml(q)}» найдено: <b>${results.length}</b>.`,`<div class="search-results">${html}</div>`);
  }
  document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
  document.getElementById("topNotify").addEventListener("click",()=>navigate("notifications"));
  document.getElementById("globalSearch")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();performGlobalSearch(e.target.value);}});
  function closeMobileMenu(){document.querySelector(".sidebar")?.classList.remove("mobile-open");document.getElementById("mobileOverlay")?.classList.remove("show");}
  document.getElementById("mobileMenuBtn")?.addEventListener("click",()=>{document.querySelector(".sidebar")?.classList.toggle("mobile-open");document.getElementById("mobileOverlay")?.classList.toggle("show");});
  document.getElementById("mobileOverlay")?.addEventListener("click",closeMobileMenu);
  document.getElementById("profileToggle").addEventListener("click",()=>document.getElementById("profileMenu").classList.toggle("hidden"));
  document.querySelectorAll("#profileMenu [data-page]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
  document.getElementById("logoutBtn").addEventListener("click",async()=>{if(supabase)await supabase.auth.signOut();state.currentUser=null;localStorage.removeItem("schoolSolutionsSession");document.getElementById("app").classList.add("hidden");document.getElementById("authScreen").classList.remove("hidden");});
  document.getElementById("guestMode")?.addEventListener("change",e=>{const p=document.getElementById("password"),l=document.getElementById("login");if(e.target.checked){l.value="guest";p.value="";l.readOnly=true;p.disabled=true;p.required=false;}else{l.readOnly=false;p.disabled=false;p.required=true;l.value="";}});
  async function resolveLoginEmail(login){
    const normalized=String(login||"").trim().toLowerCase();
    if(!normalized)return "";
    if(normalized==="admin")return SUPABASE_ADMIN_EMAIL;
    if(normalized.includes("@"))return normalized;
    // Учётные записи учителей, созданные администратором через Edge Function,
    // получают технический Auth-email вида login@auth.eco-school.ru.
    // На экране пользователь вводит только свой короткий логин.
    return `${normalized}@auth.eco-school.ru`;
  }
  async function loginWithSupabase(login,password){
    if(!supabase)return {error:"Не удалось загрузить Supabase."};
    const email=await resolveLoginEmail(login);
    if(!email)return {error:"Введите логин."};
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error){
      if(error.message?.toLowerCase().includes("invalid login credentials"))return {error:"Неверный логин или пароль. Для администратора используйте логин admin и пароль, установленный в Supabase."};
      return {error:error.message};
    }
    if(!(await loadRealEmployees(data.user)))return {error:state.realEmployeesError||"Не удалось загрузить сотрудников из базы."};
    return {user:data.user};
  }
  async function requestPasswordReset(){
    if(!supabase)return;
    const login=document.getElementById("login")?.value.trim();
    const email=login?await resolveLoginEmail(login):SUPABASE_ADMIN_EMAIL;
    if(!email){document.getElementById("loginError").textContent="Введите логин.";return;}
    const redirectTo="http://eco-school.ru/";
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});
    document.getElementById("loginError").textContent=error?error.message:"Письмо для смены пароля отправлено на почту.";
  }
  function showRecoveryForm(){
    document.getElementById("authScreen").innerHTML=`<div class="auth-brand"><img class="brand-logo" src="https://igxtfnoqjrykgntsftve.supabase.co/functions/v1/yandex-disk-upload?action=logo" alt="Логотип Школы Экодолье"><h1>Школа<br>решений</h1><p>Виртуальная учительская МАОУ «Школа Экодолье»</p><div class="slogan">Меньше рутины. Больше времени для детей.</div></div><div class="auth-panel"><form class="login-card" id="recoveryForm"><h2>Новый пароль</h2><p class="sub">Введите новый пароль для входа в виртуальную учительскую.</p><label for="newPassword">Новый пароль</label><input id="newPassword" type="password" minlength="6" required placeholder="Введите новый пароль"><label for="newPassword2">Повторите пароль</label><input id="newPassword2" type="password" minlength="6" required placeholder="Повторите новый пароль"><button class="primary" type="submit">Сохранить пароль</button><div class="error" id="recoveryError"></div></form></div>`;
    document.getElementById("recoveryForm").addEventListener("submit",async e=>{
      e.preventDefault();
      const a=document.getElementById("newPassword").value,b=document.getElementById("newPassword2").value,err=document.getElementById("recoveryError");
      if(a!==b){err.textContent="Пароли не совпадают.";return;}
      if(a.length<6){err.textContent="Пароль должен содержать не менее 6 символов.";return;}
      const {error}=await supabase.auth.updateUser({password:a});
      if(error){err.textContent=error.message;return;}
      await supabase.auth.signOut();
      window.location.replace(window.location.origin+window.location.pathname);
    });
  }
  document.getElementById("forgotPasswordBtn")?.addEventListener("click",requestPasswordReset);
  document.getElementById("loginForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const errorBox=document.getElementById("loginError");
    const submitBtn=e.currentTarget.querySelector('button[type="submit"]');
    const guestMode=document.getElementById("guestMode")?.checked;
    const login=guestMode?"guest":document.getElementById("login").value.trim();
    const password=document.getElementById("password").value;
    if(errorBox)errorBox.textContent="";
    if(submitBtn){submitBtn.disabled=true;submitBtn.textContent="Входим…";}
    try{
      if(guestMode){
        state.currentUser={...USERS.guest};state.currentPage="home";save();localStorage.setItem("schoolSolutionsSession","guest");
        document.getElementById("authScreen").classList.add("hidden");document.getElementById("app").classList.remove("hidden");render();return;
      }
      if(!login){if(errorBox)errorBox.textContent="Введите логин.";return;}
      const result=await loginWithSupabase(login,password);
      if(result?.error){if(errorBox)errorBox.textContent=result.error;return;}
      await loadAppSettingsFromSupabase();
      await loadUserAssignments();
      await loadDocumentsFromSupabase();
      state.currentPage="home";save();localStorage.setItem("schoolSolutionsSession","supabase");
      document.getElementById("authScreen").classList.add("hidden");document.getElementById("app").classList.remove("hidden");
      if(errorBox)errorBox.textContent="";
      render();
    }catch(err){
      console.error("Ошибка входа:",err);
      if(errorBox)errorBox.textContent="Не удалось выполнить вход: "+(err?.message||String(err));
    }finally{
      if(submitBtn){submitBtn.disabled=false;submitBtn.textContent="Войти";}
    }
  });
  window.navigate=function(page){closeMobileMenu();if(isGuest()&&!guestPageAllowed(page))return;if(page==="attendance"){state.currentPage="attendance";}else{state.currentPage=page;}save();document.getElementById("profileMenu").classList.add("hidden");render();window.scrollTo({top:0,behavior:"smooth"});};
  const oldTaskBadge=document.getElementById("taskBadge");
  /* startup is executed from core.js after all modules are loaded */
  window.__schoolBase = window.__schoolBase || {};
  window.__schoolBase["SUPABASE_URL"] = SUPABASE_URL;
  window.__schoolBase["SUPABASE_PUBLISHABLE_KEY"] = SUPABASE_PUBLISHABLE_KEY;
  window.__schoolBase["SUPABASE_ADMIN_EMAIL"] = SUPABASE_ADMIN_EMAIL;
  window.__schoolBase["SUPABASE_FUNCTION_URL"] = SUPABASE_FUNCTION_URL;
  window.__schoolBase["YANDEX_UPLOAD_FUNCTION_URL"] = YANDEX_UPLOAD_FUNCTION_URL;
  window.__schoolBase["YANDEX_FOLDERS"] = YANDEX_FOLDERS;
  window.__schoolBase["supabase"] = supabase;
  window.__schoolBase["USERS"] = USERS;
  window.__schoolBase["defaultState"] = defaultState;
  window.__schoolBase["clone"] = clone;
  window.__schoolBase["state"] = state;
  window.__schoolBase["normalizeEmployeeName"] = normalizeEmployeeName;
  window.__schoolBase["firstValue"] = firstValue;
  window.__schoolBase["inferRoleKeys"] = inferRoleKeys;
  window.__schoolBase["classNameFromRow"] = classNameFromRow;
  window.__schoolBase["classRosterForUser"] = classRosterForUser;
  window.__schoolBase["yandexFolderForPage"] = yandexFolderForPage;
  window.__schoolBase["loadState"] = loadState;
  window.__schoolBase["deepMerge"] = deepMerge;
  window.__schoolBase["save"] = save;
  window.__schoolBase["dateIsoLocal"] = dateIsoLocal;
  window.__schoolBase["dateInfo"] = dateInfo;
  window.__schoolBase["nextSchoolDay"] = nextSchoolDay;
  window.__schoolBase["formatRuDate"] = formatRuDate;
  window.__schoolBase["ensureBellMatrix"] = ensureBellMatrix;
  window.__schoolBase["bellCell"] = bellCell;
  window.__schoolBase["renderBellMatrixTable"] = renderBellMatrixTable;
  window.__schoolBase["roleLabel"] = roleLabel;
  window.__schoolBase["initials"] = initials;
  window.__schoolBase["isManager"] = isManager;
  window.__schoolBase["isAdmin"] = isAdmin;
  window.__schoolBase["isSecretary"] = isSecretary;
  window.__schoolBase["isDispatcher"] = isDispatcher;
  window.__schoolBase["canManageOrders"] = canManageOrders;
  window.__schoolBase["isGuest"] = isGuest;
  window.__schoolBase["roleName"] = roleName;
  window.__schoolBase["rolesText"] = rolesText;
  window.__schoolBase["unread"] = unread;
  window.__schoolBase["pendingTasks"] = pendingTasks;
  window.__schoolBase["newTransport"] = newTransport;
  window.__schoolBase["unreadOrderCounts"] = unreadOrderCounts;
  window.__schoolBase["updateBadges"] = updateBadges;
  window.__schoolBase["render"] = render;
  window.__schoolBase["shell"] = shell;
  window.__schoolBase["taskHtml"] = taskHtml;
  window.__schoolBase["noticeHtml"] = noticeHtml;
  window.__schoolBase["givenNamePatronymic"] = givenNamePatronymic;
  window.__schoolBase["renderHome"] = renderHome;
  window.__schoolBase["renderTasks"] = renderTasks;
  window.__schoolBase["renderAttendance"] = renderAttendance;
  window.__schoolBase["attField"] = attField;
  window.__schoolBase["renderTransport"] = renderTransport;
  window.__schoolBase["renderPlan"] = renderPlan;
  window.__schoolBase["renderSchedule"] = renderSchedule;
  window.__schoolBase["renderNotifications"] = renderNotifications;
  window.__schoolBase["renderPlaceholder"] = renderPlaceholder;
  window.__schoolBase["guestPageAllowed"] = guestPageAllowed;
  window.__schoolBase["guestAllowed"] = guestAllowed;
  window.__schoolBase["docKey"] = docKey;
  window.__schoolBase["userCanSeeDoc"] = userCanSeeDoc;
  window.__schoolBase["unreadDocs"] = unreadDocs;
  window.__schoolBase["moduleCard"] = moduleCard;
  window.__schoolBase["normativeCard"] = normativeCard;
  window.__schoolBase["normativeCardNoLocal"] = normativeCardNoLocal;
  window.__schoolBase["securityNormativeCard"] = securityNormativeCard;
  window.__schoolBase["giaHalf"] = giaHalf;
  window.__schoolBase["renderMyData"] = renderMyData;
  window.__schoolBase["renderAdmin"] = renderAdmin;
  window.__schoolBase["renderSettings"] = renderSettings;
  window.__schoolBase["escapeHtml"] = escapeHtml;
  window.__schoolBase["classSort"] = classSort;
  window.__schoolBase["closeNotifyModal"] = closeNotifyModal;
  window.__schoolBase["openNotifyModal"] = openNotifyModal;
  window.__schoolBase["renderBellEditorTable"] = renderBellEditorTable;
  window.__schoolBase["renderBellRows"] = renderBellRows;
  window.__schoolBase["normalizeClass"] = normalizeClass;
  window.__schoolBase["parseDateFromText"] = parseDateFromText;
  window.__schoolBase["cellVal"] = cellVal;
  window.__schoolBase["looksLikeTeacherName"] = looksLikeTeacherName;
  window.__schoolBase["parseScheduleWorkbook"] = parseScheduleWorkbook;
  window.__schoolBase["parseBaseScheduleWorkbook"] = parseBaseScheduleWorkbook;
  window.__schoolBase["getScheduleForDate"] = getScheduleForDate;
  window.__schoolBase["normalizePersonName"] = normalizePersonName;
  window.__schoolBase["teacherMatches"] = teacherMatches;
  window.__schoolBase["scheduleForUser"] = scheduleForUser;
  window.__schoolBase["scheduleShiftFor"] = scheduleShiftFor;
  window.__schoolBase["renderScheduleTable"] = renderScheduleTable;
  window.__schoolBase["renderScheduleSelector"] = renderScheduleSelector;
  window.__schoolBase["renderScheduleHomeSelector"] = renderScheduleHomeSelector;
  window.__schoolBase["hasUnreadSchedule"] = hasUnreadSchedule;
  window.__schoolBase["markScheduleRead"] = markScheduleRead;
  window.__schoolBase["renderBaseScheduleSelector"] = renderBaseScheduleSelector;
  window.__schoolBase["renderGuestHomeSchedule"] = renderGuestHomeSchedule;
  window.__schoolBase["renderGuestSchedulePage"] = renderGuestSchedulePage;
  window.__schoolBase["docUploadAllowed"] = docUploadAllowed;
  window.__schoolBase["docTargetLabel"] = docTargetLabel;
  window.__schoolBase["markDocsReadForCurrent"] = markDocsReadForCurrent;
  window.__schoolBase["sectionDocs"] = sectionDocs;
  window.__schoolBase["renderDocSection"] = renderDocSection;
  window.__schoolBase["renderDocItem"] = renderDocItem;
  window.__schoolBase["canDeleteDocument"] = canDeleteDocument;
  window.__schoolBase["downloadCSV"] = downloadCSV;
  window.__schoolBase["searchCatalogue"] = searchCatalogue;
  window.__schoolBase["performGlobalSearch"] = performGlobalSearch;
  window.__schoolBase["closeMobileMenu"] = closeMobileMenu;
  window.__schoolBase["showRecoveryForm"] = showRecoveryForm;
})();
