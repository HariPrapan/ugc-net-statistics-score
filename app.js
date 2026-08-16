pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const ANSWER_KEY = {"55125114455":2,"55125114456":1,"55125114457":3,"55125114458":1,"55125114459":4,"55125114460":4,"55125114461":2,"55125114462":2,"55125114463":4,"55125114464":1,"55125114465":1,"55125114466":1,"55125114467":4,"55125114468":3,"55125114469":4,"55125114470":3,"55125114471":3,"55125114472":1,"55125114473":3,"55125114474":3,"55125114475":2,"55125114476":3,"55125114477":4,"55125114478":4,"55125114479":4,"55125114480":2,"55125114481":1,"55125114482":3,"55125114483":1,"55125114484":2,"55125114485":3,"55125114486":3,"55125114487":3,"55125114488":4,"55125114489":3,"55125114490":3,"55125114491":4,"55125114492":2,"55125114493":1,"55125114494":3,"55125114495":2,"55125114496":3,"55125114497":2,"55125114498":4,"55125114499":4,"55125114500":4,"55125114501":2,"55125114502":4,"55125114503":3,"55125114504":2,"55125114505":4,"55125114506":1,"55125114507":4,"55125114508":3,"55125114509":2,"55125114510":4,"55125114511":2,"55125114512":3,"55125114513":1,"55125114514":1,"55125114515":4,"55125114516":3,"55125114517":2,"55125114518":2,"55125114519":3,"55125114520":4,"55125114521":1,"55125114522":4,"55125114523":4,"55125114524":2,"55125114525":3,"55125114526":1,"55125114527":2,"55125114528":1,"55125114529":3,"55125114530":3,"55125114531":3,"55125114532":1,"55125114533":3,"55125114534":4,"55125114535":1,"55125114536":4,"55125114537":3,"55125114538":1,"55125114539":2,"55125114540":3,"55125114541":1,"55125114542":4,"55125114543":3,"55125114544":4,"55125114545":3,"55125114546":1,"55125114547":2,"55125114548":4,"55125114549":2,"55125114550":4,"55125114551":2,"55125114552":3,"55125114553":1,"55125114554":3,"55125114555":4,"55125114556":3,"55125114557":2,"55125114558":4,"55125114559":2,"55125114560":2,"55125114561":3,"55125114562":2,"55125114563":2,"55125114564":1,"55125114565":4,"55125114566":4,"55125114567":3,"55125114568":1,"55125114569":3,"55125114570":2,"55125114571":4,"55125114572":2,"55125114573":2,"55125114574":3,"55125114575":2,"55125114576":3,"55125114577":4,"55125114578":3,"55125114579":4,"55125114580":2,"55125114581":2,"55125114582":2,"55125114583":4,"55125114584":2,"55125114585":3,"55125114586":4,"55125114587":4,"55125114588":2,"55125114589":4,"55125114590":4,"55125114591":4,"55125114592":3,"55125114593":3,"55125114594":2,"55125114597":2,"55125114598":4,"55125114599":1,"55125114600":3,"55125114601":4,"55125114603":2,"55125114604":2,"55125114605":3,"55125114606":4,"55125114607":3};
const MAX_MARKS = 300;
let results = [];

const $ = id => document.getElementById(id);

$("pdfInput").addEventListener("change", e => {
  const f=e.target.files[0];
  if(f) $("fileName").textContent=f.name;
});
$("calculate").addEventListener("click", calculate);
$("sectionFilter").addEventListener("change", renderTable);
$("resultFilter").addEventListener("change", renderTable);

const dropzone=$("dropzone");
["dragenter","dragover"].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.style.borderColor="#5968d7"}));
["dragleave","drop"].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.style.borderColor=""}));
dropzone.addEventListener("drop",e=>{
  const f=e.dataTransfer.files[0];
  if(f && f.type==="application/pdf") {
    const dt=new DataTransfer();dt.items.add(f);$("pdfInput").files=dt.files;
    $("fileName").textContent=f.name;
  }
});

function setStatus(msg,error=false){
  $("status").textContent=msg;
  $("status").classList.remove("hidden");
  $("status").classList.toggle("error",error);
}
function progress(p,msg){
  $("progressWrap").classList.remove("hidden");
  $("progressBar").style.width=Math.max(0,Math.min(100,p))+"%";
  $("progressText").textContent=msg;
}
function clean(s){return String(s??"").replace(/\s+/g," ").trim()}

function parseQuestions(text){
  const records=[];
  const re=/Question\s*ID\s*[:\-]?\s*([0-9]{5,})([\s\S]*?)(?=Question\s*ID\s*[:\-]?\s*[0-9]{5,}|$)/gi;
  let m;
  while((m=re.exec(text))){
    const qid=m[1],block=m[2];
    const chosenM=block.match(/Chosen\s*Option\s*[:\-]?\s*([1-4])/i);
    const statusM=block.match(/Status\s*[:\-]?\s*(Answered|Not\s*Answered|Not\s*Attempted|Not\s*Visited)/i);

    let section="Statistics";
    const before=text.slice(Math.max(0,m.index-800),m.index);
    if(/General\s*Paper/i.test(before) && !/Statistics/i.test(before.slice(-300))) section="General Paper";
    if(/Statistics/i.test(before.slice(-500))) section="Statistics";

    records.push({
      questionId:qid,
      chosen:chosenM?chosenM[1]:null,
      status:statusM?clean(statusM[1]):(chosenM?"Answered":"Not Answered"),
      section
    });
  }

  const seen=new Set();
  return records.filter(x=>{
    if(seen.has(x.questionId))return false;
    seen.add(x.questionId);return true;
  }).map((x,i)=>({...x,number:i+1}));
}

