'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Camera, PlayCircle } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{backgroundColor:'var(--navy)',color:'#fff',marginTop:'0',borderRadius:'48px 48px 0 0',overflow:'hidden'}}>
      <div style={{maxWidth:'72rem',margin:'0 auto',padding:'4rem 2rem 2rem'}}>

        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

          {/* Brand */}
          <div>
            <div style={{marginBottom:'1rem', display: 'flex'}}>
              <Image src="/logo-makse.png" alt="Makse Profissional" width={130} height={40} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
            <p style={{fontSize:'0.8rem',color:'rgba(255,255,255,0.5)',lineHeight:1.7,maxWidth:'220px'}}>
              Tecnologia e performance em cosméticos capilares para profissionais exigentes e clientes que buscam resultados de salão.
            </p>
            <div style={{display:'flex',gap:'0.875rem',marginTop:'1.5rem'}}>
              <a href="https://www.instagram.com/makseconcept/" target="_blank" rel="noreferrer" style={{color:'rgba(255,255,255,0.4)',transition:'color .2s',display:'flex'}}
                 onMouseEnter={e=>(e.currentTarget.style.color='var(--gold)')}
                 onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.4)')}>
                <Camera size={20} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Navegação */}
          <div>
            <h4 style={{fontSize:'0.65rem',letterSpacing:'0.28em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'1.25rem',fontWeight:500}}>Navegação</h4>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              {[['Início','/'],['Catálogo Completo','/catalogo'],['Nossas Linhas','/linhas'],['Para Profissionais','/para-profissionais'],['Seja um Distribuidor','/para-profissionais']].map(([l,h]) => (
                <li key={l}><Link href={h} style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.55)',textDecoration:'none',transition:'color .2s'}}>{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h4 style={{fontSize:'0.65rem',letterSpacing:'0.28em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'1.25rem',fontWeight:500}}>Institucional</h4>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              {[['Política de Privacidade','/privacidade'],['Termos de Uso','/termos'],['Trocas e Devoluções','/trocas'],['Fale Conosco','/contato'],['Minha Conta','/conta']].map(([l,h]) => (
                <li key={l}><Link href={h} style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.55)',textDecoration:'none',transition:'color .2s'}}>{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 style={{fontSize:'0.65rem',letterSpacing:'0.28em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'1.25rem',fontWeight:500}}>Contato</h4>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'0.75rem',fontSize:'0.82rem',color:'rgba(255,255,255,0.55)'}}>
              <li style={{ lineHeight: 1.6 }}>São Gonçalo e São Pedro da Aldeia-RJ</li>
              <li><a href="https://wa.me/5522988726778" style={{color:'rgba(255,255,255,0.55)',textDecoration:'none'}}>+55 22 98872-6778 (WhatsApp)</a></li>
              <li><a href="mailto:contato@makseprofissional.com.br" style={{color:'rgba(255,255,255,0.55)',textDecoration:'none'}}>contato@makseprofissional.com.br</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:'1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'0.5rem'}}>
          <p style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.25)'}}>
            © 2026 Makse Profissional — SS Cosméticos Profissionais LTDA — CNPJ 47.946.965/0001-35. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}