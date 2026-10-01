import { NextResponse } from 'next/server';
import { runAI } from '../../../lib/ai';

export async function POST(req: Request) {
  try {
    const { type, resume } = await req.json();
    if (!resume) return NextResponse.json({ error: 'Resume data is required.' }, { status: 400 });
    const prompt = type === 'summary'
      ? `Improve this professional resume summary. Return only the final summary, no labels or commentary. Use ONLY facts already supplied. Do not invent metrics, employers, degrees, dates, skills, technologies, titles or achievements. Keep it concise and ATS-friendly.\nPERSONAL: ${JSON.stringify(resume.personal)}\nSKILLS: ${JSON.stringify(resume.skills)}`
      : type === 'bullets'
      ? `Rewrite the first experience section bullets for grammar, clarity, impact and ATS readability. Return one bullet per line and nothing else. Preserve every factual claim. Do not invent metrics, technologies, responsibilities, employers, dates or achievements.\nEXPERIENCE: ${JSON.stringify(resume.experience?.[0] || {})}`
      : `Review this resume for grammar, clarity, ATS readability and missing useful information. Return a concise list of actionable corrections only. Never invent facts and never rewrite information that is not present.\nRESUME: ${JSON.stringify(resume)}`;
    return NextResponse.json({ text: await runAI(prompt) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'AI request failed' }, { status: 500 });
  }
}
