/* Live bot map. Data: a secret GitHub Gist updated by a box refresher (no redeploys). */
(function(){
const GIST="c2b47c2bd17738ccf5d7b5aa10207ba4", USER="tadavidson41";
const RAW=()=>"https://gist.githubusercontent.com/"+USER+"/"+GIST+"/raw/status.json?t="+Date.now();
const API="https://api.github.com/gists/"+GIST;
const PALETTE=["#7f95ff","#3dffa8","#ffc65c","#ff7ad9","#5ce1ff","#b18cff","#ff9a5c","#9aa4c8"];
const IS_LIST=document.body.classList.contains("list");
const $=s=>document.querySelector(s);
let data=null, prev={}, state={q:"",cluster:""}, firstLoad=true;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ago=t=>{if(!t)return"never";const s=Math.max(0,(Date.now()-t)/1000);if(s<60)return Math.round(s)+"s ago";if(s<3600)return Math.round(s/60)+"m ago";if(s<86400)return Math.round(s/3600)+"h ago";return Math.round(s/86400)+"d ago"};
const tier=b=>{const a=b.lastActive?Date.now()-b.lastActive:1e15;return a<6e5?"hot":a<864e5?"glow":"dim"};
const color=c=>PALETTE[Math.max(0,data.clusters.indexOf(c))%PALETTE.length];
function hash(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}

async function load(){
  let d=null;
  try{const r=await fetch(RAW(),{cache:"no-store"});if(!r.ok)throw 0;d=await r.json()}
  catch(e){try{const r=await fetch(API,{cache:"no-cache"});const j=await r.json();const f=j.files["status.json"];
    d=f.truncated?await (await fetch(f.raw_url)).json():JSON.parse(f.content)}catch(e2){}}
  const err=$(".err");
  if(!d){err.textContent="Can't reach the live feed right now. Retrying every minute.";err.style.display="block";return}
  err.style.display="none";
  const old=data;data=d;
  render(old);
  prev={};d.bots.forEach(b=>prev[b.id]=b);
}

function stats(old){
  const now=Date.now(), b=data.bots;
  const v={total:b.length,now:b.filter(x=>x.lastActive&&now-x.lastActive<6e5).length,
    day:b.filter(x=>x.lastActive&&now-x.lastActive<864e5).length,ev:b.reduce((a,x)=>a+(x.events24h||0),0)};
  for(const k in v){const el=$("#s-"+k);if(!el)continue;if(el.textContent!==String(v[k])&&!firstLoad){el.classList.add("bump");setTimeout(()=>el.classList.remove("bump"),1500)}el.textContent=v[k]}
}
function liveBadge(){
  const el=$(".live");if(!el)return;
  if(!data){el.className="live bad";el.innerHTML="<i></i>CONNECTING";return}
  const a=Date.now()-data.generatedAt;
  el.className="live"+(a>72e4?" bad":a>18e4?" warn":"");
  el.innerHTML="<i></i>"+(a>72e4?"STALE":"LIVE")+" <small>feed "+ago(data.generatedAt)+"</small>";
}
function ticker(old){
  const t=$("#ticker .track");if(!t)return;
  const seen=new Set((old&&old.ticker||[]).map(e=>e.id+e.t));
  const items=(data.ticker||[]).map(e=>'<span class="'+(old&&!seen.has(e.id+e.t)?"new":"")+'"><b>'+esc(e.name)+"</b> "+esc(e.verb)+" · "+ago(e.t)+"</span>").join("");
  t.innerHTML=(items||"<span>No activity in the last 24h</span>").repeat(2);
}
function filters(){
  const sel=$("#cluster");const cur=sel.value;
  sel.innerHTML='<option value="">All clusters</option>'+data.clusters.map(c=>'<option'+(c===cur?" selected":"")+">"+esc(c)+"</option>").join("");
}
function detailHTML(b){
  const t=tier(b);
  return "<h3>"+esc(b.name)+'</h3><div class="meta">'+esc(b.cluster)+'</div><div class="role">'+esc(b.role)+'</div><span class="chip '+t+'">'+esc(b.doing)+'</span><span class="chip">'+b.events24h+' events · 24h</span><div class="meta" style="margin-top:6px">Last active '+ago(b.lastActive)+"</div>";
}
const matches=b=>(!state.q||(b.name+" "+b.role+" "+b.cluster).toLowerCase().includes(state.q))&&(!state.cluster||b.cluster===state.cluster);

/* ---------- LIST VIEW ---------- */
function renderList(old){
  const m=$("main");let html="";
  for(const c of data.clusters){
    const bs=data.bots.filter(b=>b.cluster===c&&matches(b)).sort((a,b)=>(b.lastActive||0)-(a.lastActive||0));
    if(!bs.length)continue;
    html+='<section class="group"><h2>'+esc(c)+" · "+bs.length+'</h2><div class="grid">'+bs.map(b=>{
      const t=tier(b),p=old&&prev[b.id]&&prev[b.id].lastActive!==b.lastActive;
      return '<div class="card '+(t==="hot"?"hot":t==="dim"?"dimc":"")+(p?" pinged":"")+'" style="--c:'+color(c)+'">'+detailHTML(b)+"</div>"}).join("")+"</div></section>";
  }
  m.innerHTML=html||'<p class="meta">No bots match.</p>';
  setTimeout(()=>document.querySelectorAll(".card.pinged").forEach(e=>e.classList.remove("pinged")),900);
}

/* ---------- MAP VIEW ---------- */
let layout=null, vb=null, vbAnim=null, nodes={};
function computeLayout(){
  const portrait=innerWidth<innerHeight*0.9, cs=data.clusters, k=cs.length, L={hubs:{},bots:{}};
  if(portrait){
    const cols=2,W=720,rowH=370;L.W=W;L.H=40+Math.ceil(k/cols)*rowH;L.portrait=true;
    cs.forEach((c,i)=>{L.hubs[c]={x:i%cols?540:180,y:200+Math.floor(i/cols)*rowH}});
  }else{
    L.W=1600;L.H=1000;
    cs.forEach((c,i)=>{const a=-Math.PI/2+i*2*Math.PI/k;L.hubs[c]={x:800+590*Math.cos(a),y:530+330*Math.sin(a)}});
  }
  L.center=portrait?null:{x:800,y:530};
  for(const c of cs){
    const bs=data.bots.filter(b=>b.cluster===c).sort((a,b)=>a.id<b.id?-1:1);
    const n=bs.length,slots=Math.max(n,6),R=Math.min(portrait?135:150,(portrait?62:72)+n*7),taken=new Set(),h=L.hubs[c];
    bs.forEach(b=>{let s=hash(b.id)%slots;while(taken.has(s))s=(s+1)%slots;taken.add(s);
      const a=-Math.PI/2+s*2*Math.PI/slots+(hash(c)%100)/100*0.5;
      L.bots[b.id]={x:h.x+R*Math.cos(a),y:h.y+R*Math.sin(a)}});
    h.R=R;
  }
  return L;
}
const NS="http://www.w3.org/2000/svg";
const el=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e};
function buildMap(){
  layout=computeLayout();nodes={};fitMap();
  $("#map").classList.toggle("portrait",!!layout.portrait);
  const svg=$("#map"),g=$("#map .vb");g.innerHTML="";
  const gl=el("g",{},g),gh=el("g",{},g),gb=el("g",{},g);
  if(layout.center){el("circle",{cx:800,cy:530,r:34,class:"core",fill:"url(#hubg)",stroke:"#9fb0ff44"},gh);
    const t=el("text",{x:800,y:535,"text-anchor":"middle",fill:"#9fb0ff","font-size":"12","font-weight":"800","letter-spacing":".12em"},gh);t.textContent="B2BRIZZ";
    for(const c of data.clusters){const h=layout.hubs[c];el("path",{class:"spine",d:"M800 530 Q "+((800+h.x)/2+20)+" "+((530+h.y)/2-20)+" "+h.x+" "+h.y},gl)}}
  for(const c of data.clusters){
    const h=layout.hubs[c],hg=el("g",{class:"hub","data-c":c},gh);
    el("circle",{cx:h.x,cy:h.y,r:h.R,class:"halo"},hg);
    el("circle",{cx:h.x,cy:h.y,r:22,class:"core",style:"stroke:"+color(c)+"88"},hg);
    const t=el("text",{x:h.x,y:h.y+5},hg);t.textContent=c;
  }
  for(const b of data.bots){
    const p=layout.bots[b.id],h=layout.hubs[b.cluster],col=color(b.cluster);
    const ln=el("path",{class:"link",d:"M"+h.x+" "+h.y+" L"+p.x+" "+p.y},gl);
    const bg=el("g",{class:"bot",tabindex:0},gb);
    el("circle",{cx:p.x,cy:p.y,r:12,class:"pulse",stroke:col},bg);
    el("circle",{cx:p.x,cy:p.y,r:12,class:"pulse p2",stroke:col},bg);
    el("circle",{cx:p.x,cy:p.y,r:12,class:"ping"},bg);
    el("circle",{cx:p.x,cy:p.y,r:10,class:"dot",fill:col},bg);
    const t=el("text",{x:p.x,y:p.y+30},bg);t.textContent=b.name;
    nodes[b.id]={g:bg,ln};
    bg.addEventListener("mouseenter",ev=>showTip(b.id,ev));bg.addEventListener("mouseleave",hideTip);
    bg.addEventListener("click",ev=>{ev.stopPropagation();showTip(b.id,ev,true)});
  }
  svg.addEventListener("click",hideTip);
  setVB(fullVB(),false);
}
const fullVB=()=>({x:-20,y:-10,w:layout.W+40,h:layout.H+20});
function fitMap(){const m=$("#map"),h=$("header");if(m&&h){m.style.top=h.offsetHeight+"px";m.style.height=(innerHeight-h.offsetHeight-38)+"px"}}
function setVB(t,anim=true){
  const svg=$("#map");cancelAnimationFrame(vbAnim);
  if(!anim||!vb){vb=t;svg.setAttribute("viewBox",[t.x,t.y,t.w,t.h].join(" "));return}
  const s={...vb},t0=performance.now();
  const step=n=>{const k=Math.min(1,(n-t0)/850),e=1-Math.pow(1-k,3);
    vb={x:s.x+(t.x-s.x)*e,y:s.y+(t.y-s.y)*e,w:s.w+(t.w-s.w)*e,h:s.h+(t.h-s.h)*e};
    svg.setAttribute("viewBox",[vb.x,vb.y,vb.w,vb.h].join(" "));if(k<1)vbAnim=requestAnimationFrame(step)};
  vbAnim=requestAnimationFrame(step);
}
function zoomTo(pts){
  if(!pts.length){setVB(fullVB());$("#reset").style.display="none";return}
  let x0=Math.min(...pts.map(p=>p.x)),x1=Math.max(...pts.map(p=>p.x)),y0=Math.min(...pts.map(p=>p.y)),y1=Math.max(...pts.map(p=>p.y));
  const pad=120,w=Math.max(380,x1-x0+pad*2),h=Math.max(320,y1-y0+pad*2),cx=(x0+x1)/2,cy=(y0+y1)/2+10;
  setVB({x:cx-w/2,y:cy-h/2,w,h});$("#reset").style.display="block";
}
function applyFilter(zoom){
  const any=state.q||state.cluster, pts=[];
  for(const b of data.bots){const n=nodes[b.id];if(!n)continue;const m=matches(b);
    n.g.classList.toggle("faded",!!any&&!m);n.ln.classList.toggle("faded",!!any&&!m);n.g.classList.toggle("match",!!state.q&&m);
    if(any&&m){pts.push(layout.bots[b.id]);if(state.cluster||!state.q)pts.push(layout.hubs[b.cluster])}}
  document.querySelectorAll(".hub").forEach(h=>h.classList.toggle("faded",!!state.cluster&&h.dataset.c!==state.cluster));
  if(zoom)zoomTo(any?pts:[]);
}
function updateNodes(old){
  for(const b of data.bots){const n=nodes[b.id];if(!n)continue;const t=tier(b);
    n.g.classList.remove("hot","glow","dim");n.g.classList.add(t);n.ln.classList.toggle("on",t==="hot");
    n.g.querySelector(".dot").setAttribute("r",(8+Math.min(16,Math.sqrt(b.events24h||0)*2.2)).toFixed(1));
    if(old&&prev[b.id]&&prev[b.id].lastActive!==b.lastActive){n.g.classList.remove("pinged");void n.g.getBBox();n.g.classList.add("pinged")}}
}
let tipId=null;
function showTip(id,ev,sticky){
  const b=data.bots.find(x=>x.id===id);if(!b)return;tipId=id;const tip=$("#tip");tip.innerHTML=detailHTML(b);
  const x=Math.min(innerWidth-310,(ev.clientX||innerWidth/2)+14),y=Math.min(innerHeight-170,(ev.clientY||innerHeight/2)+14);
  tip.style.left=x+"px";tip.style.top=y+"px";tip.classList.add("show");tip.dataset.sticky=sticky?"1":"";
}
function hideTip(ev){const tip=$("#tip");if(ev&&ev.type==="mouseleave"&&tip.dataset.sticky)return;tip.classList.remove("show");tipId=null}

function render(old){
  stats(old);liveBadge();ticker(old);
  if(firstLoad)filters();
  if(IS_LIST)renderList(old);
  else{
    const sig=data.bots.map(b=>b.id+b.cluster).join()+data.clusters.join();
    if(!layout||!old||old._sig!==sig)buildMap();
    data._sig=sig;updateNodes(old);applyFilter(firstLoad?false:false);
    if(tipId){const b=data.bots.find(x=>x.id===tipId);if(b)$("#tip").innerHTML=detailHTML(b)}
  }
  firstLoad=false;
}
$("#q").addEventListener("input",e=>{state.q=e.target.value.trim().toLowerCase();if(data){IS_LIST?renderList():applyFilter(true)}});
$("#cluster").addEventListener("change",e=>{state.cluster=e.target.value;if(data){IS_LIST?renderList():applyFilter(true)}});
const rs=$("#reset");if(rs)rs.addEventListener("click",()=>{state.q="";state.cluster="";$("#q").value="";$("#cluster").value="";applyFilter(true)});
let rt;addEventListener("resize",()=>{if(IS_LIST||!data)return;clearTimeout(rt);rt=setTimeout(()=>{const p=layout&&layout.W;fitMap();const L=computeLayout();if(L.W!==p){buildMap();updateNodes();applyFilter(true)}},300)});
setInterval(liveBadge,1000);
setInterval(()=>{if(data)ticker(null)},30000);
load();setInterval(load,60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)load()});
})();
