/* REPORTS.JS — Reports module */
(function(){
/* ---------- Reports → 1 trimester: Input diagnostics ---------- */
function inputDiagnosticTeacherName(name){const parts=String(name||'').trim().split(/\s+/).filter(Boolean);if(!parts.length)return '';return parts[0]+(parts[1]?' '+parts[1][0]+'.':'')+(parts[2]?' '+parts[2][0]+'.':'');}
function inputDiagnosticClasses(){const app=window.__appState||{};const names=new Set();(app.classRoster||[]).forEach(r=>{if(r?.name)names.add(String(r.name).trim());});(app.users||[]).forEach(u=>[...(u.classes||[]),...(u.attendanceClasses||[])].forEach(c=>{if(c)names.add(String(c).trim());}));const cmp=window.__appClassSort||((a,b)=>String(a).localeCompare(String(b),'ru'));return [...names].filter(Boolean).sort(cmp);}
function renderInputDiagnostics(){
  const app = window.__appState || {};
  const classes = inputDiagnosticClasses();
  const teacher = inputDiagnosticTeacherName(app.currentUser?.name || '');

  if (!window.__appShell) {
    return alert('Интерфейс приложения ещё не готов. Обновите страницу.');
  }

  const esc = window.__appEscapeHtml || (s => String(s ?? ''));
  const today = window.__appDateInfo
    ? window.__appDateInfo().iso
    : new Date().toISOString().slice(0, 10);

  window.__appShell(
    'Отчеты за 1 триместр',
    'Входная диагностика',
    `<div class="card">
      <h3>Входная диагностика</h3>

      <div class="diag-form">

        <div class="diag-row diag-meta-row">
          <div class="diag-field">
            <label for="diagClass">Класс</label>
            <select id="diagClass">
              <option value="">Выберите класс</option>
              ${classes.map(c =>
                `<option value="${esc(c)}">${esc(c)}</option>`
              ).join('')}
            </select>
          </div>

          <div class="diag-field">
            <label for="diagSubject">Предмет</label>
            <input id="diagSubject" type="text" placeholder="Введите предмет">
          </div>

          <div class="diag-field">
            <label for="diagTeacher">Учитель</label>
            <input id="diagTeacher" type="text"
                   value="${esc(teacher)}" readonly>
          </div>

          <div class="diag-field">
            <label for="diagDate">Дата</label>
            <input id="diagDate" type="date" value="${today}">
          </div>
        </div>

        <div class="diag-row diag-results-row">
          <div class="diag-field">
            <label for="diagStudents">Кол-во писавших</label>
            <input id="diagStudents" type="number" min="0" step="1"
                   inputmode="numeric" oninput="recalcInputDiagnostic()">
          </div>

          <div class="diag-field">
            <label>Результаты</label>
            <div class="target-grid target-grid-four">
              <label>2
                <input id="diagGrade2" type="number" min="0" step="1"
                       oninput="recalcInputDiagnostic()">
              </label>
              <label>3
                <input id="diagGrade3" type="number" min="0" step="1"
                       oninput="recalcInputDiagnostic()">
              </label>
              <label>4
                <input id="diagGrade4" type="number" min="0" step="1"
                       oninput="recalcInputDiagnostic()">
              </label>
              <label>5
                <input id="diagGrade5" type="number" min="0" step="1"
                       oninput="recalcInputDiagnostic()">
              </label>
            </div>
          </div>
        </div>

        <div class="diag-row diag-summary-row">
          <div class="diag-field">
            <label for="diagAchievement">Успеваемость</label>
            <input id="diagAchievement" type="text" readonly value="0,00%">
          </div>

          <div class="diag-field">
            <label for="diagQuality">Качество</label>
            <input id="diagQuality" type="text" readonly value="0,00%">
          </div>
        </div>

        <div class="diag-field">
          <label for="diagCorrection">Планируемая коррекционная работа</label>
          <textarea id="diagCorrection" maxlength="1000" rows="4"
                    placeholder="До 1000 символов"></textarea>
        </div>

        <div class="diag-actions">
          <button class="btn"
                  onclick="openDocs('reports','Отчеты за 1 триместр')">
            Назад
          </button>
          <button class="btn green" onclick="submitInputDiagnostic()">
            Отправить
          </button>
          <button class="btn" onclick="viewInputDiagnostics()">
            Посмотреть результаты
          </button>
          <button class="btn" onclick="exportInputDiagnostics()">
            Выгрузить Excel
          </button>
        </div>

        <div id="diagMessage" class="muted"></div>
        <div id="diagResults"></div>

      </div>
    </div>`
  );
}
window.openInputDiagnostics=function(){const app=window.__appState;if(!app)return alert('Приложение ещё не готово. Обновите страницу.');app.currentPage='reports';renderInputDiagnostics();};
window.recalcInputDiagnostic=function(){const total=Number(document.getElementById('diagStudents')?.value)||0,g3=Number(document.getElementById('diagGrade3')?.value)||0,g4=Number(document.getElementById('diagGrade4')?.value)||0,g5=Number(document.getElementById('diagGrade5')?.value)||0,a=total?(g3+g4+g5)/total*100:0,q=total?(g4+g5)/total*100:0,ae=document.getElementById('diagAchievement'),qe=document.getElementById('diagQuality');if(ae)ae.value=a.toFixed(2).replace('.',',')+'%';if(qe)qe.value=q.toFixed(2).replace('.',',')+'%';};
window.submitInputDiagnostic=async function(){const cls=document.getElementById('diagClass')?.value.trim(),subject=document.getElementById('diagSubject')?.value.trim(),assessmentDate=document.getElementById('diagDate')?.value,total=Number(document.getElementById('diagStudents')?.value)||0,g2=Number(document.getElementById('diagGrade2')?.value)||0,g3=Number(document.getElementById('diagGrade3')?.value)||0,g4=Number(document.getElementById('diagGrade4')?.value)||0,g5=Number(document.getElementById('diagGrade5')?.value)||0;if(!cls||!subject||!assessmentDate)return alert('Заполните класс, предмет и дату проведения.');if(g2+g3+g4+g5!==total)return alert('Сумма результатов по оценкам 2–5 должна совпадать с количеством писавших работу.');const achievement=total?(g3+g4+g5)/total*100:0,quality=total?(g4+g5)/total*100:0,payload={class_name:cls,subject,teacher_employee_id:Number(window.__appState?.currentUser?.id)||null,teacher_name:inputDiagnosticTeacherName(window.__appState?.currentUser?.name||''),assessment_date:assessmentDate,students_count:total,grade_2:g2,grade_3:g3,grade_4:g4,grade_5:g5,value_a:document.getElementById('diagValueA')?.value.trim()||'',value_b:document.getElementById('diagValueB')?.value.trim()||'',value_v:document.getElementById('diagValueV')?.value.trim()||'',value_g:document.getElementById('diagValueG')?.value.trim()||'',achievement_percent:Number(achievement.toFixed(2)),quality_percent:Number(quality.toFixed(2)),correction_work:document.getElementById('diagCorrection')?.value.trim()||''};try{const academicYearId=typeof window.__appGetCurrentAcademicYearId==='function'?await window.__appGetCurrentAcademicYearId():null;if(academicYearId!=null)payload.academic_year_id=Number(academicYearId)||null;if(typeof window.__appSbMutate!=='function')throw new Error('Интерфейс приложения ещё не готов.');await window.__appSbMutate('input_diagnostics','POST','',payload);const msg=document.getElementById('diagMessage');if(msg)msg.textContent='Отчет сохранён.';alert('Входная диагностика сохранена.');}catch(e){console.error(e);alert('Не удалось сохранить отчет: '+(e.message||e));}};
window.exportInputDiagnostics=async function(){try{const rows=await window.__appSbRest('input_diagnostics','select=*'),headers=['Класс','Предмет','Учитель','Дата проведения','Кол-во писавших','2','3','4','5','Успеваемость','Качество','Значение А','Значение Б','Значение В','Значение Г','Планируемая коррекционная работа'],data=(rows||[]).sort((a,b)=>String(b.assessment_date||'').localeCompare(String(a.assessment_date||''))).map(r=>[r.class_name,r.subject,r.teacher_name,r.assessment_date,r.students_count,r.grade_2,r.grade_3,r.grade_4,r.grade_5,Number(r.achievement_percent||0).toFixed(2)+'%',Number(r.quality_percent||0).toFixed(2)+'%',r.value_a,r.value_b,r.value_v,r.value_g,r.correction_work]);if(window.XLSX){const ws=window.XLSX.utils.aoa_to_sheet([headers,...data]),wb=window.XLSX.utils.book_new();ws['!cols']=headers.map((h,i)=>({wch:i===15?45:(i<4?20:16)}));window.XLSX.utils.book_append_sheet(wb,ws,'Входная диагностика');window.XLSX.writeFile(wb,'входная_диагностика.xlsx');}else downloadCSV(headers,data,'входная_диагностика.csv');}catch(e){console.error(e);alert('Не удалось получить результаты: '+(e.message||e));}};
  window.App = window.App || {};
  window.App.reports = window.App.reports || {};
  
if(typeof state!=='undefined' && state?.currentPage==='reports'){ setTimeout(()=>window.App.reports.render(),0); }
window.App.reports.inputDiagnostics = {
    render:function(){return typeof window.renderInputDiagnostics==='function'?window.renderInputDiagnostics():null;},
    open:function(){return typeof window.openInputDiagnostics==='function'?window.openInputDiagnostics():null;},
    recalc:function(){return typeof window.recalcInputDiagnostic==='function'?window.recalcInputDiagnostic():null;},
    submit:function(){return typeof window.submitInputDiagnostic==='function'?window.submitInputDiagnostic():null;},
    export:function(){return typeof window.exportInputDiagnostics==='function'?window.exportInputDiagnostics():null;}
  };
window.App.reports.render = function(){
  if (typeof window.shell !== 'function') return;

  const responsibleBlock =
    typeof window.responsibleBlockFor === 'function'
      ? window.responsibleBlockFor('reports')
      : '';

  const cards = [
    ['Отчеты на начало года', 'Формы отчетов'],
    ['Отчеты за 1 триместр', 'Формы отчетов'],
    ['Отчеты за 2 триместр', 'Формы отчетов'],
    ['Отчеты за год', 'Формы отчетов']
  ];

  const body = `<div class="module-grid">
    ${cards.map(([title, subtitle]) => `
      <div class="module-card"
           onclick="openDocs('reports','${title}')">
        <div class="module-icon">📊</div>
        <div class="module-card-title">${title}</div>
        <div class="muted">${subtitle}</div>
        <div class="module-folder">📂 Открыть папку →</div>
      </div>
    `).join('')}
  </div>`;

  window.shell(
    'Отчеты',
    responsibleBlock + 'Периодические отчеты заполняются по установленным формам.',
    body
  );
};
