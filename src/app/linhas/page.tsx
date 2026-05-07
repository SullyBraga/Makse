import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const C = { maxWidth:'72rem', margin:'0 auto', padding:'0 2rem' } as React.CSSProperties

const lines = [
  { slug:'crystal', name:'Linha Crystal', subtitle:'O Segredo da Loira Perfeita', desc:'Descoloração precisa, matização intensa e proteção máxima da fibra. Criada para profissionais que não aceitam menos que o resultado perfeito em cada processo de iluminação.', bg:'#fff1f2' },
  { slug:'diamond', name:'Linha Diamond', subtitle:'Liso, Espelhado & Elegante', desc:'Transformação plena com disciplina e brilho intenso. Para fios que exigem controle absoluto sem abrir mão da saúde capilar.', bg:'#fff8f8' },
  { slug:'perfect-repair', name:'Perfect Repair', subtitle:'Reconstrução de Alto Impacto', desc:'O sistema mais completo de reconstrução capilar do mercado. Repara, sela e protege cada fio — do córtex à cutícula.', bg:'#fff1f2' },
  { slug:'bora-extrato', name:'Borá Extrato', subtitle:'Poder da Natureza Concentrado', desc:'Extratos botânicos de alta performance para tratamentos nutritivos e regeneradores que respeitam a natureza dos fios.', bg:'#fff8f8' },
  { slug:'mr-detox', name:'Mr. Detox', subtitle:'Limpeza Profunda & Renovação', desc:'Remove resíduos de produto, excesso de oleosidade e impurezas sem agredir o couro cabeludo.', bg:'#fff1f2' },
  { slug:'makse-ox', name:'Makse Ox', subtitle:'Oxidantes de Precisão', desc:'Oxidantes formulados para garantir coloração uniforme, cobertura total de brancos e máxima proteção durante processos químicos.', bg:'#fff8f8' },
  { slug:'meus-cachos', name:'Meus Cachos', subtitle:'Definição & Hidratação', desc:'Linha desenvolvida para potencializar e celebrar a beleza dos cachos — do tipo 2 ao 4. Definição real, sem ressecamento.', bg:'#fff1f2' },
  { slug:'finalizacao', name:'Finalização', subtitle:'O Toque Final Perfeito', desc:'Protetores térmicos, óleos finalizadores e cremes para finalização que garantem o resultado do salão em casa.', bg:'#fff8f8' },
]

export default function LinhasPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{backgroundColor:'var(--cream)',padding:'5rem 0',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-60px',left:'50%',transform:'translateX(-50%)',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,rgba(255,183,184,0.2) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{...C, position:'relative', zIndex:1}}>
          <span className="section-label">Portfólio Completo</span>
          <h1 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'clamp(2.5rem,5vw,4rem)',fontWeight:400,color:'var(--navy)',margin:'0.5rem 0 1rem'}}>
            Nossas Linhas
          </h1>
          <p style={{color:'var(--text-muted)',fontSize:'0.9rem',maxWidth:'440px',margin:'0 auto',lineHeight:1.7}}>
            Conheça a tecnologia e os ativos que fazem cada linha única — desenvolvidas para todas as necessidades capilares.
          </p>
        </div>
      </section>

      {/* Linhas alternadas */}
      <div style={{backgroundColor:'#fff'}}>
        {lines.map((line, i) => (
          <div key={line.slug} style={{
            display:'grid',
            gridTemplateColumns: i % 2 === 0 ? '1fr 1fr' : '1fr 1fr',
            minHeight:'360px',
            borderBottom:'1px solid var(--border)',
          }}>
            {/* Imagem — alterna lado */}
            {i % 2 !== 0 && (
              <div style={{background:line.bg,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'280px'}}>
                <span style={{fontSize:'5rem',fontWeight:300,color:'rgba(255,183,184,0.35)',fontFamily:'var(--font-cormorant),Georgia,serif'}}>
                  {line.name.split(' ').pop()}
                </span>
              </div>
            )}
            {/* Texto */}
            <div style={{display:'flex',alignItems:'center',padding:'3.5rem 4rem'}}>
              <div>
                <span className="section-label">{line.subtitle}</span>
                <h2 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'clamp(1.75rem,3vw,2.4rem)',fontWeight:400,color:'var(--navy)',margin:'0.25rem 0 1rem'}}>
                  {line.name}
                </h2>
                <p style={{color:'var(--text-muted)',fontSize:'0.875rem',lineHeight:1.8,maxWidth:'380px',marginBottom:'2rem'}}>
                  {line.desc}
                </p>
                <Link href={`/catalogo?linha=${line.slug}`} className="btn-primary" style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',fontSize:'0.65rem'}}>
                  Ver Produtos <ArrowRight size={13}/>
                </Link>
              </div>
            </div>
            {/* Imagem lado direito (índice par) */}
            {i % 2 === 0 && (
              <div style={{background:line.bg,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'280px'}}>
                <span style={{fontSize:'5rem',fontWeight:300,color:'rgba(255,183,184,0.35)',fontFamily:'var(--font-cormorant),Georgia,serif'}}>
                  {line.name.split(' ').pop()}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <section style={{padding:'5rem 2rem',backgroundColor:'var(--cream)',textAlign:'center'}}>
        <div style={{maxWidth:'44rem',margin:'0 auto'}}>
          <span className="section-label">Precisa de ajuda?</span>
          <h2 style={{fontFamily:'var(--font-cormorant),Georgia,serif',fontSize:'clamp(1.8rem,3vw,2.5rem)',fontWeight:400,color:'var(--navy)',margin:'0.5rem 0 1rem'}}>
            Não sabe qual escolher?
          </h2>
          <p style={{color:'var(--text-muted)',fontSize:'0.9rem',marginBottom:'2rem',lineHeight:1.7}}>
            Nossa equipe especializada pode indicar a linha e os produtos ideais para cada necessidade.
          </p>
          <Link href="/contato" className="btn-primary">Falar com Especialista</Link>
        </div>
      </section>
    </div>
  )
}