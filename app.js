const BASE_SERV = 6;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const ingredients = [
  {id:'cabbage', group:'Kelkáposzta', name:'Kelkáposzta', amount:1500, unit:'g', note:'kb. 1 nagy fej'},
  {id:'cabbageSalt', group:'Kelkáposzta', name:'Só a főzővízhez', amount:2, unit:'tk', grams:12},
  {id:'cuminWater', group:'Kelkáposzta', name:'Kömény a főzővízhez', amount:.5, unit:'tk', grams:1.25, optional:true},
  {id:'meat', group:'Húsos-bulguros töltelék', name:'Darált sertéshús', amount:600, unit:'g', note:'lehetőleg kb. 10–15% zsírtartalom'},
  {id:'bulgur', group:'Húsos-bulguros töltelék', name:'Közepes szemű bulgur', amount:180, unit:'g', note:'szárazon mérve'},
  {id:'bulgurWater', group:'Húsos-bulguros töltelék', name:'Víz a bulgurhoz', amount:280, unit:'ml'},
  {id:'onion', group:'Húsos-bulguros töltelék', name:'Vöröshagyma', amount:1, unit:'db', grams:180, note:'nagy'},
  {id:'garlic', group:'Húsos-bulguros töltelék', name:'Fokhagyma', amount:3, unit:'gerezd', grams:15},
  {id:'fat', group:'Húsos-bulguros töltelék', name:'Olaj vagy sertészsír', amount:1, unit:'ek', grams:15},
  {id:'paprika', group:'Húsos-bulguros töltelék', name:'Őrölt fűszerpaprika', amount:1, unit:'ek', grams:8},
  {id:'marjoram', group:'Húsos-bulguros töltelék', name:'Majoránna', amount:1, unit:'tk', grams:1},
  {id:'cumin', group:'Húsos-bulguros töltelék', name:'Őrölt kömény', amount:.5, unit:'tk', grams:1.25, note:'ízlés szerint ½–1 tk'},
  {id:'pepper', group:'Húsos-bulguros töltelék', name:'Fekete bors', amount:.5, unit:'tk', grams:1},
  {id:'salt', group:'Húsos-bulguros töltelék', name:'Só', amount:1.5, unit:'tk', grams:9, note:'majd kóstolás szerint'},
  {id:'ragoutWater', group:'Húsos-bulguros töltelék', name:'Víz vagy enyhe alaplé', amount:120, unit:'ml', note:'kb. 100–150 ml / 6 adag'},
  {id:'sourcream', group:'Tejfölös réteg', name:'Tejföl', amount:450, unit:'g', note:'12%-os változattal is jól működik'},
  {id:'egg', group:'Tejfölös réteg', name:'Tojás', amount:1, unit:'db', grams:55},
  {id:'sourSalt', group:'Tejfölös réteg', name:'Só', amount:.5, unit:'tk', grams:3},
  {id:'sourWater', group:'Tejfölös réteg', name:'Víz a tejföl lazításához', amount:2.5, unit:'ek', grams:37.5, note:'kb. 2–3 ek / 6 adag'},
  {id:'cheese', group:'Opcionális', name:'Reszelt sajt', amount:70, unit:'g', note:'60–80 g / 6 adag', optional:true},
  {id:'chili', group:'Opcionális', name:'Csípős paprika', amount:1, unit:'ízlés szerint', optional:true}
];

let servings = Number(localStorage.getItem('rk_servings') || 6);
servings = Math.min(12, Math.max(2, servings));
let cookIndex = Number(localStorage.getItem('rk_cookIndex') || 0);
let wakeLock = null;
let deferredPrompt = null;

function fmtNum(n){
  if (Math.abs(n-Math.round(n))<0.045) return String(Math.round(n));
  if (n < 10) return n.toFixed(1).replace('.',',');
  return String(Math.round(n));
}
function scaled(i){
  const s = servings/BASE_SERV;
  const a = i.amount*s;
  let text = `${fmtNum(a)} ${i.unit}`;
  if (i.grams){
    const g = i.grams*s;
    text += ` (${fmtNum(g)} g)`;
  }
  return text;
}
function ing(id){ return ingredients.find(x=>x.id===id); }

