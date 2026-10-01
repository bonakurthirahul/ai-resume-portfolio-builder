'use client';

import { useEffect, useMemo, useState } from 'react';
type Education={school:string;degree:string;field:string;start:string;end:string;details:string};
type Experience={company:string;role:string;start:string;end:string;location:string;bullets:string[]};
type Project={name:string;description:string;url:string;technologies:string;bullets:string[]};
type ResumeData={personal:{name:string;email:string;phone:string;location:string;username:string;website:string;linkedin:string;github:string;summary:string};skills:{technical:string[];soft:string[]};education:Education[];experience:Experience[];projects:Project[];certifications:string[];achievements:string[];volunteer:string[];publications:string[];interests:string[];extracurricular:string[];references:string[];resumeTemplate:string;portfolioTheme:string;accent:string;published:boolean;updatedAt:string};
const emptyResume:ResumeData={personal:{name:'',email:'',phone:'',location:'',username:'',website:'',linkedin:'',github:'',summary:''},skills:{technical:[],soft:[]},education:[],experience:[],projects:[],certifications:[],achievements:[],volunteer:[],publications:[],interests:[],extracurricular:[],references:[],resumeTemplate:'ats-classic',portfolioTheme:'developer',accent:'#2563eb',published:false,updatedAt:''};
import { supabase } from '../../lib/supabase';

const templates = [
  ['ats-classic','ATS Classic','Clean, recruiter-safe structure'],
  ['modern-slate','Modern Slate','Sharp modern hierarchy'],
  ['minimal-mono','Minimal Mono','Quiet and highly readable'],
  ['executive-serif','Executive Serif','Traditional executive look'],
  ['clean-blue','Clean Blue','Professional blue accent'],
  ['tech-grid','Tech Grid','Technical and structured'],
  ['editorial','Editorial','Premium editorial typography'],
  ['swiss','Swiss','Swiss-inspired grid system'],
  ['compact-ats','Compact ATS','Dense one-page layout'],
  ['bold-header','Bold Header','Strong name and section treatment'],
  ['two-column','Two Column','Skills and details sidebar'],
  ['elegant','Elegant','Refined understated layout'],
  ['academic','Academic','Research and education focused'],
  ['product','Product','Product-builder portfolio feel'],
  ['consultant','Consultant','Consulting-style hierarchy'],
  ['startup','Startup','Modern startup aesthetic'],
  ['finance','Finance','Conservative finance style'],
  ['creative','Creative','Expressive but professional'],
  ['healthcare','Healthcare','Clean clinical presentation'],
  ['legal','Legal','Formal legal-professional style'],
  ['marketing','Marketing','Modern brand-forward layout'],
  ['data','Data','Data/analytics focused'],
  ['developer','Developer','Engineering-oriented layout'],
  ['graduate','Graduate','Early-career friendly'],
  ['timeline','Timeline','Experience-first timeline layout'],
] as const;

const themes = ['developer','minimal','creative','dark','student','tech'];
const tabs = ['personal','education','experience','projects','skills','design','ai'] as const;
type Tab = typeof tabs[number];

