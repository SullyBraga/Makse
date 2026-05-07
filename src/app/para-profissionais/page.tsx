import { Check, Star, Users, Percent } from 'lucide-react'
import ProfessionalForm from '@/components/shop/ProfessionalForm'

const C = { maxWidth:'72rem', margin:'0 auto', padding:'0 2rem' } as React.CSSProperties
const sec = (bg='#fff') => ({ padding:'5rem 0', backgroundColor:bg }) as React.CSSProperties

export default function ParaProfissionaisPage() {
  return (
    <div>

      {/* Hero */}
      <section style={{...sec('var(--cream)'), textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-80px',right:'-80px',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,rgba(255,183,184,0.18) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{...C, position:'relative', zIndex:1}}>
          <span className="section-label">Área Exclusiva</span>
          <h1 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'clamp(2.5rem,5vw,4rem)',fontWeight:400,color:'var(--navy)',margin:'0.5rem 0 1rem'}}>
            Para Profissionais
          </h1>
          <p style={{color:'var(--text-muted)',fontSize:'0.9rem',maxWidth:'440px',margin:'0 auto',lineHeight:1.7}}>
            Cabeleireiras parceiras têm acesso ao catálogo completo, descontos exclusivos e suporte técnico especializado.
          </p>
        </div>
      </section>

      {/* Benefícios */}
      <section style={sec('#fff')}>
        <div style={C}>
          <div style={{textAlign:'center',marginBottom:'3rem'}}>
            <span className="section-label">Por que ser parceira?</span>
            <h2 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'clamp(1.8rem,3vw,2.5rem)',fontWeight:400,color:'var(--navy)'}}>
              Vantagens exclusivas
            </h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1.25rem'}}>
            {[
              { icon:<Percent size={22}/>, title:'Descontos Progressivos', desc:'Tabelas de preço exclusivas com até 30% de desconto sobre o preço de varejo.' },
              { icon:<Users size={22}/>, title:'Acesso Total', desc:'Visualize e compre todos os produtos do catálogo, incluindo os itens exclusivos pro.' },
              { icon:<Star size={22}/>, title:'Suporte Técnico', desc:'Atendimento prioritário e consultoria técnica para garantir os melhores resultados.' },
            ].map(b => (
              <div key={b.title} style={{
                display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',
                padding:'2.25rem 1.75rem',border:'1px solid var(--border)',
                borderRadius:'var(--radius-lg)',background:'#fafafa',
              }}>
                <div style={{padding:'0.75rem',background:'rgba(255,183,184,0.12)',borderRadius:'50%',color:'var(--gold)',marginBottom:'1rem',display:'flex'}}>
                  {b.icon}
                </div>
                <h3 style={{fontSize:'0.95rem',fontWeight:600,color:'var(--navy)',marginBottom:'0.5rem'}}>{b.title}</h3>
                <p style={{fontSize:'0.825rem',color:'var(--text-muted)',lineHeight:1.65}}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabelas de desconto */}
      <section style={sec('var(--cream)')}>
        <div style={C}>
          <div style={{textAlign:'center',marginBottom:'3rem'}}>
            <span className="section-label">Planos</span>
            <h2 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'clamp(1.8rem,3vw,2.5rem)',fontWeight:400,color:'var(--navy)',margin:'0.5rem 0 0.5rem'}}>
              Tabelas de Parceria
            </h2>
            <p style={{color:'var(--text-muted)',fontSize:'0.875rem'}}>O desconto é atribuído pela nossa equipe após análise do seu cadastro.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1.25rem',maxWidth:'760px',margin:'0 auto'}}>
            {[
              { name:'Parceira Bronze', pct:'15%', features:['Acesso ao catálogo completo','Suporte por WhatsApp','Newsletter técnica'], highlight:false },
              { name:'Parceira Prata', pct:'20%', features:['Tudo do Bronze','Atendimento prioritário','Amostras mensais'], highlight:true },
              { name:'Parceira Ouro', pct:'30%', features:['Tudo do Prata','Consultoria técnica','Condições especiais'], highlight:false },
            ].map(t => (
              <div key={t.name} style={{
                padding:'2rem',borderRadius:'var(--radius-lg)',
                background: t.highlight ? 'var(--navy)' : '#fff',
                border: t.highlight ? 'none' : '1px solid var(--border)',
              }}>
                <p style={{fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.5rem'}}>{t.name}</p>
                <p style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'3.5rem',fontWeight:300,color: t.highlight ? '#fff' : 'var(--navy)',lineHeight:1,marginBottom:'1.5rem'}}>{t.pct}</p>
                <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'0.6rem'}}>
                  {t.features.map(f => (
                    <li key={f} style={{display:'flex',alignItems:'flex-start',gap:'0.5rem',fontSize:'0.82rem',color: t.highlight ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'}}>
                      <Check size={13} style={{color:'var(--gold)',flexShrink:0,marginTop:'2px'}}/>{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulário */}
      <section style={sec('#fff')}>
        <div style={{maxWidth:'540px',margin:'0 auto',padding:'0 2rem'}}>
          <div style={{textAlign:'center',marginBottom:'2.5rem'}}>
            <span className="section-label">Comece agora</span>
            <h2 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'clamp(1.8rem,3vw,2.5rem)',fontWeight:400,color:'var(--navy)',margin:'0.5rem 0 0.5rem'}}>
              Solicite sua Parceria
            </h2>
            <p style={{color:'var(--text-muted)',fontSize:'0.875rem'}}>Nossa equipe analisará seu cadastro e retornará em até 2 dias úteis.</p>
          </div>
          <div style={{background:'var(--cream)',borderRadius:'var(--radius-lg)',padding:'2.5rem',border:'1px solid var(--border)'}}>
            <ProfessionalForm/>
          </div>
        </div>
      </section>
    </div>
  )
}