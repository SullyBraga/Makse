import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const C = { maxWidth:'72rem', margin:'0 auto', padding:'0 2rem' } as React.CSSProperties

const lines = [
  {
    slug: 'diamond',
    name: 'Linha Diamond',
    subtitle: 'Purificação e Alinhamento Luxuoso dos Fios',
    desc: 'Esta linha é voltada para o preparo e alisamento capilar. Ela inicia com uma limpeza profunda que purifica o couro cabeludo, remove resíduos e controla a oleosidade sem ressecar. Em seguida, os retexturizadores promovem um alinhamento capilar de alto padrão, redução drástica de frizz, proteção térmica e brilho espelhado deslumbrante, mantendo o movimento natural dos fios e oferecendo matização específica para os tons loiros.',
    bg: '#fff8f8'
  },
  {
    slug: 'mk-detox',
    name: 'Linha MK Detox',
    subtitle: 'Desintoxicação Profunda e Renovação Capilar',
    desc: 'Desenvolvida para remover metais pesados, poluentes e acúmulos químicos que opacam e prejudicam a saúde capilar. Promove uma desintoxicação profunda da fibra e do couro cabeludo, restaurando a leveza, a maciez e o brilho dos fios, além de deixar o ambiente capilar totalmente saudável e preparado para absorver novos nutrientes.',
    bg: '#fff1f2'
  },
  {
    slug: 'perfect-repair',
    name: 'Linha Perfect Repair',
    subtitle: 'Reparação Intensiva e Fortalecimento Estrutural',
    desc: 'A solução ideal para fios severamente danificados, quebradiços e com porosidade química. Atua diretamente no córtex e na cutícula do cabelo, repondo a massa perdida, restaurando as pontes capilares e devolvendo a resistência e a elasticidade desde a lavagem. Além disso, sela as cutículas e blinda os fios contra o calor de ferramentas térmicas e agressões externas.',
    bg: '#fff8f8'
  },
  {
    slug: 'hidrosystem',
    name: 'Linha HidroSystem',
    subtitle: 'Hidratação Profunda e Nutrição Lipídica',
    desc: 'Destinada a combater o ressecamento crônico através da combinação rica de óleos nobres de Argan, Amêndoas e Quinoa. Limpa suavemente enquanto trata os fios, garantindo uma dose exata de emoliência e retenção hídrica perfeita dentro da fibra. O resultado são cabelos extremamente macios, iluminados, super maleáveis e livres de frizz.',
    bg: '#fff1f2'
  },
  {
    slug: 'nutribalance',
    name: 'Linha NutriBalance',
    subtitle: 'Nutrição de Alta Performance e Leveza',
    desc: 'Desenvolvida para cabelos sedentos que precisam de reposição rápida de lipídios sem pesar na raiz. Restaura a barreira protetora do cabelo através de ativos como Manteiga de Cupuaçu e Ceramidas, enquanto previne a quebra e traz uma potente ação antioxidante. Proporciona vitalidade, brilho radiante e um toque aveludado com movimento solto.',
    bg: '#fff8f8'
  },
  {
    slug: 'crystal',
    name: 'Linha Crystal',
    subtitle: 'Clareamento Seguro e Matização Premium',
    desc: 'Voltada exclusivamente para as necessidades dos cabelos loiros e processos de descoloração. Garante a abertura de tons com máxima segurança, protegendo a elasticidade e a estrutura da fibra capilar para evitar a quebra durante o clareamento. Também atua na neutralização de oxidações e tons amarelados indesejados, promovendo um loiro platinado iluminado, uniforme e altamente revitalizado.',
    bg: '#fff1f2'
  },
  {
    slug: 'makse-ox',
    name: 'Makse OX',
    subtitle: 'Revelação de Cor com Proteção Estrutural',
    desc: 'Linha de águas oxigenadas com fórmula estabilizada e enriquecida para preservar a integridade da fibra capilar durante os processos químicos de descoloração e coloração. Garante cores vibrantes, uniformes e duradouras enquanto mantém os fios altamente protegidos.',
    bg: '#fff8f8'
  },
  {
    slug: 'meus-cachos',
    name: 'Linha Meus Cachos',
    subtitle: 'Modelagem Perfeita e Nutrição de Alta Durabilidade',
    desc: 'Criada para atender às necessidades específicas dos cabelos crespos e cacheados, fortalecendo os fios curvos e selando suas cutículas. Retém a umidade natural do cabelo, controla o volume e disciplina o frizz, garantindo alta fixação com flexibilidade. Proporciona cachos perfeitamente modelados, macios e com brilho espelhado, assegurando day afters incríveis sem aspect rígido.',
    bg: '#fff1f2'
  },
  {
    slug: 'finish',
    name: 'Linha Finish',
    subtitle: 'Finalização de Luxo e Proteção Diária',
    desc: 'Composta por finalizadores e óleos de alta performance que oferecem um toque de puro luxo e manutenção diária. Nutre instantaneamente, sela pontas duplas, elimina o frizz e facilita o desembaraço sem pesar nos fios. Cria uma barreira protetora completa contra o calor excessivo de secadores e chapinhas, além de defender o cabelo contra agressões ambientais.',
    bg: '#fff8f8'
  },
  {
    slug: 'essence',
    name: 'Linha Essence',
    subtitle: 'Perfumaria Capilar Premium e Sofisticação',
    desc: 'A assinatura final de elegância para o cuidado diário dos cabelos. Desenvolvida para neutralizar odores indesejados do cotidiano, como fumaça e poluição, deixando um rastro de fragrância premium de alta durabilidade. Além de perfumar, proporciona brilho extra e toque sedoso para selar qualquer visual.',
    bg: '#fff1f2'
  },
  {
    slug: 'bioforce',
    name: 'Linha BioForce',
    subtitle: 'Regeneração Capilar e Blindagem Anti-Quebra',
    desc: 'Uma linha de reconstrução pós-química desenvolvida para restaurar cabelos severamente fragilizados e sensibilizados. Auxilia no crescimento saudável e melhora a elasticidade da fibra capilar. Através da tecnologia Anti-Breaking e 20X Defense, cria uma blindagem estrutural sobre os fios, reduzindo drasticamente a quebra e protegendo contra agressões mecânicas, térmicas e ambientais.',
    bg: '#fff8f8'
  }
]