async function pdfTextPage(pdf,pageNo){
  const page=await pdf.getPage(pageNo);
  const tc=await page.getTextContent();
  return clean(tc.items.map(i=>i.str).join(" "));
}

async function ocrPage(pdf,pageNo,scale){
  const page=await pdf.getPage(pageNo);
  const viewport=page.getViewport({scale});
  const canvas=document.createElement("canvas");
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  await page.render({canvasContext:ctx,viewport}).promise;
  const out=await Tesseract.recognize(canvas,"eng");
  canvas.width=canvas.height=1;
  return out.data.text;
}

async function calculate(){
  const file=$("pdfInput").files[0];
  if(!file){setStatus("Please upload your Digialm response-sheet PDF.",true);return}
  $("calculate").disabled=true;
  try{
    progress(2,"Opening PDF…");
    const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
    let start=Math.max(1,parseInt($("startPage").value)||1);
    let end=parseInt($("endPage").value)||pdf.numPages;
    end=Math.min(end,pdf.numPages);
    if(start>end)throw new Error("Invalid page range.");

    let text="";
    for(let p=start;p<=end;p++){
      progress(5+((p-start)/(end-start+1))*55,`Reading page ${p} of ${end}…`);
      text+="\n"+await pdfTextPage(pdf,p);
    }

    let questions=parseQuestions(text);

    // Digialm PDFs can be image-only. If text extraction did not find enough
    // records, OCR the selected pages.
    if(questions.length<20){
      text="";
      for(let p=start;p<=end;p++){
        progress(60+((p-start)/(end-start+1))*35,`OCR page ${p} of ${end}…`);
        text+="\n"+await ocrPage(pdf,p,parseFloat($("scale").value)||1.6);
      }
      questions=parseQuestions(text);
    }

    if(!questions.length)throw new Error("No Question IDs were detected. Try OCR quality 2×.");
    results=questions.map(q=>{
      const correct=ANSWER_KEY[q.questionId]??null;
      const chosen=q.chosen;
      let result="unanswered",marks=0;
      if(chosen){
        result=correct===null?"wrong":(String(chosen)===String(correct)?"correct":"wrong");
        marks=result==="correct"?2:0;
      }
      return {...q,correct,result,marks};
    });

    render();
    const c=results.filter(x=>x.result==="correct").length;
    const w=results.filter(x=>x.result==="wrong").length;
    const u=results.filter(x=>x.result==="unanswered").length;
    const s=results.reduce((a,x)=>a+x.marks,0);
    progress(100,"Done.");
    setStatus(`Finished: ${results.length} questions detected • ${c} correct • ${w} wrong • ${u} unanswered • ${s} marks.`);
  }catch(e){
    console.error(e);
    setStatus(e.message||String(e),true);
  }finally{$("calculate").disabled=false}
}

function render(){
  const c=results.filter(x=>x.result==="correct").length;
  const w=results.filter(x=>x.result==="wrong").length;
  const u=results.filter(x=>x.result==="unanswered").length;
  const s=results.reduce((a,x)=>a+x.marks,0);

  $("correct").textContent=c;
  $("wrong").textContent=w;
  $("unanswered").textContent=u;
  $("score").textContent=`${s} / ${MAX_MARKS}`;

  const groups={};
  results.forEach(x=>(groups[x.section]??=[]).push(x));
  $("sectionCards").innerHTML=Object.entries(groups).map(([name,arr])=>{
    const cc=arr.filter(x=>x.result==="correct").length;
    const ww=arr.filter(x=>x.result==="wrong").length;
    const uu=arr.filter(x=>x.result==="unanswered").length;
    const ss=arr.reduce((a,x)=>a+x.marks,0);
    return `<div class="section-card"><h3>${esc(name)}</h3>
      <div class="section-score">${ss} / ${arr.length*2}</div>
      <div class="line"><span>Correct</span><b>${cc}</b></div>
      <div class="line"><span>Wrong</span><b>${ww}</b></div>
      <div class="line"><span>Unanswered</span><b>${uu}</b></div>
    </div>`;
  }).join("");

  $("sectionFilter").innerHTML='<option value="all">All sections</option>'+
    Object.keys(groups).map(x=>`<option value="${escAttr(x)}">${esc(x)}</option>`).join("");

  $("info").textContent=`${results.length} questions • embedded answer key • +2 per correct answer • no negative marking`;
  $("summary").classList.remove("hidden");
  $("details").classList.remove("hidden");
  renderTable();
}

function renderTable(){
  const sec=$("sectionFilter").value, rf=$("resultFilter").value;
  const rows=results.filter(x=>(sec==="all"||x.section===sec)&&(rf==="all"||x.result===rf));
  $("tbody").innerHTML=rows.map(x=>`
    <tr class="${x.result}-row">
      <td>${x.number}</td>
      <td>${esc(x.questionId)}</td>
      <td>${esc(x.section)}</td>
      <td>${esc(x.chosen??"—")}</td>
      <td>${esc(x.correct??"—")}</td>
      <td>${x.result==="correct"?"✓ Correct":x.result==="wrong"?"✗ Wrong":"— Unanswered"}</td>
      <td>${x.marks}</td>
    </tr>`).join("");
}

$("download").addEventListener("click",()=>{
  const rows=[["Question No","Question ID","Section","Your Answer","Correct Answer","Result","Marks"],
    ...results.map(x=>[x.number,x.questionId,x.section,x.chosen??"",x.correct??"",x.result,x.marks])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="ugc-net-score.csv";a.click();
  URL.revokeObjectURL(a.href);
});

function esc(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function escAttr(s){return esc(s).replaceAll(" ","&#32;")}
