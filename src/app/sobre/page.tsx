import { Shield, BookOpen, Users, Heart } from 'lucide-react'
import Link from 'next/link'

const C = { maxWidth:'72rem', margin:'0 auto', padding:'0 2rem' } as React.CSSProperties
const sec = (bg='#fff') => ({ padding:'5rem 0', backgroundColor:bg }) as React.CSSProperties

export default function SobrePage() {
  return (
    <div>

      {/* Hero */}
      <section style={{...sec('var(--cream)'), textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-80px',left:'50%',transform:'translateX(-50%)',width:'500px',height:'500px',borderRadius:'50%',background:'radial-gradient(circle,rgba(100,116,139,0.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{...C, position:'relative', zIndex:1}}>
          <span className="section-label">Nossa Essência</span>
          <h1 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'clamp(2.5rem,5vw,4rem)',fontWeight:400,color:'var(--navy)',margin:'0.5rem 0 1rem'}}>
            Makse Profissional
          </h1>
          <p style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'1.15rem',fontStyle:'italic',color:'var(--text-muted)',maxWidth:'480px',margin:'0 auto'}}>
            "Transformação capilar com propósito técnico e humano."
          </p>
          <div style={{width:'40px',height:'2px',background:'var(--gold)',margin:'2rem auto 0',borderRadius:'99px'}}/>
        </div>
      </section>

      {/* Texto intro */}
      <section style={sec('#fff')}>
        <div style={{...C, maxWidth:'48rem', textAlign:'center'}}>
          <p style={{fontSize:'1rem',color:'var(--text-muted)',lineHeight:1.85}}>
            A Makse Profissional não é apenas uma marca de cosméticos; somos uma plataforma de ascensão
            para o profissional da beleza. Entendemos que transformar fios é transformar vidas. Nossa existência
            se baseia na união inegociável entre{' '}
            <strong style={{color:'var(--navy)'}}>performance de salão</strong>,{' '}
            <strong style={{color:'var(--navy)'}}>educação contínua</strong> e{' '}
            <strong style={{color:'var(--navy)'}}>verdade</strong>.
          </p>
        </div>
      </section>

      {/* Missão e Visão */}
      <section style={sec('var(--cream)')}>
        <div style={C}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1.25rem'}}>
            {/* Missão */}
            <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'2.5rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.25rem'}}>
                <div style={{padding:'0.6rem',background:'rgba(100,116,139,0.08)',borderRadius:'50%',color:'var(--gold)',display:'flex'}}>
                  <Shield size={18}/>
                </div>
                <h2 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'1.4rem',fontWeight:400,color:'var(--navy)'}}>Nossa Missão</h2>
              </div>
              <p style={{fontSize:'0.875rem',color:'var(--text-muted)',lineHeight:1.8}}>
                Levar excelência técnica e qualidade real aos salões de beleza, através de produtos capilares
                de alto desempenho e programas de capacitação que empoderam profissionais, distribuidores e
                cabeleireiros. Acreditamos que transformar fios é transformar vidas — com verdade, ética e
                parceria de longo prazo.
              </p>
            </div>
            {/* Visão */}
            <div style={{background:'var(--navy)',borderRadius:'var(--radius-lg)',padding:'2.5rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.25rem'}}>
                <div style={{padding:'0.6rem',background:'rgba(100,116,139,0.06)',borderRadius:'50%',color:'var(--gold)',display:'flex'}}>
                  <BookOpen size={18}/>
                </div>
                <h2 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'1.4rem',fontWeight:400,color:'#fff'}}>Nossa Visão</h2>
              </div>
              <p style={{fontSize:'0.875rem',color:'rgba(255,255,255,0.65)',lineHeight:1.8}}>
                Ser reconhecida globalmente como a marca brasileira que elevou o padrão da beleza
                profissional, unindo ciência, educação e integridade em cada fórmula e em cada relação
                com o mercado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section style={sec('#fff')}>
        <div style={C}>
          <div style={{textAlign:'center',marginBottom:'3rem'}}>
            <span className="section-label">O que nos guia</span>
            <h2 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'clamp(1.8rem,3vw,2.5rem)',fontWeight:400,color:'var(--navy)'}}>
              Nossos Valores
            </h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1.25rem'}}>
            {[
              { icon:<Shield size={22}/>, title:'Verdade como Base', desc:'Não prometemos o que não entregamos. A verdade é nosso maior marketing.' },
              { icon:<Users size={22}/>, title:'Parceria Verdadeira', desc:'Crescemos junto com quem acredita na marca: somos aliados, não fornecedores.' },
              { icon:<BookOpen size={22}/>, title:'Educação como Legado', desc:'Acreditamos que o conhecimento transforma negócios, carreiras e vidas.' },
            ].map(v => (
              <div key={v.title} style={{
                display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',
                padding:'2.25rem 1.75rem',border:'1px solid var(--border)',
                borderRadius:'var(--radius-lg)',background:'#fafafa',
              }}>
                <div style={{padding:'0.75rem',background:'rgba(100,116,139,0.08)',borderRadius:'50%',color:'var(--gold)',marginBottom:'1rem',display:'flex'}}>
                  {v.icon}
                </div>
                <h3 style={{fontSize:'0.95rem',fontWeight:600,color:'var(--navy)',marginBottom:'0.5rem'}}>{v.title}</h3>
                <p style={{fontSize:'0.825rem',color:'var(--text-muted)',lineHeight:1.65}}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'5rem 2rem'}}>
        <div style={{maxWidth:'72rem',margin:'0 auto'}}>
          <div style={{background:'var(--cream)',borderRadius:'var(--radius-lg)',padding:'4rem 2rem',textAlign:'center',border:'1px solid var(--border)'}}>
            <Heart size={28} style={{color:'var(--gold)',margin:'0 auto 1.25rem'}}/>
            <h2 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'clamp(1.8rem,3vw,2.5rem)',fontWeight:400,color:'var(--navy)',marginBottom:'0.75rem'}}>
              Faça parte da família Makse
            </h2>
            <p style={{color:'var(--text-muted)',fontSize:'0.9rem',marginBottom:'2rem',maxWidth:'420px',margin:'0 auto 2rem'}}>
              Seja como profissional parceira ou cliente final, temos o produto certo para você.
            </p>
            <div style={{display:'flex',gap:'0.875rem',justifyContent:'center',flexWrap:'wrap'}}>
              <Link href="/para-profissionais" className="btn-primary">Sou Profissional</Link>
              <Link href="/catalogo" className="btn-outline">Ver Produtos</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}