function renderIngredients(){
  const root = $('#ingredients'); root.innerHTML='';
  let current='';
  ingredients.forEach(i=>{
    if(i.group!==current){
      current=i.group;
      const h=document.createElement('div'); h.className='section-title'; h.textContent=current; root.appendChild(h);
    }
    const row=document.createElement('label'); row.className='ingredient';
    const ck=document.createElement('input'); ck.type='checkbox'; ck.dataset.ingcheck=i.id;
    ck.checked=localStorage.getItem('rk_ing_'+i.id)==='1';
    if(ck.checked) row.classList.add('done');
    ck.addEventListener('change',()=>{ localStorage.setItem('rk_ing_'+i.id, ck.checked?'1':'0'); row.classList.toggle('done',ck.checked); });
    const mid=document.createElement('div');
    mid.innerHTML=`<span class="ing-name">${i.name}${i.optional?' <span class="small">(opcionális)</span>':''}</span>${i.note?`<span class="ing-note">${i.note}</span>`:''}`;
    const q=document.createElement('div'); q.className='ing-qty'; q.textContent=scaled(i);
    row.append(ck,mid,q); root.appendChild(row);
  });
}
function renderShopping(){
  const root=$('#shopping'); root.innerHTML='';
  let current='';
  ingredients.filter(i=>!['Víz a bulgurhoz','Víz vagy enyhe alaplé','Víz a tejföl lazításához','Só a főzővízhez','Só'].includes(i.name)).forEach(i=>{
    if(i.group!==current){
      current=i.group;
      const h=document.createElement('div'); h.className='section-title'; h.textContent=current; root.appendChild(h);
    }
    const row=document.createElement('label'); row.className='ingredient';
    const ck=document.createElement('input'); ck.type='checkbox';
    ck.checked=localStorage.getItem('rk_shop_'+i.id)==='1';
    if(ck.checked) row.classList.add('done');
    ck.addEventListener('change',()=>{ localStorage.setItem('rk_shop_'+i.id, ck.checked?'1':'0'); row.classList.toggle('done',ck.checked); });
    const mid=document.createElement('div');
    mid.innerHTML=`<span class="ing-name">${i.name}${i.optional?' <span class="small">(opcionális)</span>':''}</span>`;
    const q=document.createElement('div'); q.className='ing-qty'; q.textContent=scaled(i);
    row.append(ck,mid,q); root.appendChild(row);
  });
}
function updateInlineQty(){
  $$('.qty[data-ing]').forEach(el=>{ const i=ing(el.dataset.ing); if(i) el.textContent=scaled(i); });
}
function updateNutrition(){
  const s=servings;
  $('#servNutHead').textContent=`1 adag (${s} adagra osztva)`;
  $('#nKcal').textContent=`~${Math.round(2990/s/5)*5} kcal`;
  $('#nProt').textContent=`~${Math.round(200/s)} g`;
  $('#nCarb').textContent=`~${Math.round(268/s)} g`;
  $('#nFat').textContent=`~${Math.round(138/s)} g`;
}
function updateDish(){
  const L=Math.max(18,Number($('#dishL').value)||30);
  const W=Math.max(15,Number($('#dishW').value)||22);
  localStorage.setItem('rk_dishL',L); localStorage.setItem('rk_dishW',W);
  const baseArea=30*22, area=L*W;
  const thickness=5*(servings/BASE_SERV)*(baseArea/area);
  let t='35–40';
  if(thickness>6.5) t='45–50';
  else if(thickness>5.6) t='40–45';
  else if(thickness<3.7) t='28–33';
  else if(thickness<4.4) t='32–37';
  $('#dishAdvice').innerHTML=`Várható rétegvastagság: <strong>kb. ${thickness.toFixed(1).replace('.',',')} cm</strong>.<br>Kiinduló sütési javaslat: <strong>${t} perc 180 °C-on</strong>. A készültséget a bugyogó szélek és az összeállt, enyhén pirult tejföl mutatja.`;
  $('#bakeTimeInfo').textContent=t+' perc';
  $('#bakeTimeStep').textContent=t+' percig';
}
function updateAll(){
  $('#servOut').textContent=servings;
  localStorage.setItem('rk_servings',servings);
  renderIngredients(); renderShopping(); updateInlineQty(); updateNutrition(); updateDish();
}
$('#minusServ').addEventListener('click',()=>{ if(servings>2){servings--;updateAll();}});
$('#plusServ').addEventListener('click',()=>{ if(servings<12){servings++;updateAll();}});

const savedL=localStorage.getItem('rk_dishL'), savedW=localStorage.getItem('rk_dishW');
if(savedL) $('#dishL').value=savedL; if(savedW) $('#dishW').value=savedW;
$('#dishL').addEventListener('input',updateDish); $('#dishW').addEventListener('input',updateDish);

function applyTheme(t){
  document.documentElement.dataset.theme=t;
  document.querySelector('meta[name=theme-color]').setAttribute('content',t==='dark'?'#000000':'#f4f6f3');
}
const savedTheme=localStorage.getItem('rk_theme');
applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
if(!savedTheme){
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',e=>applyTheme(e.matches?'dark':'light'));
}
$('#themeBtn').addEventListener('click',()=>{
  const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
  localStorage.setItem('rk_theme',next); applyTheme(next);
});

$('#notes').value=localStorage.getItem('rk_notes')||'';
$('#notes').addEventListener('input',e=>localStorage.setItem('rk_notes',e.target.value));

