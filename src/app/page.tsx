import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const DC={Northeast:"#378ADD",Southeast:"#1D9E75",Rail:"#D85A30"};
const SBG={"Available":"#EAF3DE","On Project":"#E6F1FB","On Leave":"#FAEEDA"};
const STC={"Available":"#3B6D11","On Project":"#0C447C","On Leave":"#854F0B"};
const ROLES=["Project Manager","Superintendent","Field Engineer","Foreman","Safety Manager","Equipment Operator","Laborer"];
const DIVS=["Northeast","Southeast","Rail"];
const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SP=["Scheduling","Cost Control","Estimating","Budget Management","Crew Management","Quality Control","Safety Management","OSHA Compliance","Concrete","Earthwork","Asphalt Paving","Formwork","Drainage","Grading","Surveying","Structural Steel","Track Geometry","Track Alignment","Signal Systems","Crane Operation","Excavator","Dozer","Subcontractor Mgmt","Value Engineering"];
const LN={1:"Novice",2:"Beginner",3:"Intermediate",4:"Advanced",5:"Expert"};
const LC=l=>l>=5?"#3B6D11":l>=4?"#639922":l>=3?"#185FA5":l>=2?"#BA7517":"#854F0B";
const mIdx=ym=>{const[y,m]=ym.split('-').map(Number);return(y-2025)*12+(m-1);};
const fmtM=ym=>{const[y,m]=ym.split('-').map(Number);return MN[m-1]+' '+y;};
const TL_START="2025-01",TL_MONTHS=24,TODAY="2026-04",TODAY_IDX=mIdx(TODAY);
const TL=Array.from({length:TL_MONTHS},(_,i)=>({key:`${2025+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,label:MN[i%12],year:2025+Math.floor(i/12),isJan:i%12===0}));
const ini=n=>n.split(" ").map(x=>x[0]).join("");
const getStatus=e=>e.onLeave?"On Leave":e.pid?"On Project":"Available";
const projReq=p=>(p.roles||[]).reduce((s,r)=>s+r.count,0);

const EMPS0=[
  {id:1,name:"Chris Dawson",role:"Project Manager",div:"Northeast",certs:["PMP","OSHA 30"],pid:1,onLeave:false,skills:[{name:"Scheduling",level:5},{name:"Cost Control",level:4},{name:"Crew Management",level:5}]},
  {id:2,name:"Maria Santos",role:"Superintendent",div:"Northeast",certs:["OSHA 30"],pid:2,onLeave:false,skills:[{name:"Concrete",level:5},{name:"Earthwork",level:4},{name:"Crew Management",level:4}]},
  {id:3,name:"Kevin Park",role:"Field Engineer",div:"Northeast",certs:["PE License"],pid:null,onLeave:false,skills:[{name:"Surveying",level:4},{name:"Quality Control",level:4}]},
  {id:4,name:"Diane Torres",role:"Foreman",div:"Northeast",certs:["OSHA 30"],pid:1,onLeave:false,skills:[{name:"Concrete",level:5},{name:"Formwork",level:5}]},
  {id:5,name:"James Webb",role:"Safety Manager",div:"Northeast",certs:["OSHA 30","CSP"],pid:2,onLeave:false,skills:[{name:"Safety Management",level:5},{name:"OSHA Compliance",level:5}]},
  {id:6,name:"Lisa Cho",role:"Equipment Operator",div:"Northeast",certs:["CDL"],pid:null,onLeave:false,skills:[{name:"Excavator",level:4},{name:"Crane Operation",level:3}]},
  {id:7,name:"Ray Morales",role:"Foreman",div:"Northeast",certs:["OSHA 30"],pid:3,onLeave:false,skills:[{name:"Asphalt Paving",level:4},{name:"Grading",level:5}]},
  {id:8,name:"Sandra Hill",role:"Project Manager",div:"Southeast",certs:["PMP","OSHA 30"],pid:4,onLeave:false,skills:[{name:"Scheduling",level:4},{name:"Estimating",level:5},{name:"Budget Management",level:4}]},
  {id:9,name:"Tom Nguyen",role:"Superintendent",div:"Southeast",certs:["OSHA 30"],pid:5,onLeave:false,skills:[{name:"Earthwork",level:5},{name:"Drainage",level:4}]},
  {id:10,name:"Priya Kapoor",role:"Field Engineer",div:"Southeast",certs:["PE License","OSHA 30"],pid:4,onLeave:false,skills:[{name:"Structural Steel",level:4},{name:"Surveying",level:5}]},
  {id:11,name:"Mark Stevens",role:"Foreman",div:"Southeast",certs:["OSHA 10"],pid:null,onLeave:false,skills:[{name:"Asphalt Paving",level:5},{name:"Drainage",level:4}]},
  {id:12,name:"Amy Chen",role:"Safety Manager",div:"Southeast",certs:["OSHA 30","CSP"],pid:5,onLeave:false,skills:[{name:"Safety Management",level:5},{name:"OSHA Compliance",level:4}]},
  {id:13,name:"Carlos Ruiz",role:"Equipment Operator",div:"Southeast",certs:["CDL"],pid:null,onLeave:true,skills:[{name:"Dozer",level:5},{name:"Grading",level:4}]},
  {id:14,name:"Beth Owens",role:"Foreman",div:"Southeast",certs:["OSHA 30"],pid:6,onLeave:false,skills:[{name:"Concrete",level:4},{name:"Formwork",level:3}]},
  {id:15,name:"Frank DiMaggio",role:"Project Manager",div:"Rail",certs:["PMP","OSHA 30","FRA"],pid:7,onLeave:false,skills:[{name:"Scheduling",level:5},{name:"Budget Management",level:4},{name:"Track Geometry",level:3}]},
  {id:16,name:"Alicia Brooks",role:"Superintendent",div:"Rail",certs:["OSHA 30","FRA"],pid:7,onLeave:false,skills:[{name:"Track Geometry",level:5},{name:"Track Alignment",level:5}]},
  {id:17,name:"Nathan Cole",role:"Field Engineer",div:"Rail",certs:["PE License"],pid:null,onLeave:false,skills:[{name:"Surveying",level:5},{name:"Track Alignment",level:4}]},
  {id:18,name:"Rosa Jimenez",role:"Safety Manager",div:"Rail",certs:["OSHA 30","FRA","CSP"],pid:8,onLeave:false,skills:[{name:"Safety Management",level:5},{name:"OSHA Compliance",level:5}]},
  {id:19,name:"David Kim",role:"Foreman",div:"Rail",certs:["OSHA 30","FRA"],pid:7,onLeave:false,skills:[{name:"Track Geometry",level:4},{name:"Track Alignment",level:4}]},
  {id:20,name:"Tanya Scott",role:"Equipment Operator",div:"Rail",certs:["CDL","FRA"],pid:8,onLeave:false,skills:[{name:"Track Geometry",level:3},{name:"Grading",level:3}]},
];
const PROJS0=[
  {id:1,name:"I-95 Bridge Rehab",div:"Northeast",loc:"Providence, RI",status:"Active",start:"2025-03",end:"2026-09",roles:[{role:"Project Manager",count:1},{role:"Superintendent",count:1},{role:"Foreman",count:2},{role:"Field Engineer",count:1},{role:"Safety Manager",count:1},{role:"Equipment Operator",count:2}]},
  {id:2,name:"Rt-128 Widening",div:"Northeast",loc:"Waltham, MA",status:"Active",start:"2025-01",end:"2025-12",roles:[{role:"Project Manager",count:1},{role:"Superintendent",count:1},{role:"Foreman",count:2},{role:"Safety Manager",count:1},{role:"Equipment Operator",count:1}]},
  {id:3,name:"Hartford Interchange",div:"Northeast",loc:"Hartford, CT",status:"Planning",start:"2026-06",end:"2027-06",roles:[{role:"Project Manager",count:1},{role:"Superintendent",count:2},{role:"Foreman",count:3},{role:"Field Engineer",count:1},{role:"Safety Manager",count:1},{role:"Equipment Operator",count:2}]},
  {id:4,name:"I-77 Corridor",div:"Southeast",loc:"Charlotte, NC",status:"Active",start:"2025-04",end:"2027-03",roles:[{role:"Project Manager",count:1},{role:"Superintendent",count:1},{role:"Foreman",count:3},{role:"Field Engineer",count:1},{role:"Safety Manager",count:1},{role:"Equipment Operator",count:2}]},
  {id:5,name:"Port Access Road",div:"Southeast",loc:"Savannah, GA",status:"Active",start:"2025-02",end:"2026-08",roles:[{role:"Project Manager",count:1},{role:"Superintendent",count:1},{role:"Foreman",count:2},{role:"Safety Manager",count:1},{role:"Equipment Operator",count:2}]},
  {id:6,name:"US-1 Drainage",div:"Southeast",loc:"Jacksonville, FL",status:"Planning",start:"2026-08",end:"2027-02",roles:[{role:"Superintendent",count:1},{role:"Foreman",count:2},{role:"Safety Manager",count:1},{role:"Equipment Operator",count:1}]},
  {id:7,name:"MBTA K78CN04 Track",div:"Rail",loc:"Boston, MA",status:"Active",start:"2024-10",end:"2026-10",roles:[{role:"Project Manager",count:1},{role:"Superintendent",count:1},{role:"Foreman",count:2},{role:"Field Engineer",count:1},{role:"Safety Manager",count:1},{role:"Equipment Operator",count:1}]},
  {id:8,name:"NJ Transit Signal",div:"Rail",loc:"Newark, NJ",status:"Active",start:"2025-05",end:"2026-05",roles:[{role:"Project Manager",count:1},{role:"Foreman",count:1},{role:"Safety Manager",count:1},{role:"Equipment Operator",count:1},{role:"Field Engineer",count:1}]},
];
const SCEN0=[
  {id:1,name:"Hartford Win",desc:"Model adding 10 staff if Hartford contract awarded Q3 2026",status:"Draft"},
  {id:2,name:"Rt-128 Completion",desc:"Simulate NE staff redeployment after Rt-128 closes Dec 2025",status:"In Review"},
  {id:3,name:"Rail Phase 2",desc:"Project Rail division growth with K78CN04 Phase 2 award",status:"Draft"},
];
const FCAST=[{m:"Apr",NE:13,SE:12,R:11},{m:"May",NE:14,SE:13,R:12},{m:"Jun",NE:16,SE:14,R:12},{m:"Jul",NE:18,SE:15,R:13},{m:"Aug",NE:20,SE:16,R:14},{m:"Sep",NE:22,SE:17,R:14},{m:"Oct",NE:22,SE:18,R:15},{m:"Nov",NE:20,SE:18,R:15},{m:"Dec",NE:18,SE:16,R:12}];

// ─── Primitives ───────────────────────────────────────────────────────────────
const ss=(extra={})=>({fontSize:12,padding:"6px 9px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",fontFamily:"var(--font-sans)",width:"100%",boxSizing:"border-box",...extra});
const Inp=({style={},...p})=><input {...p} style={ss(style)}/>;
const Sel=({style={},children,...p})=><select {...p} style={ss(style)}>{children}</select>;
const MonInp=({style={},...p})=><input type="month" {...p} style={ss(style)}/>;
const TA=({style={},...p})=><textarea {...p} style={ss({resize:"vertical",minHeight:64,...style})}/>;
const Lbl=({children})=><div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4,marginTop:10,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.03em"}}>{children}</div>;
const Pill=({label,bg,tc})=><span style={{background:bg,color:tc,fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:500,whiteSpace:"nowrap"}}>{label}</span>;
const KPI=({label,value,note,vc})=><div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"1rem"}}><div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:4}}>{label}</div><div style={{fontSize:26,fontWeight:500,color:vc||"var(--color-text-primary)"}}>{value}</div>{note&&<div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>{note}</div>}</div>;
const ProfDots=({level,onChange,size=9})=><div style={{display:"flex",gap:2,alignItems:"center"}}>{[1,2,3,4,5].map(i=><div key={i} onClick={()=>onChange&&onChange(i)} title={LN[i]} style={{width:size,height:size,borderRadius:"50%",cursor:onChange?"pointer":"default",background:i<=level?LC(level):"var(--color-background-secondary)",border:`1px solid ${i<=level?LC(level):"var(--color-border-secondary)"}`}}/>)}</div>;
const DivFilter=({val,set})=><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["All",...DIVS].map(d=><button key={d} onClick={()=>set(d)} style={{padding:"4px 12px",fontSize:12,borderRadius:99,border:"0.5px solid var(--color-border-secondary)",background:val===d?"var(--color-text-primary)":"transparent",color:val===d?"var(--color-background-primary)":"var(--color-text-primary)",cursor:"pointer",fontFamily:"var(--font-sans)"}}>{d}</button>)}</div>;

// ─── Side Drawer ──────────────────────────────────────────────────────────────
function Drawer({open,onClose,title,children,accentColor}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:100,pointerEvents:open?"all":"none"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.18)",opacity:open?1:0,transition:"opacity 0.2s"}}/>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:420,background:"#ffffff",borderLeft:`3px solid ${accentColor||"#378ADD"}`,boxShadow:"-8px 0 32px rgba(0,0,0,0.18)",transform:open?"translateX(0)":"translateX(100%)",transition:"transform 0.22s ease",display:"flex",flexDirection:"column",overflowY:"hidden"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",borderBottom:"1px solid #e5e7eb",flexShrink:0,background:"#ffffff"}}>
          <div style={{fontSize:14,fontWeight:500,color:"#111"}}>{title}</div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:6,border:"1px solid #d1d5db",background:"#f9fafb",cursor:"pointer",fontSize:18,color:"#6b7280",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-sans)",lineHeight:1}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 18px 18px",background:"#ffffff",color:"#111"}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Person Drawer ────────────────────────────────────────────────────────────
function PersonDrawer({emp,projs,onSave,onDelete,onClose}) {
  const [f,setF]=useState(()=>({...emp,skills:[...(emp.skills||[])],certs:[...(emp.certs||[])]}));
  const [ns,setNs]=useState(""),  [nl,setNl]=useState(3), [nc,setNc]=useState(""), [confirmDel,setConfirmDel]=useState(false);
  const upd=u=>setF(p=>({...p,...u}));
  const addSkill=()=>{if(!ns.trim())return;upd({skills:[...f.skills,{name:ns.trim(),level:nl}]});setNs("");setNl(3);};
  const remSkill=n=>upd({skills:f.skills.filter(s=>s.name!==n)});
  const setLvl=(n,l)=>upd({skills:f.skills.map(s=>s.name===n?{...s,level:l}:s)});
  const addCert=()=>{if(!nc.trim())return;upd({certs:[...f.certs,nc.trim()]});setNc("");};
  const remCert=c=>upd({certs:f.certs.filter(x=>x!==c)});
  const status=getStatus(f);
  return (
    <>
      <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:14,paddingBottom:12,borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:DC[f.div]+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:500,color:DC[f.div],flexShrink:0}}>{ini(f.name)}</div>
        <div><div style={{fontSize:14,fontWeight:500}}>{f.name}</div><div style={{display:"flex",gap:5,marginTop:3}}><Pill label={f.div} bg={DC[f.div]+"22"} tc={DC[f.div]}/><Pill label={status} bg={SBG[status]} tc={STC[status]}/></div></div>
      </div>

      <Lbl>Full name</Lbl>
      <Inp value={f.name} onChange={e=>upd({name:e.target.value})}/>
      <Lbl>Role</Lbl>
      <Sel value={f.role} onChange={e=>upd({role:e.target.value})}>{ROLES.map(r=><option key={r}>{r}</option>)}</Sel>
      <Lbl>Division</Lbl>
      <Sel value={f.div} onChange={e=>upd({div:e.target.value})}>{DIVS.map(d=><option key={d}>{d}</option>)}</Sel>
      <Lbl>Project assignment</Lbl>
      <Sel value={f.pid||""} onChange={e=>upd({pid:e.target.value?Number(e.target.value):null})}><option value="">— unassigned —</option>{projs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Sel>
      <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}}>
        <input type="checkbox" id="leave" checked={f.onLeave} onChange={e=>upd({onLeave:e.target.checked})} style={{cursor:"pointer"}}/>
        <label htmlFor="leave" style={{fontSize:12,cursor:"pointer",color:"var(--color-text-primary)"}}>On leave</label>
      </div>

      <Lbl>Certifications</Lbl>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
        {f.certs.map(c=><span key={c} style={{display:"flex",alignItems:"center",gap:3,fontSize:11,padding:"2px 7px",border:"0.5px solid var(--color-border-tertiary)",borderRadius:4,background:"var(--color-background-secondary)",color:"var(--color-text-secondary)"}}>
          {c}<span onClick={()=>remCert(c)} style={{cursor:"pointer",color:"#E24B4A",marginLeft:3,fontSize:13,lineHeight:1,fontWeight:600}}>×</span>
        </span>)}
      </div>
      <div style={{display:"flex",gap:6}}>
        <Inp value={nc} onChange={e=>setNc(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCert()} placeholder="Type cert & press Enter" style={{flex:1,width:"auto"}}/>
        <button onClick={addCert} style={{padding:"6px 12px",fontSize:12,borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)",flexShrink:0}}>Add</button>
      </div>

      <Lbl>Skills & proficiency</Lbl>
      {f.skills.map(s=>(
        <div key={s.name} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"var(--color-background-secondary)",borderRadius:6,marginBottom:5}}>
          <div style={{flex:1}}>
            <div style={{fontSize:12,marginBottom:4}}>{s.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <ProfDots level={s.level} onChange={l=>setLvl(s.name,l)} size={11}/>
              <span style={{fontSize:10,color:LC(s.level),fontWeight:500}}>{LN[s.level]}</span>
            </div>
          </div>
          <button onClick={()=>remSkill(s.name)} style={{padding:"2px 7px",fontSize:13,borderRadius:4,border:"0.5px solid var(--color-border-tertiary)",background:"transparent",cursor:"pointer",color:"#E24B4A",fontFamily:"var(--font-sans)"}}>×</button>
        </div>
      ))}
      <div style={{padding:10,border:"0.5px dashed var(--color-border-secondary)",borderRadius:8,marginTop:4,background:"var(--color-background-secondary)"}}>
        <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6}}>Add skill</div>
        <input list="sp-dl" value={ns} onChange={e=>setNs(e.target.value)} placeholder="Skill name..." style={ss({marginBottom:6})}/>
        <datalist id="sp-dl">{SP.map(s=><option key={s} value={s}/>)}</datalist>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><ProfDots level={nl} onChange={setNl} size={12}/><span style={{fontSize:11,color:LC(nl),fontWeight:500}}>{LN[nl]}</span></div>
        <button onClick={addSkill} style={{width:"100%",padding:"6px",fontSize:12,borderRadius:6,border:"0.5px solid #1D9E75",background:"#E1F5EE",color:"#0F6E56",cursor:"pointer",fontFamily:"var(--font-sans)"}}>+ Add skill</button>
      </div>

      <div style={{marginTop:20,paddingTop:14,borderTop:"0.5px solid var(--color-border-tertiary)",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>onSave(f)} style={{flex:1,padding:"8px",fontSize:13,borderRadius:8,border:"none",background:"#378ADD",color:"#fff",cursor:"pointer",fontFamily:"var(--font-sans)",fontWeight:500}}>Save changes</button>
        {!confirmDel
          ? <button onClick={()=>setConfirmDel(true)} style={{padding:"8px 14px",fontSize:12,borderRadius:8,border:"0.5px solid #E24B4A",background:"transparent",color:"#A32D2D",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Delete</button>
          : <div style={{display:"flex",gap:6,alignItems:"center",width:"100%",padding:"8px 10px",background:"#FCEBEB",borderRadius:8,border:"0.5px solid #F09595"}}>
              <span style={{fontSize:12,color:"#A32D2D",flex:1}}>Delete {f.name}? Cannot be undone.</span>
              <button onClick={()=>onDelete(f.id)} style={{padding:"5px 10px",fontSize:12,borderRadius:6,border:"none",background:"#A32D2D",color:"#fff",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Yes</button>
              <button onClick={()=>setConfirmDel(false)} style={{padding:"5px 10px",fontSize:12,borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)"}}>No</button>
            </div>
        }
      </div>
    </>
  );
}

// ─── Project Drawer ───────────────────────────────────────────────────────────
function ProjectDrawer({proj,onSave,onDelete,onClose}) {
  const [f,setF]=useState(()=>({...proj,roles:[...proj.roles.map(r=>({...r}))]}));
  const [nr,setNr]=useState("Foreman"), [nc2,setNc2]=useState(1), [confirmDel,setConfirmDel]=useState(false);
  const upd=u=>setF(p=>({...p,...u}));
  const addRole=()=>{const ex=f.roles.find(r=>r.role===nr);upd({roles:ex?f.roles.map(r=>r.role===nr?{...r,count:r.count+nc2}:r):[...f.roles,{role:nr,count:nc2}]});};
  const remRole=r=>upd({roles:f.roles.filter(x=>x.role!==r)});
  const setRoleCount=(role,count)=>upd({roles:f.roles.map(r=>r.role===role?{...r,count:Math.max(1,count)}:r)});
  return (
    <>
      <div style={{paddingTop:14,paddingBottom:12,borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>{f.name}</div>
        <div style={{display:"flex",gap:5}}><Pill label={f.div} bg={DC[f.div]+"22"} tc={DC[f.div]}/><Pill label={f.status} bg={f.status==="Active"?"#E6F1FB":"#FAEEDA"} tc={f.status==="Active"?"#0C447C":"#854F0B"}/></div>
      </div>

      <Lbl>Project name</Lbl>
      <Inp value={f.name} onChange={e=>upd({name:e.target.value})}/>
      <Lbl>Location</Lbl>
      <Inp value={f.loc} onChange={e=>upd({loc:e.target.value})} placeholder="City, State"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div><Lbl>Division</Lbl><Sel value={f.div} onChange={e=>upd({div:e.target.value})}>{DIVS.map(d=><option key={d}>{d}</option>)}</Sel></div>
        <div><Lbl>Status</Lbl><Sel value={f.status} onChange={e=>upd({status:e.target.value})}><option>Active</option><option>Planning</option></Sel></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div><Lbl>Start</Lbl><MonInp value={f.start} onChange={e=>upd({start:e.target.value})}/></div>
        <div><Lbl>End</Lbl><MonInp value={f.end} onChange={e=>upd({end:e.target.value})}/></div>
      </div>

      <Lbl>Role requirements</Lbl>
      {f.roles.map(r=>(
        <div key={r.role} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"var(--color-background-secondary)",borderRadius:6,marginBottom:5}}>
          <span style={{flex:1,fontSize:12}}>{r.role}</span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>setRoleCount(r.role,r.count-1)} style={{width:24,height:24,borderRadius:4,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontSize:14,fontFamily:"var(--font-sans)"}}>-</button>
            <span style={{fontSize:13,fontWeight:500,minWidth:20,textAlign:"center"}}>{r.count}</span>
            <button onClick={()=>setRoleCount(r.role,r.count+1)} style={{width:24,height:24,borderRadius:4,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontSize:14,fontFamily:"var(--font-sans)"}}>+</button>
          </div>
          <button onClick={()=>remRole(r.role)} style={{padding:"2px 7px",fontSize:13,borderRadius:4,border:"0.5px solid var(--color-border-tertiary)",background:"transparent",cursor:"pointer",color:"#E24B4A",fontFamily:"var(--font-sans)"}}>×</button>
        </div>
      ))}
      <div style={{display:"flex",gap:6,marginTop:6,alignItems:"center"}}>
        <Sel value={nr} onChange={e=>setNr(e.target.value)} style={{flex:1,width:"auto"}}>{ROLES.map(r=><option key={r}>{r}</option>)}</Sel>
        <input type="number" min={1} max={20} value={nc2} onChange={e=>setNc2(Number(e.target.value))} style={ss({width:52})}/>
        <button onClick={addRole} style={{padding:"6px 12px",fontSize:12,borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)",flexShrink:0}}>Add</button>
      </div>

      <div style={{marginTop:20,paddingTop:14,borderTop:"0.5px solid var(--color-border-tertiary)",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>onSave(f)} style={{flex:1,padding:"8px",fontSize:13,borderRadius:8,border:"none",background:"#1D9E75",color:"#fff",cursor:"pointer",fontFamily:"var(--font-sans)",fontWeight:500}}>Save changes</button>
        {!confirmDel
          ? <button onClick={()=>setConfirmDel(true)} style={{padding:"8px 14px",fontSize:12,borderRadius:8,border:"0.5px solid #E24B4A",background:"transparent",color:"#A32D2D",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Delete</button>
          : <div style={{display:"flex",gap:6,alignItems:"center",width:"100%",padding:"8px 10px",background:"#FCEBEB",borderRadius:8,border:"0.5px solid #F09595"}}>
              <span style={{fontSize:12,color:"#A32D2D",flex:1}}>Delete project? All members will be unassigned.</span>
              <button onClick={()=>onDelete(f.id)} style={{padding:"5px 10px",fontSize:12,borderRadius:6,border:"none",background:"#A32D2D",color:"#fff",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Yes</button>
              <button onClick={()=>setConfirmDel(false)} style={{padding:"5px 10px",fontSize:12,borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)"}}>No</button>
            </div>
        }
      </div>
    </>
  );
}

// ─── People Page ──────────────────────────────────────────────────────────────
function People({emps,projs,onUpdate,onDelete,onAdd}) {
  const [df,setDf]=useState("All"), [sf,setSf]=useState("All"), [selId,setSelId]=useState(null), [adding,setAdding]=useState(false);
  const [nf,setNf]=useState({name:"",role:"Foreman",div:"Northeast",onLeave:false,pid:null,certs:[],skills:[]}), [ni,setNi]=useState(""), [si2,setSi2]=useState(""), [sl,setSl]=useState(3);
  const rows=emps.filter(e=>{const s=getStatus(e);return(df==="All"||e.div===df)&&(sf==="All"||s===sf);});
  const selEmp=emps.find(e=>e.id===selId);
  const addC=()=>{if(!ni.trim())return;setNf(f=>({...f,certs:[...f.certs,ni.trim()]}));setNi("");};
  const addS=()=>{if(!si2.trim())return;setNf(f=>({...f,skills:[...f.skills,{name:si2.trim(),level:sl}]}));setSi2("");setSl(3);};
  const submitAdd=()=>{if(!nf.name.trim())return;onAdd({...nf,id:Date.now()});setNf({name:"",role:"Foreman",div:"Northeast",onLeave:false,pid:null,certs:[],skills:[]});setAdding(false);};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <DivFilter val={df} set={setDf}/>
          {["All","Available","On Project","On Leave"].map(s=><button key={s} onClick={()=>setSf(s)} style={{padding:"4px 12px",fontSize:12,borderRadius:99,border:"0.5px solid var(--color-border-secondary)",background:sf===s&&s!=="All"?SBG[s]:"transparent",color:sf===s&&s!=="All"?STC[s]:"var(--color-text-primary)",cursor:"pointer",fontFamily:"var(--font-sans)"}}>{s}</button>)}
        </div>
        <button onClick={()=>setAdding(a=>!a)} style={{padding:"6px 14px",fontSize:12,borderRadius:8,border:"0.5px solid #185FA5",background:adding?"#E6F1FB":"transparent",color:"#185FA5",cursor:"pointer",fontFamily:"var(--font-sans)",fontWeight:500}}>+ Add person</button>
      </div>

      {adding&&(
        <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1.25rem",marginBottom:"1.25rem",borderLeft:"3px solid #378ADD"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div style={{fontSize:13,fontWeight:500}}>Add new team member</div><button onClick={()=>setAdding(false)} style={{padding:"3px 10px",fontSize:12,borderRadius:5,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Cancel</button></div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8,marginBottom:4}}>
            <div><Lbl>Full name</Lbl><Inp value={nf.name} onChange={e=>setNf(f=>({...f,name:e.target.value}))} placeholder="Full name"/></div>
            <div><Lbl>Role</Lbl><Sel value={nf.role} onChange={e=>setNf(f=>({...f,role:e.target.value}))}>{ROLES.map(r=><option key={r}>{r}</option>)}</Sel></div>
            <div><Lbl>Division</Lbl><Sel value={nf.div} onChange={e=>setNf(f=>({...f,div:e.target.value}))}>{DIVS.map(d=><option key={d}>{d}</option>)}</Sel></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><Lbl>Project (optional)</Lbl><Sel value={nf.pid||""} onChange={e=>setNf(f=>({...f,pid:e.target.value?Number(e.target.value):null}))}><option value="">— unassigned —</option>{projs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Sel></div>
            <div><Lbl>Certifications</Lbl><div style={{display:"flex",gap:5}}><Inp value={ni} onChange={e=>setNi(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addC()} placeholder="Type & Enter" style={{flex:1,width:"auto"}}/><button onClick={addC} style={{padding:"6px 10px",fontSize:12,borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)",flexShrink:0}}>Add</button></div><div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:5}}>{nf.certs.map(c=><span key={c} style={{fontSize:10,padding:"2px 6px",border:"0.5px solid var(--color-border-tertiary)",borderRadius:4,color:"var(--color-text-secondary)"}}>{c}</span>)}</div></div>
          </div>
          <Lbl>Skills</Lbl>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
            <input list="snl2" value={si2} onChange={e=>setSi2(e.target.value)} placeholder="Skill name..." style={ss({width:160,marginTop:0})}/>
            <datalist id="snl2">{SP.map(s=><option key={s} value={s}/>)}</datalist>
            <ProfDots level={sl} onChange={setSl} size={11}/><span style={{fontSize:11,color:LC(sl),fontWeight:500,minWidth:76}}>{LN[sl]}</span>
            <button onClick={addS} style={{padding:"5px 12px",fontSize:12,borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)"}}>+ Add</button>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>{nf.skills.map(s=><div key={s.name} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 8px",background:"var(--color-background-secondary)",borderRadius:4,fontSize:11}}><ProfDots level={s.level} size={7}/><span>{s.name}</span><span style={{color:LC(s.level),fontWeight:500,fontSize:10}}>{LN[s.level]}</span></div>)}</div>
          <button onClick={submitAdd} style={{padding:"7px 20px",fontSize:13,borderRadius:8,border:"none",background:nf.name.trim()?"#378ADD":"var(--color-background-secondary)",color:nf.name.trim()?"#fff":"var(--color-text-secondary)",cursor:nf.name.trim()?"pointer":"default",fontFamily:"var(--font-sans)",fontWeight:500}}>Add team member</button>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
        {rows.map(e=>{
          const status=getStatus(e);
          return (
            <div key={e.id} style={{background:"var(--color-background-primary)",border:`0.5px solid var(--color-border-tertiary)`,borderRadius:"var(--border-radius-lg)",padding:"0.875rem",display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:DC[e.div]+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,color:DC[e.div],flexShrink:0}}>{ini(e.name)}</div>
                <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.name}</div><div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{e.role}</div></div>
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}><Pill label={e.div} bg={DC[e.div]+"22"} tc={DC[e.div]}/><Pill label={status} bg={SBG[status]} tc={STC[status]}/></div>
              {(e.skills||[]).slice(0,2).map(s=><div key={s.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:10,color:"var(--color-text-secondary)"}}>{s.name}</span><ProfDots level={s.level} size={7}/></div>)}
              <button onClick={()=>setSelId(e.id)} style={{marginTop:4,padding:"5px",fontSize:12,borderRadius:7,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)",color:"var(--color-text-primary)"}}>Edit / View</button>
            </div>
          );
        })}
      </div>

      <Drawer open={!!selEmp} onClose={()=>setSelId(null)} title="Edit team member" accentColor={selEmp?DC[selEmp.div]:"#378ADD"}>
        {selEmp&&<PersonDrawer emp={selEmp} projs={projs} onSave={f=>{onUpdate(f.id,f);setSelId(null);}} onDelete={id=>{onDelete(id);setSelId(null);}} onClose={()=>setSelId(null)}/>}
      </Drawer>
    </div>
  );
}

// ─── Projects Page ────────────────────────────────────────────────────────────
function Projects({emps,projs,onUpdate,onDelete,onAdd}) {
  const [df,setDf]=useState("All"), [selId,setSelId]=useState(null), [adding,setAdding]=useState(false);
  const [nf,setNf]=useState({name:"",div:"Northeast",loc:"",status:"Active",start:"",end:"",roles:[]}), [nr,setNr]=useState("Foreman"), [nc2,setNc2]=useState(1);
  const rows=df==="All"?projs:projs.filter(p=>p.div===df), selProj=projs.find(p=>p.id===selId);
  const addRN=()=>{const ex=nf.roles.find(r=>r.role===nr);setNf(f=>({...f,roles:ex?f.roles.map(r=>r.role===nr?{...r,count:r.count+nc2}:r):[...f.roles,{role:nr,count:nc2}]}));};
  const submitAdd=()=>{if(!nf.name.trim()||!nf.start||!nf.end)return;onAdd({...nf,id:Date.now()});setNf({name:"",div:"Northeast",loc:"",status:"Active",start:"",end:"",roles:[]});setAdding(false);};
  const valid=nf.name.trim()&&nf.start&&nf.end;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
        <DivFilter val={df} set={setDf}/>
        <button onClick={()=>setAdding(a=>!a)} style={{padding:"6px 14px",fontSize:12,borderRadius:8,border:"0.5px solid #0F6E56",background:adding?"#E1F5EE":"transparent",color:"#0F6E56",cursor:"pointer",fontFamily:"var(--font-sans)",fontWeight:500}}>+ New project</button>
      </div>

      {adding&&(
        <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1.25rem",marginBottom:"1.25rem",borderLeft:"3px solid #1D9E75"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div style={{fontSize:13,fontWeight:500}}>Create new project</div><button onClick={()=>setAdding(false)} style={{padding:"3px 10px",fontSize:12,borderRadius:5,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Cancel</button></div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8}}>
            <div><Lbl>Project name</Lbl><Inp value={nf.name} onChange={e=>setNf(f=>({...f,name:e.target.value}))} placeholder="Name"/></div>
            <div><Lbl>Division</Lbl><Sel value={nf.div} onChange={e=>setNf(f=>({...f,div:e.target.value}))}>{DIVS.map(d=><option key={d}>{d}</option>)}</Sel></div>
            <div><Lbl>Status</Lbl><Sel value={nf.status} onChange={e=>setNf(f=>({...f,status:e.target.value}))}><option>Active</option><option>Planning</option></Sel></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8}}>
            <div><Lbl>Location</Lbl><Inp value={nf.loc} onChange={e=>setNf(f=>({...f,loc:e.target.value}))} placeholder="City, State"/></div>
            <div><Lbl>Start</Lbl><MonInp value={nf.start} onChange={e=>setNf(f=>({...f,start:e.target.value}))}/></div>
            <div><Lbl>End</Lbl><MonInp value={nf.end} onChange={e=>setNf(f=>({...f,end:e.target.value}))}/></div>
          </div>
          <Lbl>Role requirements</Lbl>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
            <Sel value={nr} onChange={e=>setNr(e.target.value)} style={{flex:1,width:"auto"}}>{ROLES.map(r=><option key={r}>{r}</option>)}</Sel>
            <input type="number" min={1} max={20} value={nc2} onChange={e=>setNc2(Number(e.target.value))} style={ss({width:52})}/>
            <button onClick={addRN} style={{padding:"6px 12px",fontSize:12,borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)",flexShrink:0}}>+ Add</button>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>{nf.roles.map(r=><div key={r.role} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",background:"var(--color-background-secondary)",borderRadius:4,fontSize:11}}>{r.role}<span style={{fontWeight:500,color:"#185FA5"}}>×{r.count}</span><span onClick={()=>setNf(f=>({...f,roles:f.roles.filter(x=>x.role!==r.role)}))} style={{cursor:"pointer",color:"#E24B4A",marginLeft:2}}>×</span></div>)}{nf.roles.length===0&&<span style={{fontSize:11,color:"var(--color-text-secondary)"}}>No roles added</span>}</div>
          <button onClick={submitAdd} style={{padding:"7px 20px",fontSize:13,borderRadius:8,border:"none",background:valid?"#1D9E75":"var(--color-background-secondary)",color:valid?"#fff":"var(--color-text-secondary)",cursor:valid?"pointer":"default",fontFamily:"var(--font-sans)",fontWeight:500}}>Create project</button>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>
        {rows.map(p=>{
          const req=projReq(p), filled=emps.filter(e=>e.pid===p.id).length, pct=req?Math.round(filled/req*100):0, assigned=emps.filter(e=>e.pid===p.id);
          return (
            <div key={p.id} style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1rem 1.25rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div><div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{p.name}</div><div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{p.loc}</div></div>
                <Pill label={p.status} bg={p.status==="Active"?"#E6F1FB":"#FAEEDA"} tc={p.status==="Active"?"#0C447C":"#854F0B"}/>
              </div>
              <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Staffing</span><span style={{fontSize:12,fontWeight:500}}>{filled}/{req}</span></div>
                <div style={{background:"var(--color-background-secondary)",borderRadius:4,height:6,marginBottom:10}}><div style={{width:pct+"%",height:"100%",borderRadius:4,background:pct===100?"#639922":pct>=70?"#378ADD":"#EF9F27"}}></div></div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{display:"flex"}}>{assigned.slice(0,4).map((e,i)=><div key={e.id} style={{width:26,height:26,borderRadius:"50%",background:DC[e.div]+"33",border:"2px solid var(--color-background-primary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:500,color:DC[e.div],marginLeft:i>0?-8:0}}>{ini(e.name)}</div>)}{assigned.length>4&&<div style={{width:26,height:26,borderRadius:"50%",background:"var(--color-background-secondary)",border:"2px solid var(--color-background-primary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,marginLeft:-8,color:"var(--color-text-secondary)"}}>+{assigned.length-4}</div>}</div>
                  <span style={{fontSize:11,color:"var(--color-text-secondary)"}}>Ends {fmtM(p.end)}</span>
                </div>
                <button onClick={()=>setSelId(p.id)} style={{width:"100%",padding:"6px",fontSize:12,borderRadius:7,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)",color:"var(--color-text-primary)"}}>Edit / View</button>
              </div>
              <div style={{marginTop:8}}><Pill label={p.div} bg={DC[p.div]+"22"} tc={DC[p.div]}/></div>
            </div>
          );
        })}
      </div>

      <Drawer open={!!selProj} onClose={()=>setSelId(null)} title="Edit project" accentColor={selProj?DC[selProj.div]:"#1D9E75"}>
        {selProj&&<ProjectDrawer proj={selProj} onSave={f=>{onUpdate(f.id,f);setSelId(null);}} onDelete={id=>{onDelete(id);setSelId(null);}} onClose={()=>setSelId(null)}/>}
      </Drawer>
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
function Board({emps,projs,onAssign}) {
  const [df,setDf]=useState("All"), [cell,setCell]=useState(null);
  const fP=df==="All"?projs:projs.filter(p=>p.div===df), fE=df==="All"?emps:emps.filter(e=>e.div===df);
  const hit=(e,p)=>{if(e.onLeave)return;if(cell?.eId===e.id&&cell?.pId===p.id){setCell(null);return;}setCell({eId:e.id,pId:p.id,eName:e.name,pName:p.name,isA:e.pid===p.id,curP:e.pid&&e.pid!==p.id?projs.find(x=>x.id===e.pid)?.name:null});};
  return (
    <div>
      <DivFilter val={df} set={setDf}/><div style={{marginBottom:"1rem"}}/>
      <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:8}}>Click any cell to assign or remove a team member.</div>
      <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <th style={{padding:"8px 14px",textAlign:"left",fontWeight:500,fontSize:11,color:"var(--color-text-secondary)",background:"var(--color-background-secondary)",minWidth:160,position:"sticky",left:0,zIndex:2}}>Employee</th>
              <th style={{padding:"8px 12px",textAlign:"left",fontWeight:500,fontSize:11,color:"var(--color-text-secondary)",background:"var(--color-background-secondary)",minWidth:120}}>Role</th>
              {fP.map(p=>{const req=projReq(p),filled=emps.filter(e=>e.pid===p.id).length;return(<th key={p.id} style={{padding:"8px 10px",textAlign:"center",fontWeight:500,fontSize:11,color:"var(--color-text-secondary)",background:"var(--color-background-secondary)",minWidth:105}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:105}}>{p.name}</div><div style={{fontWeight:400,color:DC[p.div],fontSize:10,marginTop:1}}>{p.div==="Northeast"?"NE":p.div==="Southeast"?"SE":"Rail"} · {filled}/{req}</div></th>);})}
            </tr></thead>
            <tbody>{fE.map((e,i)=>{const status=getStatus(e);return(<tr key={e.id} style={{borderBottom:"0.5px solid var(--color-border-tertiary)",background:i%2===0?"var(--color-background-primary)":"var(--color-background-secondary)"}}>
              <td style={{padding:"7px 14px",position:"sticky",left:0,zIndex:1,background:i%2===0?"var(--color-background-primary)":"var(--color-background-secondary)"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:"50%",background:DC[e.div]+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:500,color:DC[e.div],flexShrink:0}}>{ini(e.name)}</div><span style={{fontWeight:500,whiteSpace:"nowrap"}}>{e.name}</span></div></td>
              <td style={{padding:"7px 12px",fontSize:11}}><div style={{color:"var(--color-text-secondary)",marginBottom:3}}>{e.role}</div><Pill label={status} bg={SBG[status]} tc={STC[status]}/></td>
              {fP.map(p=>{const isA=e.pid===p.id,isL=e.onLeave,isAct=cell?.eId===e.id&&cell?.pId===p.id;return(<td key={p.id} style={{padding:"7px 10px",textAlign:"center",cursor:isL?"default":"pointer"}} onClick={()=>hit(e,p)}>
                {isL?<div style={{width:18,height:18,background:"#FAEEDA",borderRadius:"50%",margin:"0 auto"}}/>:isA?<div style={{width:20,height:20,borderRadius:"50%",background:DC[e.div],margin:"0 auto",outline:isAct?"2px solid #EF9F27":"none",outlineOffset:2}}/>:<div style={{width:20,height:20,borderRadius:"50%",border:"0.5px solid var(--color-border-secondary)",margin:"0 auto",background:isAct?"var(--color-background-info)":"transparent"}}/>}
              </td>);})}
            </tr>);})}</tbody>
          </table>
        </div>
      </div>
      {cell&&<div style={{marginTop:"1rem",background:"var(--color-background-primary)",border:`0.5px solid var(--color-border-tertiary)`,borderLeft:`3px solid ${cell.isA?"#E24B4A":"#1D9E75"}`,borderRadius:"var(--border-radius-lg)",padding:"1rem 1.25rem"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
          <div>{cell.isA?<><div style={{fontSize:13,fontWeight:500}}>Remove {cell.eName} from {cell.pName}?</div><div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>They will be marked Available.</div></>:<><div style={{fontSize:13,fontWeight:500}}>Assign {cell.eName} to {cell.pName}?</div>{cell.curP&&<div style={{fontSize:12,color:"#993C1D",marginTop:2}}>Currently on {cell.curP} — will reassign.</div>}</>}</div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>setCell(null)} style={{padding:"6px 14px",fontSize:12,borderRadius:7,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Cancel</button>
            {cell.isA?<button onClick={()=>{onAssign(cell.eId,null);setCell(null);}} style={{padding:"6px 14px",fontSize:12,borderRadius:7,border:"none",background:"#A32D2D",color:"#fff",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Remove</button>:<button onClick={()=>{onAssign(cell.eId,cell.pId);setCell(null);}} style={{padding:"6px 14px",fontSize:12,borderRadius:7,border:"none",background:"#0F6E56",color:"#fff",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Assign</button>}
          </div>
        </div>
      </div>}
    </div>
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
const CW=40,RH=34,NW=158,RW=124;
function Schedule({emps,projs}) {
  const [df,setDf]=useState("All"), [grp,setGrp]=useState("member");
  const fP=df==="All"?projs:projs.filter(p=>p.div===df), fE=df==="All"?emps:emps.filter(e=>e.div===df);
  const getBar=p=>{if(!p)return null;const si=Math.max(0,mIdx(p.start)-mIdx(TL_START)),ei=Math.min(TL_MONTHS-1,mIdx(p.end)-mIdx(TL_START));return ei<si?null:{left:si*CW,width:(ei-si+1)*CW};};
  const Grid=()=>TL.map((m,mi)=><div key={m.key} style={{position:"absolute",left:mi*CW,top:0,width:CW,height:RH,borderLeft:m.isJan?"1px solid var(--color-border-secondary)":"0.5px solid var(--color-border-tertiary)",background:m.key===TODAY?"rgba(186,117,23,0.04)":"transparent"}}/>);
  const MRow=({e,proj,i})=>{const b=getBar(proj);return(<div style={{display:"flex",alignItems:"stretch",borderBottom:"0.5px solid var(--color-border-tertiary)",height:RH,background:i%2===0?"var(--color-background-primary)":"var(--color-background-secondary)"}}>
    <div style={{width:NW,minWidth:NW,padding:"0 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}><div style={{width:24,height:24,borderRadius:"50%",background:DC[e.div]+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:500,color:DC[e.div],flexShrink:0}}>{ini(e.name)}</div><span style={{fontSize:12,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.name}</span></div>
    <div style={{width:RW,minWidth:RW,padding:"0 12px",display:"flex",alignItems:"center",flexShrink:0}}><span style={{fontSize:11,color:"var(--color-text-secondary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.role}</span></div>
    <div style={{position:"relative",height:RH,width:CW*TL_MONTHS,flexShrink:0}}><Grid/>
      {b&&<div style={{position:"absolute",left:b.left+2,top:6,height:RH-12,width:b.width-4,background:DC[e.div]+"55",borderRadius:4,borderLeft:`3px solid ${DC[e.div]}`,display:"flex",alignItems:"center",paddingLeft:6,overflow:"hidden",boxSizing:"border-box"}}><span style={{fontSize:9,fontWeight:500,color:DC[e.div],whiteSpace:"nowrap"}}>{proj?.name}</span></div>}
      {getStatus(e)==="Available"&&<div style={{position:"absolute",left:TODAY_IDX*CW+2,top:9,height:RH-18,width:CW*4,background:"#EAF3DE",borderRadius:4,border:"0.5px dashed #3B6D11",display:"flex",alignItems:"center",paddingLeft:6}}><span style={{fontSize:9,color:"#3B6D11",fontWeight:500}}>Available</span></div>}
    </div>
  </div>);};
  const GRow=({role,proj,i})=>{const b=getBar(proj);return(<div style={{display:"flex",alignItems:"stretch",borderBottom:"0.5px solid var(--color-border-tertiary)",height:RH,background:"#FCEBEB18"}}>
    <div style={{width:NW,minWidth:NW,padding:"0 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}><div style={{width:24,height:24,borderRadius:"50%",background:"#FCEBEB",border:"1px dashed #E24B4A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#A32D2D",flexShrink:0}}>?</div><span style={{fontSize:11,color:"#A32D2D",fontStyle:"italic"}}>Unfilled</span></div>
    <div style={{width:RW,minWidth:RW,padding:"0 12px",display:"flex",alignItems:"center",flexShrink:0}}><span style={{fontSize:11,color:"#A32D2D"}}>{role}</span></div>
    <div style={{position:"relative",height:RH,width:CW*TL_MONTHS,flexShrink:0}}><Grid/>{b&&<div style={{position:"absolute",left:b.left+2,top:9,height:RH-18,width:b.width-4,background:"#FCEBEB",borderRadius:4,border:"1px dashed #E24B4A",display:"flex",alignItems:"center",paddingLeft:6,overflow:"hidden"}}><span style={{fontSize:9,color:"#A32D2D",fontStyle:"italic"}}>Open</span></div>}</div>
  </div>);};
  const Header=()=>(
    <div style={{display:"flex",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)"}}>
      <div style={{width:NW,minWidth:NW,padding:"8px 14px",fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",flexShrink:0}}>{grp==="member"?"Employee":"Project / Member"}</div>
      <div style={{width:RW,minWidth:RW,padding:"8px 12px",fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",flexShrink:0}}>Role</div>
      {TL.map(m=><div key={m.key} style={{width:CW,minWidth:CW,textAlign:"center",padding:"2px 0",flexShrink:0,borderLeft:m.isJan?"1px solid var(--color-border-secondary)":"0.5px solid var(--color-border-tertiary)",background:m.key===TODAY?"#FAEEDA":"transparent"}}><div style={{fontSize:9,fontWeight:m.isJan||m.key===TODAY?500:400,color:m.key===TODAY?"#854F0B":m.isJan?"var(--color-text-primary)":"var(--color-text-secondary)"}}>{m.label}</div>{m.isJan&&<div style={{fontSize:8,color:"var(--color-text-tertiary)"}}>{m.year}</div>}{m.key===TODAY&&<div style={{fontSize:7,color:"#854F0B",fontWeight:500}}>today</div>}</div>)}
    </div>
  );
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
        <DivFilter val={df} set={setDf}/>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setGrp("member")} style={{padding:"5px 12px",fontSize:12,borderRadius:7,border:`0.5px solid ${grp==="member"?"#185FA5":"var(--color-border-secondary)"}`,background:grp==="member"?"#E6F1FB":"transparent",color:grp==="member"?"#185FA5":"var(--color-text-primary)",cursor:"pointer",fontFamily:"var(--font-sans)"}}>By member</button>
          <button onClick={()=>setGrp("project")} style={{padding:"5px 12px",fontSize:12,borderRadius:7,border:`0.5px solid ${grp==="project"?"#0F6E56":"var(--color-border-secondary)"}`,background:grp==="project"?"#E1F5EE":"transparent",color:grp==="project"?"#0F6E56":"var(--color-text-primary)",cursor:"pointer",fontFamily:"var(--font-sans)"}}>By project</button>
        </div>
      </div>
      <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <div style={{minWidth:NW+RW+CW*TL_MONTHS}}>
            <Header/>
            {grp==="member"?DIVS.map(div=>{const rows=fE.filter(e=>e.div===div);if(!rows.length)return null;return(<div key={div}><div style={{padding:"3px 14px",fontSize:11,fontWeight:500,color:DC[div],background:DC[div]+"11",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>{div}</div>{rows.map((e,i)=><MRow key={e.id} e={e} proj={projs.find(p=>p.id===e.pid)} i={i}/>)}</div>);}):
            fP.map(proj=>{
              const assigned=emps.filter(e=>e.pid===proj.id);
              const gaps=[];proj.roles.forEach(r=>{const n=assigned.filter(e=>e.role===r.role).length;for(let i=n;i<r.count;i++)gaps.push(r.role);});
              return(<div key={proj.id}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 14px",background:DC[proj.div]+"18",borderBottom:"0.5px solid var(--color-border-tertiary)",borderLeft:`4px solid ${DC[proj.div]}`}}>
                  <span style={{fontSize:12,fontWeight:500}}>{proj.name}</span>
                  <Pill label={proj.status} bg={proj.status==="Active"?"#E6F1FB":"#FAEEDA"} tc={proj.status==="Active"?"#0C447C":"#854F0B"}/>
                  <span style={{fontSize:11,color:"var(--color-text-secondary)"}}>{fmtM(proj.start)} – {fmtM(proj.end)}</span>
                  <span style={{marginLeft:"auto",fontSize:11,fontWeight:500,color:gaps.length>0?"#A32D2D":"#3B6D11"}}>{assigned.length}/{projReq(proj)} staffed</span>
                </div>
                {assigned.map((e,i)=><MRow key={e.id} e={e} proj={proj} i={i}/>)}
                {gaps.map((role,i)=><GRow key={`g${i}`} role={role} proj={proj} i={i}/>)}
              </div>);
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Scenarios ────────────────────────────────────────────────────────────────
function Scenarios({scenarios,onAdd,onUpdate,onDelete}) {
  const [adding,setAdding]=useState(false), [editId,setEditId]=useState(null), [delId,setDelId]=useState(null);
  const blank={name:"",desc:"",status:"Draft"};
  const [form,setForm]=useState(blank);
  const STATS=["Draft","In Review","Applied"];
  const startEdit=s=>{setEditId(s.id);setForm({name:s.name,desc:s.desc,status:s.status});setAdding(false);};
  const startAdd=()=>{setForm(blank);setAdding(true);setEditId(null);};
  const ScenForm=({onSave,onCancel,btnLabel,btnColor})=>(
    <div>
      <Lbl>Scenario name</Lbl><Inp value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Hartford Contract Win"/>
      <Lbl>Description</Lbl><TA value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="What does this scenario model?"/>
      <Lbl>Status</Lbl>
      <div style={{display:"flex",gap:5,marginTop:4,marginBottom:12}}>{STATS.map(s=><button key={s} onClick={()=>setForm(f=>({...f,status:s}))} style={{padding:"5px 12px",fontSize:12,borderRadius:6,border:`0.5px solid ${form.status===s?"#378ADD":"var(--color-border-secondary)"}`,background:form.status===s?"#E6F1FB":"transparent",color:form.status===s?"#185FA5":"var(--color-text-secondary)",cursor:"pointer",fontFamily:"var(--font-sans)",fontWeight:form.status===s?500:400}}>{s}</button>)}</div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onSave} style={{flex:1,padding:"8px",fontSize:13,borderRadius:8,border:"none",background:form.name.trim()?btnColor||"#378ADD":"var(--color-background-secondary)",color:form.name.trim()?"#fff":"var(--color-text-secondary)",cursor:form.name.trim()?"pointer":"default",fontFamily:"var(--font-sans)",fontWeight:500}}>{btnLabel}</button>
        <button onClick={onCancel} style={{padding:"8px 14px",fontSize:12,borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Cancel</button>
      </div>
    </div>
  );
  return (
    <div>
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:"1rem",padding:"10px 14px",background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-tertiary)"}}>Scenarios are sandboxes — model changes without affecting the live plan.</div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"1rem"}}>
        <button onClick={startAdd} style={{padding:"6px 14px",fontSize:12,borderRadius:8,border:"0.5px solid #185FA5",background:adding?"#E6F1FB":"transparent",color:"#185FA5",cursor:"pointer",fontFamily:"var(--font-sans)",fontWeight:500}}>+ New scenario</button>
      </div>
      {adding&&<div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1.25rem",marginBottom:"1rem",borderLeft:"3px solid #378ADD"}}><div style={{fontSize:13,fontWeight:500,marginBottom:8}}>New scenario</div><ScenForm onSave={()=>{if(!form.name.trim())return;onAdd(form);setAdding(false);}} onCancel={()=>setAdding(false)} btnLabel="Create scenario"/></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
        {scenarios.map(s=>(
          <div key={s.id} style={{background:"var(--color-background-primary)",border:`0.5px solid var(--color-border-tertiary)`,borderRadius:"var(--border-radius-lg)",padding:"1.25rem"}}>
            {editId===s.id?(
              <div><div style={{fontSize:13,fontWeight:500,marginBottom:8}}>Edit scenario</div><ScenForm onSave={()=>{if(!form.name.trim())return;onUpdate(s.id,form);setEditId(null);}} onCancel={()=>setEditId(null)} btnLabel="Save changes" btnColor="#1D9E75"/></div>
            ):delId===s.id?(
              <div><div style={{fontSize:13,fontWeight:500,marginBottom:6}}>Delete "{s.name}"?</div><div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:12}}>This cannot be undone.</div><div style={{display:"flex",gap:8}}><button onClick={()=>{onDelete(s.id);setDelId(null);}} style={{padding:"7px 14px",fontSize:12,borderRadius:7,border:"none",background:"#A32D2D",color:"#fff",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Yes, delete</button><button onClick={()=>setDelId(null)} style={{padding:"7px 14px",fontSize:12,borderRadius:7,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Cancel</button></div></div>
            ):(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{fontSize:13,fontWeight:500,flex:1,marginRight:8}}>{s.name}</div>
                  <Pill label={s.status} bg={s.status==="Applied"?"#EAF3DE":s.status==="In Review"?"#E6F1FB":"var(--color-background-secondary)"} tc={s.status==="Applied"?"#3B6D11":s.status==="In Review"?"#0C447C":"var(--color-text-secondary)"}/>
                </div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.7,marginBottom:14}}>{s.desc||<em>No description</em>}</div>
                <div style={{display:"flex",gap:6,borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:10}}>
                  <button onClick={()=>startEdit(s)} style={{flex:1,padding:"6px",fontSize:12,borderRadius:7,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Edit</button>
                  <button onClick={()=>setDelId(s.id)} style={{padding:"6px 14px",fontSize:12,borderRadius:7,border:"0.5px solid #E24B4A",background:"transparent",color:"#A32D2D",cursor:"pointer",fontFamily:"var(--font-sans)"}}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!adding&&<div onClick={startAdd} style={{border:"0.5px dashed var(--color-border-secondary)",borderRadius:"var(--border-radius-lg)",padding:"1.25rem",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer",minHeight:100}}><div style={{fontSize:22,color:"var(--color-text-tertiary)"}}>+</div><div style={{fontSize:13,color:"var(--color-text-secondary)"}}>New scenario</div></div>}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({emps,projs}) {
  const total=emps.length,onP=emps.filter(e=>getStatus(e)==="On Project").length,active=projs.filter(p=>p.status==="Active").length,open=projs.reduce((s,p)=>s+(projReq(p)-emps.filter(e=>e.pid===p.id).length),0);
  const dd=DIVS.map(d=>({name:d==="Northeast"?"NE":d==="Southeast"?"SE":"Rail","On Project":emps.filter(e=>e.div===d&&getStatus(e)==="On Project").length,"Available":emps.filter(e=>e.div===d&&getStatus(e)==="Available").length,"On Leave":emps.filter(e=>e.div===d&&e.onLeave).length}));
  return(<div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:"1.25rem"}}><KPI label="Total staff" value={total} note="3 divisions"/><KPI label="Utilization" value={Math.round(onP/total*100)+"%"} note={`${onP} deployed`} vc="#185FA5"/><KPI label="Open positions" value={open} note="unfilled slots" vc="#993C1D"/><KPI label="Active projects" value={active} note={`${projs.length-active} in planning`}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}><div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1rem 1.25rem"}}><div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Staff by division</div><div style={{height:200}}><ResponsiveContainer width="100%" height="100%"><BarChart data={dd} margin={{top:0,right:0,left:-24,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.12)" vertical={false}/><XAxis dataKey="name" tick={{fontSize:12,fill:"#888"}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:12,fill:"#888"}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{fontSize:12,borderRadius:8}}/><Bar dataKey="On Project" stackId="a" fill="#378ADD"/><Bar dataKey="Available" stackId="a" fill="#639922"/><Bar dataKey="On Leave" stackId="a" fill="#EF9F27" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div><div style={{display:"flex",gap:16,marginTop:8}}>{[["On Project","#378ADD"],["Available","#639922"],["On Leave","#EF9F27"]].map(([l,c])=><span key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"var(--color-text-secondary)"}}><span style={{width:10,height:10,borderRadius:2,background:c,display:"inline-block"}}></span>{l}</span>)}</div></div><div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1rem 1.25rem"}}><div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Project staffing</div>{projs.map(p=>{const req=projReq(p),filled=emps.filter(e=>e.pid===p.id).length,pct=req?Math.round(filled/req*100):0;return(<div key={p.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12}}>{p.name}</span><span style={{fontSize:11,color:"var(--color-text-secondary)"}}>{filled}/{req}</span></div><div style={{background:"var(--color-background-secondary)",borderRadius:4,height:5}}><div style={{width:pct+"%",height:"100%",borderRadius:4,background:pct===100?"#639922":pct>=70?"#378ADD":"#EF9F27"}}></div></div></div>);})}</div></div></div>);
}
function Forecast(){return(<div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1rem 1.25rem"}}><div style={{fontSize:13,fontWeight:500,marginBottom:2}}>Projected headcount — 2026</div><div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:16}}>Estimated demand by division</div><div style={{height:280}}><ResponsiveContainer width="100%" height="100%"><LineChart data={FCAST} margin={{top:4,right:16,left:-24,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.12)" vertical={false}/><XAxis dataKey="m" tick={{fontSize:12,fill:"#888"}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:12,fill:"#888"}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{fontSize:12,borderRadius:8}}/><Line type="monotone" dataKey="NE" stroke="#378ADD" strokeWidth={2} dot={{r:3}} name="Northeast"/><Line type="monotone" dataKey="SE" stroke="#1D9E75" strokeWidth={2} dot={{r:3}} name="Southeast"/><Line type="monotone" dataKey="R" stroke="#D85A30" strokeWidth={2} dot={{r:3}} name="Rail"/></LineChart></ResponsiveContainer></div><div style={{display:"flex",gap:20,marginTop:12}}>{[["Northeast","#378ADD"],["Southeast","#1D9E75"],["Rail","#D85A30"]].map(([l,c])=><span key={l} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--color-text-secondary)"}}><span style={{width:20,height:3,borderRadius:2,background:c,display:"inline-block"}}></span>{l}</span>)}</div></div>);}
function Reports({emps,projs}){return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}><div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1rem 1.25rem"}}><div style={{fontSize:13,fontWeight:500,marginBottom:14}}>Utilization by division</div>{DIVS.map(d=>{const t=emps.filter(e=>e.div===d).length,onP=emps.filter(e=>e.div===d&&getStatus(e)==="On Project").length;return(<div key={d} style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}><div style={{width:8,height:8,borderRadius:2,background:DC[d],flexShrink:0}}></div><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12}}>{d}</span><span style={{fontSize:12,fontWeight:500}}>{Math.round(onP/t*100)}%</span></div><div style={{background:"var(--color-background-secondary)",borderRadius:4,height:6}}><div style={{width:Math.round(onP/t*100)+"%",height:"100%",borderRadius:4,background:DC[d]}}></div></div></div></div>);})}</div><div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1rem 1.25rem"}}><div style={{fontSize:13,fontWeight:500,marginBottom:14}}>Open position gaps</div>{projs.filter(p=>emps.filter(e=>e.pid===p.id).length<projReq(p)).map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><div><div style={{fontSize:12}}>{p.name}</div><div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{p.div}</div></div><Pill label={`${projReq(p)-emps.filter(e=>e.pid===p.id).length} open`} bg="#FCEBEB" tc="#A32D2D"/></div>)}</div><div style={{gridColumn:"1/-1",background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1rem 1.25rem"}}><div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Staff summary</div><table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}><thead><tr>{["Division","Total","On Project","Available","On Leave","Utilization"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 0",color:"var(--color-text-secondary)",fontWeight:500,borderBottom:"0.5px solid var(--color-border-tertiary)"}}>{h}</th>)}</tr></thead><tbody>{DIVS.map(d=>{const t=emps.filter(e=>e.div===d).length,onP=emps.filter(e=>e.div===d&&getStatus(e)==="On Project").length,av=emps.filter(e=>e.div===d&&getStatus(e)==="Available").length,ol=emps.filter(e=>e.div===d&&e.onLeave).length;return(<tr key={d} style={{borderBottom:"0.5px solid var(--color-border-tertiary)"}}><td style={{padding:"8px 0",fontWeight:500,color:DC[d]}}>{d}</td><td style={{padding:"8px 0"}}>{t}</td><td style={{padding:"8px 0"}}>{onP}</td><td style={{padding:"8px 0"}}>{av}</td><td style={{padding:"8px 0"}}>{ol}</td><td style={{padding:"8px 0",fontWeight:500}}>{Math.round(onP/t*100)}%</td></tr>);})}</tbody></table></div></div>);}

// ─── Main App ─────────────────────────────────────────────────────────────────
const NAV=[{id:"dashboard",label:"Dashboard"},{id:"people",label:"People"},{id:"projects",label:"Projects"},{id:"board",label:"Resource board"},{id:"schedule",label:"Schedule"},{id:"forecast",label:"Forecast"},{id:"scenarios",label:"Scenarios"},{id:"reports",label:"Reports"}];
export default function App() {
  const [page,setPage]=useState("dashboard");
  const [emps,setEmps]=useState(EMPS0);
  const [projs,setProjs]=useState(PROJS0);
  const [scens,setScens]=useState(SCEN0);
  const addEmp=e=>setEmps(es=>[...es,e]);
  const updateEmp=(id,u)=>setEmps(es=>es.map(e=>e.id===id?{...e,...u}:e));
  const deleteEmp=id=>setEmps(es=>es.filter(e=>e.id!==id));
  const assign=(eId,pId)=>setEmps(es=>es.map(e=>e.id===eId?{...e,pid:pId}:e));
  const addProj=p=>setProjs(ps=>[...ps,p]);
  const updateProj=(id,u)=>setProjs(ps=>ps.map(p=>p.id===id?{...p,...u}:p));
  const deleteProj=id=>{setProjs(ps=>ps.filter(p=>p.id!==id));setEmps(es=>es.map(e=>e.pid===id?{...e,pid:null}:e));};
  const addScen=s=>setScens(ss=>[...ss,{...s,id:Date.now()}]);
  const updateScen=(id,u)=>setScens(ss=>ss.map(s=>s.id===id?{...s,...u}:s));
  const deleteScen=id=>setScens(ss=>ss.filter(s=>s.id!==id));
  const pages={
    dashboard:<Dashboard emps={emps} projs={projs}/>,
    people:<People emps={emps} projs={projs} onUpdate={updateEmp} onDelete={deleteEmp} onAdd={addEmp}/>,
    projects:<Projects emps={emps} projs={projs} onUpdate={updateProj} onDelete={deleteProj} onAdd={addProj}/>,
    board:<Board emps={emps} projs={projs} onAssign={assign}/>,
    schedule:<Schedule emps={emps} projs={projs}/>,
    forecast:<Forecast/>,
    scenarios:<Scenarios scenarios={scens} onAdd={addScen} onUpdate={updateScen} onDelete={deleteScen}/>,
    reports:<Reports emps={emps} projs={projs}/>,
  };
  return (
    <div style={{display:"flex",height:"100vh",background:"var(--color-background-tertiary)",fontFamily:"var(--font-sans)",overflow:"hidden"}}>
      <div style={{width:196,flexShrink:0,background:"var(--color-background-primary)",borderRight:"0.5px solid var(--color-border-tertiary)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"1.1rem 1.25rem 1rem",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><div style={{fontSize:14,fontWeight:500}}>TMC Planner</div><div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:1}}>The Middlesex Corporation</div></div>
        <div style={{flex:1,paddingTop:4,overflowY:"auto"}}>{NAV.map(n=><button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",width:"100%",padding:"8px 1.25rem",border:"none",background:"transparent",borderLeft:page===n.id?"2px solid #378ADD":"2px solid transparent",color:page===n.id?"var(--color-text-primary)":"var(--color-text-secondary)",fontSize:13,cursor:"pointer",textAlign:"left",fontFamily:"var(--font-sans)",fontWeight:page===n.id?500:400}}>{n.label}</button>)}</div>
        <div style={{padding:"0.875rem 1.25rem",borderTop:"0.5px solid var(--color-border-tertiary)"}}><div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{emps.length} staff · {projs.filter(p=>p.status==="Active").length} active</div><div style={{marginTop:4}}>{DIVS.map(d=><span key={d} style={{display:"inline-block",fontSize:10,padding:"1px 6px",borderRadius:99,background:DC[d]+"22",color:DC[d],marginRight:4,marginBottom:2,fontWeight:500}}>{d==="Northeast"?"NE":d==="Southeast"?"SE":"Rail"}</span>)}</div></div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{padding:"0.875rem 1.5rem",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",flexShrink:0}}><div style={{fontSize:15,fontWeight:500}}>{NAV.find(n=>n.id===page)?.label}</div></div>
        <div style={{flex:1,padding:"1.25rem",overflowY:"auto"}}>{pages[page]}</div>
      </div>
    </div>
  );
}