export default function Editor() {
  const [d, setD] = useState<ResumeData>(emptyResume);
  const [uid, setUid] = useState('');
  const [tab, setTab] = useState<Tab>('personal');
  const [status, setStatus] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const s = supabase();
      const { data: { user } } = await s.auth.getUser();
      if (user) {
        setUid(user.id);
        const { data: p } = await s.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (p) {
          setD(x => ({
            ...x,
            personal: { ...x.personal, name: p.full_name || '', username: p.username || '', email: user.email || '' },
            published: !!p.published,
          }));
        }
        const { data: r } = await s.from('resumes').select('data').eq('user_id', user.id).maybeSingle();
        if (r?.data) setD(r.data as ResumeData);
      } else {
        const local = localStorage.getItem('resume-data');
        if (local) {
          try { setD(JSON.parse(local) as ResumeData); } catch {}
        }
      }
    })();
  }, []);

  const update = (path: string, value: unknown) => setD(x => {
    const n = structuredClone(x) as any;
    const parts = path.split('.');
    let o = n;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts.at(-1)!] = value;
    return n;
  });

  async function save() {
    setStatus('Saving…');
    localStorage.setItem('resume-data', JSON.stringify(d));
    if (uid) {
      const s = supabase();
      await s.from('resumes').upsert({ user_id: uid, data: d }, { onConflict: 'user_id' });
      await s.from('profiles').upsert({ id: uid, full_name: d.personal.name, username: d.personal.username, published: d.published });
    }
    setStatus('Saved just now');
  }

  useEffect(() => {
    const x = setTimeout(save, 1200);
    return () => clearTimeout(x);
  }, [d]);

  async function ai(type: 'summary' | 'bullets' | 'review') {
    setAiBusy(true); setStatus('AI is reviewing your resume…');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, resume: d }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'AI failed');
      if (type === 'summary') update('personal.summary', j.text);
      if (type === 'bullets' && d.experience[0]) update('experience.0.bullets', j.text.split('\n').map((x: string) => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean));
      if (type === 'review') setStatus(j.text || 'AI review complete'); else setStatus('AI updated your resume');
    } catch (e) { setStatus(e instanceof Error ? e.message : 'AI failed'); }
    finally { setAiBusy(false); }
  }

  const filteredTemplates = useMemo(() => templates.filter(t => (t[0] + t[1] + t[2]).toLowerCase().includes(search.toLowerCase())), [search]);
  const selectedTemplate = templates.find(t => t[0] === d.resumeTemplate)?.[1] || 'ATS Classic';

  return (
    <section className="editor-shell">
      <aside className="editor-sidebar">
        <div className="brand-lockup"><div className="brand-mark">R</div><div><strong>ResumeForge</strong><small>Career Studio</small></div></div>
        <div className="side-label">WORKSPACE</div>
        {tabs.map(x => <button className={tab === x ? 'side active' : 'side'} onClick={() => setTab(x)} key={x}><span>{({personal:'01',education:'02',experience:'03',projects:'04',skills:'05',design:'06',ai:'AI'} as any)[x]}</span>{x[0].toUpperCase()+x.slice(1)}</button>)}
        <div className="sidebar-spacer" />
        <button className="btn full" onClick={save}>Save resume</button>
        <button className="side" onClick={() => window.print()}><span>↗</span> Print / PDF</button>
      </aside>

      <main className="editor-main">
        <header className="editor-topbar">
          <div><div className="eyebrow">Resume editor</div><h1>Build a resume that feels ready.</h1><p>Professional layouts, ATS-friendly structure and fact-safe AI editing.</p></div>
          <div className="top-actions"><span className="save-status">{status}</span><button className="btn" onClick={save}>Save</button></div>
        </header>

        {tab === 'personal' && <Panel title="Personal information" subtitle="Use the details recruiters should see first."><div className="form-grid"><Input label="Full name" value={d.personal.name} onChange={v=>update('personal.name',v)} /><Input label="Professional title / username" value={d.personal.username} onChange={v=>update('personal.username',v)} /><Input label="Email" value={d.personal.email} onChange={v=>update('personal.email',v)} /><Input label="Phone" value={d.personal.phone} onChange={v=>update('personal.phone',v)} /><Input label="Location" value={d.personal.location} onChange={v=>update('personal.location',v)} /><Input label="Website" value={d.personal.website} onChange={v=>update('personal.website',v)} /><Input label="LinkedIn" value={d.personal.linkedin} onChange={v=>update('personal.linkedin',v)} /><Input label="GitHub" value={d.personal.github} onChange={v=>update('personal.github',v)} /></div><label>Professional summary<textarea className="large" value={d.personal.summary} onChange={e=>update('personal.summary',e.target.value)} placeholder="2–4 concise lines about your professional profile" /></label><button className="ai-inline" disabled={aiBusy} onClick={()=>ai('summary')}>✦ Improve summary with AI</button></Panel>}

        {tab === 'education' && <Panel title="Education" subtitle="Add degrees, schools, dates and useful details."><button className="btn" onClick={()=>setD(x=>({...x,education:[...x.education,{school:'',degree:'',field:'',start:'',end:'',details:''}]}))}>+ Add education</button>{d.education.map((e,i)=><div className="item-card" key={i}><div className="item-head"><b>Education {i+1}</b><button className="remove" onClick={()=>setD(x=>({...x,education:x.education.filter((_,j)=>j!==i)}))}>Remove</button></div><div className="form-grid"><Input label="School / college" value={e.school} onChange={v=>update(`education.${i}.school`,v)} /><Input label="Degree" value={e.degree} onChange={v=>update(`education.${i}.degree`,v)} /><Input label="Field of study" value={e.field} onChange={v=>update(`education.${i}.field`,v)} /><Input label="Start" value={e.start} onChange={v=>update(`education.${i}.start`,v)} /><Input label="End" value={e.end} onChange={v=>update(`education.${i}.end`,v)} /><Input label="Details" value={e.details} onChange={v=>update(`education.${i}.details`,v)} /></div></div>)}</Panel>}

        {tab === 'experience' && <Panel title="Experience" subtitle="Make responsibilities clear, concise and achievement-focused without inventing facts."><button className="btn" onClick={()=>setD(x=>({...x,experience:[...x.experience,{company:'',role:'',start:'',end:'',location:'',bullets:['']}]}))}>+ Add experience</button>{d.experience.map((e,i)=><div className="item-card" key={i}><div className="item-head"><b>Experience {i+1}</b><button className="remove" onClick={()=>setD(x=>({...x,experience:x.experience.filter((_,j)=>j!==i)}))}>Remove</button></div><div className="form-grid"><Input label="Company" value={e.company} onChange={v=>update(`experience.${i}.company`,v)} /><Input label="Role" value={e.role} onChange={v=>update(`experience.${i}.role`,v)} /><Input label="Start" value={e.start} onChange={v=>update(`experience.${i}.start`,v)} /><Input label="End" value={e.end} onChange={v=>update(`experience.${i}.end`,v)} /><Input label="Location" value={e.location} onChange={v=>update(`experience.${i}.location`,v)} /></div><label>Responsibilities / achievements<textarea className="large" value={e.bullets.join('\n')} onChange={x=>update(`experience.${i}.bullets`,x.target.value.split('\n'))} placeholder="One bullet per line" /></label>{i===0 && <button className="ai-inline" disabled={aiBusy} onClick={()=>ai('bullets')}>✦ Correct and strengthen these bullets with AI</button>}</div>)}</Panel>}

        {tab === 'projects' && <Panel title="Projects" subtitle="Show practical work, outcomes and technologies."><button className="btn" onClick={()=>setD(x=>({...x,projects:[...x.projects,{name:'',description:'',url:'',technologies:'',bullets:['']}]}))}>+ Add project</button>{d.projects.map((p,i)=><div className="item-card" key={i}><div className="item-head"><b>Project {i+1}</b><button className="remove" onClick={()=>setD(x=>({...x,projects:x.projects.filter((_,j)=>j!==i)}))}>Remove</button></div><div className="form-grid"><Input label="Project name" value={p.name} onChange={v=>update(`projects.${i}.name`,v)} /><Input label="Project URL" value={p.url} onChange={v=>update(`projects.${i}.url`,v)} /><Input label="Technologies" value={p.technologies} onChange={v=>update(`projects.${i}.technologies`,v)} /></div><label>Description<textarea value={p.description} onChange={e=>update(`projects.${i}.description`,e.target.value)} /></label></div>)}</Panel>}

        {tab === 'skills' && <Panel title="Skills" subtitle="Keep skills specific and easy to scan."><div className="form-grid"><label>Technical skills<textarea value={d.skills.technical.join(', ')} onChange={e=>update('skills.technical',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} placeholder="React, TypeScript, SQL" /></label><label>Soft skills<textarea value={d.skills.soft.join(', ')} onChange={e=>update('skills.soft',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} placeholder="Communication, leadership" /></label></div></Panel>}

        {tab === 'design' && <Panel title="Design studio" subtitle={`25 original professional layouts. Current: ${selectedTemplate}.` }><div className="template-toolbar"><div><b>Resume templates</b><span>{templates.length} layouts</span></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search templates…" /></div><div className="template-grid">{filteredTemplates.map(t=><button key={t[0]} className={`template-card ${d.resumeTemplate===t[0]?'selected':''}`} onClick={()=>update('resumeTemplate',t[0])}><div className={`template-thumb ${t[0]}`}><span>{d.personal.name || 'YOUR NAME'}</span><i /><i /><i /><i /></div><strong>{t[1]}</strong><small>{t[2]}</small></button>)}</div><div className="design-row"><label>Portfolio theme<select value={d.portfolioTheme} onChange={e=>update('portfolioTheme',e.target.value)}>{themes.map(x=><option key={x}>{x}</option>)}</select></label><label>Accent color<input type="color" value={d.accent} onChange={e=>update('accent',e.target.value)} /></label></div><button className="btn" onClick={()=>{update('published',!d.published);setStatus(d.published?'Unpublished':'Ready to publish')}}>{d.published?'Unpublish portfolio':'Publish portfolio'}</button><p className="muted">These are original layouts with professional patterns; they do not copy proprietary Canva templates.</p></Panel>}

        {tab === 'ai' && <Panel title="AI Career Assistant" subtitle="AI improves wording using only information already present in your resume."><div className="ai-hero"><div className="ai-icon">✦</div><div><b>Fact-safe resume correction</b><p>Fix grammar, improve clarity, strengthen ATS wording and flag weak sections without making up employers, degrees, metrics, dates or skills.</p></div></div><div className="ai-actions"><button className="btn" disabled={aiBusy} onClick={()=>ai('summary')}>Improve summary</button><button className="btn" disabled={aiBusy} onClick={()=>ai('bullets')}>Improve first experience</button><button className="btn ghost" disabled={aiBusy} onClick={()=>ai('review')}>Review resume</button></div><div className="ai-note">Tip: run AI after entering your facts, then review every suggested change before submitting an application.</div></Panel>}
      </main>

      <aside className="preview-column"><div className="preview-head"><div><span>LIVE PREVIEW</span><b>{selectedTemplate}</b></div><button onClick={()=>window.print()}>Export PDF ↗</button></div><ResumePreview d={d}/></aside>
    </section>
  );
}

function Input({label,value,onChange}:{label:string,value:string,onChange:(v:string)=>void}) { return <label>{label}<input value={value} onChange={e=>onChange(e.target.value)} /></label>; }
function Panel({title,subtitle,children}:{title:string,subtitle:string,children:React.ReactNode}) { return <div className="panel"><div className="panel-title"><div><h2>{title}</h2><p>{subtitle}</p></div></div>{children}</div>; }

function ResumePreview({d}:{d:ResumeData}) {
  return <div className={`paper template-${d.resumeTemplate}`} style={{'--accent':d.accent} as React.CSSProperties}>
    <div className="resume-head"><div><h1>{d.personal.name||'Your Name'}</h1><div className="resume-role">{d.personal.username||'Professional'}</div></div><p>{[d.personal.email,d.personal.phone,d.personal.location].filter(Boolean).join('  ·  ')}</p></div>
    {d.personal.summary && <Section title="Profile"><p>{d.personal.summary}</p></Section>}
    {d.experience.length>0 && <Section title="Experience">{d.experience.map((e,i)=><div className="resume-entry" key={i}><div className="entry-top"><b>{e.role||'Role'}</b><span>{[e.start,e.end].filter(Boolean).join(' – ')}</span></div><div className="entry-company">{e.company}{e.location?` · ${e.location}`:''}</div>{e.bullets.filter(Boolean).map((b,j)=><p className="bullet" key={j}>{b}</p>)}</div>)}</Section>}
    {d.education.length>0 && <Section title="Education">{d.education.map((e,i)=><div className="resume-entry" key={i}><div className="entry-top"><b>{[e.degree,e.field].filter(Boolean).join(' — ')||'Degree'}</b><span>{[e.start,e.end].filter(Boolean).join(' – ')}</span></div><div className="entry-company">{e.school}</div>{e.details&&<p>{e.details}</p>}</div>)}</Section>}
    {d.projects.length>0 && <Section title="Projects">{d.projects.map((p,i)=><div className="resume-entry" key={i}><div className="entry-top"><b>{p.name||'Project'}</b>{p.url&&<span>{p.url}</span>}</div>{p.technologies&&<div className="entry-company">{p.technologies}</div>}<p>{p.description}</p>{p.bullets.filter(Boolean).map((b,j)=><p className="bullet" key={j}>{b}</p>)}</div>)}</Section>}
    {d.skills.technical.length>0 && <Section title="Skills"><p><b>Technical:</b> {d.skills.technical.join(' · ')}</p>{d.skills.soft.length>0&&<p><b>Strengths:</b> {d.skills.soft.join(' · ')}</p>}</Section>}
  </div>;
}
function Section({title,children}:{title:string,children:React.ReactNode}) { return <section className="resume-section"><h3>{title}</h3>{children}</section>; }