function q(id){ return scaled(ing(id)); }
const cookSteps = () => [
  ['Kel előkészítése', `Szedd leveleire vagy negyedeld a kelt. A vastag torzsát távolítsd el, a nagy ereket vékonyítsd. Enyhén sós, gyöngyöző vízben főzd 5–8 percig, majd legalább 10 percig csepegtesd.`],
  ['Bulgur előpuhítása', `${q('bulgur')} bulgurt önts fel ${q('bulgurWater')} vízzel. Forrás után kis lángon, lefedve 5–6 perc; majd 5 perc pihenés. Maradjon enyhén harapható.`],
  ['Hagyma és fokhagyma', `${q('fat')} zsiradékon párold a hagymát 6–8 percig közepes-kis lángon. Add hozzá a ${q('garlic')} fokhagymát, és keverd 30–40 másodpercig.`],
  ['Paprika és hús', `Húzd le röviden a tűzről, keverd bele a ${q('paprika')} fűszerpaprikát, majd azonnal add hozzá a ${q('meat')} darált húst. Morzsásra bontva süsd 6–8 percig.`],
  ['Szaft beállítása', `Fűszerezd, majd önts alá ${q('ragoutWater')} vizet. Főzd még 8–10 percig. A végén maradjon kevés sűrű paprikás szaft – ne szárítsd ki.`],
  ['Töltelék', `Keverd a bulgurt a húshoz. Most kóstold meg és állítsd be a sót, borsot, majoránnát és köményt.`],
  ['Tejföl', `${q('sourcream')} tejfölt keverj el ${q('egg')} tojással, kevés sóval és ${q('sourWater')} vízzel. Legyen könnyen kenhető.`],
  ['Rétegezés', `Vékonyan kend ki a sütőtálat. Kel fele → tejföl kb. harmada → teljes húsos-bulguros töltelék → maradék kel → maradék tejföl.`],
  ['Sütés', `180 °C alsó-felső sütés. ${$('#bakeTimeInfo').textContent}. A széle finoman bugyogjon, a tejföl álljon össze és enyhén piruljon.`],
  ['Pihentetés', `Kivétel után 10–15 percig pihentesd. Ezután szebben szeletelhető és kevésbé folyik szét.`]
];
function showCook(){
  const steps=cookSteps();
  cookIndex=Math.min(Math.max(cookIndex,0),steps.length-1);
  const [title,text]=steps[cookIndex];
  $('#cookNum').textContent=`${cookIndex+1}. lépés / ${steps.length}`;
  $('#cookTitle').textContent=title; $('#cookText').textContent=text;
  $('#cookBar').style.width=((cookIndex+1)/steps.length*100)+'%';
  $('#prevStep').disabled=cookIndex===0;
  $('#nextStep').textContent=cookIndex===steps.length-1?'Kész ✓':'Következő →';
  localStorage.setItem('rk_cookIndex',cookIndex);
}
function openCook(){ $('#cookOverlay').classList.add('active'); $('#cookOverlay').setAttribute('aria-hidden','false'); showCook(); window.scrollTo(0,0); }
function closeCook(){ $('#cookOverlay').classList.remove('active'); $('#cookOverlay').setAttribute('aria-hidden','true'); }
$('#startCookTop').addEventListener('click',openCook); $('#startCookBottom').addEventListener('click',openCook);
$('#closeCook').addEventListener('click',closeCook);
$('#prevStep').addEventListener('click',()=>{if(cookIndex>0){cookIndex--;showCook();}});
$('#nextStep').addEventListener('click',()=>{const n=cookSteps().length;if(cookIndex<n-1){cookIndex++;showCook();}else{toast('Főzés kész – jó étvágyat!');closeCook();}});

async function toggleWake(){
  if(!('wakeLock' in navigator)){ toast('Ezen az eszközön nem érhető el a képernyő-ébrentartás.'); return; }
  try{
    if(wakeLock){ await wakeLock.release(); wakeLock=null; $('#wakeBtn').textContent='☀ Képernyő ébren'; }
    else { wakeLock=await navigator.wakeLock.request('screen'); $('#wakeBtn').textContent='✓ Ébren tartva'; wakeLock.addEventListener('release',()=>{$('#wakeBtn').textContent='☀ Képernyő ébren';wakeLock=null;}); }
  }catch(e){toast('Az ébrentartás most nem engedélyezett.');}
}
$('#wakeBtn').addEventListener('click',toggleWake);
document.addEventListener('visibilitychange', async()=> {
  if(document.visibilityState==='visible' && $('#wakeBtn').textContent.includes('Ébren') && 'wakeLock' in navigator){
    try{wakeLock=await navigator.wakeLock.request('screen');}catch(e){}
  }
});

$('#goShopping').addEventListener('click',()=>{
  $('#shoppingCard').open=true;
  $('#shoppingCard').scrollIntoView({behavior:'smooth',block:'start'});
});
$('#newCook').addEventListener('click',()=>{
  if(!confirm('Új főzés indítása? A bevásárlólista pipái és a főzési haladás törlődik. Az adagszám, sütőtál és a saját jegyzet megmarad.')) return;
  ingredients.forEach(i=>{localStorage.removeItem('rk_shop_'+i.id);localStorage.removeItem('rk_ing_'+i.id);});
  cookIndex=0;localStorage.setItem('rk_cookIndex','0');updateAll();toast('Új főzés indítva.');
});
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800);}

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').hidden=false;});
$('#installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').hidden=true;});
window.addEventListener('appinstalled',()=>toast('Az alkalmazás telepítve.'));

if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}

updateAll();