export default function LinhasPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{backgroundColor:'var(--cream)',padding:'5rem 0',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-60px',left:'50%',transform:'translateX(-50%)',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,rgba(100,116,139,0.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
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
          <div key={line.slug} className="grid grid-cols-1 md:grid-cols-2 min-h-[360px]" style={{ borderBottom: '1px solid var(--border)' }}>
            
            {/* Imagem */}
            <div className={`flex items-center justify-center min-h-[280px] md:min-h-full ${i % 2 === 0 ? 'order-1 md:order-2' : 'order-1 md:order-1'}`} style={{background:line.bg}}>
              <span style={{fontSize:'clamp(4rem, 8vw, 6rem)',fontWeight:300,color:'rgba(100,116,139,0.15)',fontFamily:'var(--font-cormorant),Georgia,serif'}}>
                {line.name.split(' ').pop()}
              </span>
            </div>

            {/* Texto */}
            <div className={`flex items-center ${i % 2 === 0 ? 'order-2 md:order-1' : 'order-2 md:order-2'}`}
              style={{
                padding: '2.5rem 2rem',
                paddingLeft:  i % 2 === 0 ? 'max(2rem, calc((100vw - 72rem) / 2 + 2rem))' : '2.5rem',
                paddingRight: i % 2 === 1 ? 'max(2rem, calc((100vw - 72rem) / 2 + 2rem))' : '2.5rem',
              }}>
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