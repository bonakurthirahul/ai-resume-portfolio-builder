import './globals.css';import Link from 'next/link';
export const metadata={title:'AI Resume + Portfolio Builder',description:'Build an ATS-friendly resume and portfolio with AI.'};
export default function Layout({children}:{children:React.ReactNode}){return <><header><Link href="/" className="brand">ResumeForge AI</Link><nav><Link href="/dashboard">Dashboard</Link><Link href="/editor">Editor</Link><Link href="/login">Login</Link></nav></header><main>{children}</main></>}
