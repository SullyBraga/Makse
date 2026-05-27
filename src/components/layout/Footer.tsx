'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'

export default function Footer() {
  const [activePopup, setActivePopup] = useState<'privacidade' | 'termos' | 'trocas' | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (activePopup) {
      dialog?.showModal()
      document.body.style.overflow = 'hidden' // Locks background scroll
    } else {
      dialog?.close()
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [activePopup])

  const handleLinkClick = (type: 'privacidade' | 'termos' | 'trocas', e: React.MouseEvent) => {
    e.preventDefault()
    setActivePopup(type)
  }

  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      setActivePopup(null)
    }
  }

  return (
    <footer style={{backgroundColor:'var(--navy)',color:'#fff',marginTop:'0',borderRadius:'48px 48px 0 0',overflow:'hidden'}}>
      <div style={{maxWidth:'72rem',margin:'0 auto',padding:'4rem 2rem 2rem'}}>

        {/* Grid principal */}
        <div className="footer-grid mb-12">

          {/* Brand */}
          <div>
            <div style={{marginBottom:'1rem', display: 'flex'}}>
              <Image src="/logo-makse.png" alt="Makse Profissional" width={130} height={40} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
            <p style={{fontSize:'0.8rem',color:'rgba(255,255,255,0.5)',lineHeight:1.7,maxWidth:'220px'}}>
              Tecnologia e performance em cosméticos capilares para profissionais exigentes e clientes que buscam resultados de salão.
            </p>
            <div style={{display:'flex',gap:'0.875rem',marginTop:'1.5rem'}}>
               <a href="https://www.instagram.com/maksepro/" target="_blank" rel="noreferrer" style={{color:'rgba(255,255,255,0.4)',transition:'color .2s',display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.875rem',textDecoration:'none'}}
                 onMouseEnter={e=>(e.currentTarget.style.color='var(--gold)')}
                 onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.4)')}>
                @maksepro
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
              <li>
                <a href="#privacidade" onClick={(e) => handleLinkClick('privacidade', e)} style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.55)',textDecoration:'none',transition:'color .2s'}}>
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#termos" onClick={(e) => handleLinkClick('termos', e)} style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.55)',textDecoration:'none',transition:'color .2s'}}>
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#trocas" onClick={(e) => handleLinkClick('trocas', e)} style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.55)',textDecoration:'none',transition:'color .2s'}}>
                  Trocas e Devoluções
                </a>
              </li>
              <li>
                <Link href="/contato" style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.55)',textDecoration:'none',transition:'color .2s'}}>
                  Fale Conosco
                </Link>
              </li>
              <li>
                <Link href="/conta" style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.55)',textDecoration:'none',transition:'color .2s'}}>
                  Minha Conta
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 style={{fontSize:'0.65rem',letterSpacing:'0.28em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'1.25rem',fontWeight:500}}>Contato</h4>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'0.75rem',fontSize:'0.82rem',color:'rgba(255,255,255,0.55)'}}>
              <li style={{ lineHeight: 1.6, maxWidth: '250px' }}>São Gonçalo e São Pedro da Aldeia-RJ</li>
              <li><a href="https://wa.me/5522988726778" style={{color:'rgba(255,255,255,0.55)',textDecoration:'none'}}>+55 22 98872-6778 (WhatsApp)</a></li>
              <li style={{ wordBreak: 'break-word' }}><a href="mailto:contato@makseprofissional.com.br" style={{color:'rgba(255,255,255,0.55)',textDecoration:'none'}}>contato@makseprofissional.com.br</a></li>
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

      {/* Premium Glassmorphic Modal Dialog */}
      <dialog
        ref={dialogRef}
        onClick={handleDialogClick}
        onClose={() => setActivePopup(null)}
        className="policy-dialog"
      >
        <div className="policy-dialog-header">
          <h2 className="policy-dialog-title">
            {activePopup === 'privacidade' && 'Política de Privacidade'}
            {activePopup === 'termos' && 'Termos de Uso'}
            {activePopup === 'trocas' && 'Trocas e Devoluções'}
          </h2>
          <button className="policy-dialog-close" onClick={() => setActivePopup(null)} aria-label="Fechar modal">
            <X size={15} />
          </button>
        </div>

        <div className="policy-dialog-content">
          {activePopup === 'privacidade' && (
            <>
              <p>A <strong>Makse Profissional</strong> (SS Cosméticos Profissionais LTDA, sob o CNPJ 47.946.965/0001-35) tem o compromisso inabalável com a privacidade e proteção dos dados pessoais de seus clientes e parceiros técnicos.</p>
              
              <h3>1. Em conformidade com a LGPD</h3>
              <p>Tratamos todas as informações de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Coletamos apenas os dados essenciais para faturamento fiscal (emissão de NFe integrada com o Bling ERP), processamento logístico e entrega segura de seus cosméticos.</p>

              <h3>2. Quais dados coletamos?</h3>
              <ul>
                <li><strong>Dados de Cadastro:</strong> Nome completo, e-mail, telefone e documento oficial (CPF/CNPJ).</li>
                <li><strong>Dados de Profissional:</strong> Registro profissional ou comprovantes de atuação na beleza para fins de preços diferenciados.</li>
                <li><strong>Endereços:</strong> Local de entrega e endereço de cobrança.</li>
              </ul>

              <h3>3. Segurança nos Pagamentos</h3>
              <p>Todo o fluxo de pagamentos é efetuado sob ambiente criptografado SSL de ponta a ponta. Os dados de seu cartão de crédito são processados de forma transparente diretamente pelos gateways autorizados sem transitar ou permanecer armazenados em nossos servidores locais.</p>

              <h3>4. Seus Direitos</h3>
              <p>Qualquer titular pode solicitar a qualquer momento a visualização, alteração, portabilidade ou eliminação de seus dados pessoais. Para exercer seus direitos, basta enviar uma requisição pelo e-mail <strong>contato@makseprofissional.com.br</strong>.</p>
            </>
          )}

          {activePopup === 'termos' && (
            <>
              <p>Estes Termos de Uso regulam o acesso e utilização da plataforma digital da <strong>Makse Profissional</strong>. Ao navegar ou registrar compras, você aceita de forma integral as condições estipuladas.</p>

              <h3>1. Acesso ao Portal e Categorias</h3>
              <p>Nossa plataforma divide-se em duas modalidades distintas de acesso:</p>
              <ul>
                <li><strong>Consumidor Final:</strong> Acesso geral e compra a preços de varejo padrão estabelecidos.</li>
                <li><strong>Profissional Credenciado:</strong> Acesso condicionado à aprovação cadastral e documental. O profissional obtém descontos técnicos especiais em produtos de uso profissional exclusivos. A revenda destes lotes técnicos a leigos sem permissão formal da marca é proibida.</li>
              </ul>

              <h3>2. Faturamento e Processamento ERP</h3>
              <p>Todos os pedidos efetuados em nosso portal são espelhados em tempo real em nosso sistema Bling ERP. A Makse compromete-se com a acurácia das informações de preços, estoque e descrição. Reserva-se o direito de cancelar ordens com erros manifestos de precificação.</p>

              <h3>3. Uso e Responsabilidade Técnica</h3>
              <p>Os cosméticos de alto impacto capilar da Makse Profissional possuem finalidades e diretrizes de aplicação explícitas nos rótulos de cada lote. A Makse Profissional não se responsabiliza por danos decorrentes de aplicação por pessoas sem a devida capacitação profissional ou inobservância técnica.</p>
            </>
          )}

          {activePopup === 'trocas' && (
            <>
              <p>Nosso maior objetivo é sua completa satisfação. Desenvolvemos uma política de trocas e devoluções em estrita conformidade com o <strong>Código de Defesa do Consumidor (CDC)</strong> e diretrizes da ANVISA.</p>

              <h3>1. Direito de Arrependimento</h3>
              <p>Conforme o <strong>Artigo 49 do CDC</strong>, para qualquer compra online, você possui até <strong>7 (sete) dias corridos</strong> após o recebimento físico para solicitar a devolução por arrependimento.</p>

              <h3>2. Condições Essenciais dos Cosméticos</h3>
              <p>Tratando-se de cosméticos de uso capilar e higiene pessoal:</p>
              <ul>
                <li>Os produtos devem ser devolvidos inviolados, em suas embalagens originais.</li>
                <li>Os lacres originais não podem apresentar sinais de abertura ou utilização, por razões óbvias de biossegurança sanitária.</li>
                <li>A Nota Fiscal original emitida deve acompanhar o item na logística de retorno.</li>
              </ul>

              <h3>3. Procedimento de Devolução</h3>
              <p>Para abrir uma solicitação, entre em contato direto pelo WhatsApp <strong>+55 22 98872-6778</strong> ou e-mail <strong>contato@makseprofissional.com.br</strong>. A nossa equipe emitirá o código de logística reversa dos Correios de forma inteiramente gratuita para a primeira troca.</p>
            </>
          )}
        </div>
      </dialog>

      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Responsive Glassmorphic Dialog Styles */
        .policy-dialog {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          background: rgba(13, 27, 42, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: #fff;
          max-width: 600px;
          width: calc(100% - 2rem);
          padding: 2rem;
          box-shadow: 0 24px 80px rgba(0,0,0,0.4);
          outline: none;
          font-family: var(--font-dm-sans), sans-serif;
          overflow: hidden;
          display: none;
          flex-direction: column;
          max-height: 80vh;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          margin: 0;
          box-sizing: border-box;
        }
        .policy-dialog[open] {
          display: flex;
        }
        .policy-dialog::backdrop {
          background: rgba(10, 20, 30, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .policy-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }
        .policy-dialog-title {
          font-family: var(--font-cormorant), Cormorant Garamond, serif;
          font-size: 1.8rem;
          color: var(--gold);
          font-weight: 300;
          margin: 0;
        }
        .policy-dialog-close {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .policy-dialog-close:hover {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--navy);
          transform: rotate(90deg);
        }
        .policy-dialog-content {
          overflow-y: auto;
          padding-right: 0.5rem;
          font-size: 0.875rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.8);
          text-align: left;
        }
        .policy-dialog-content::-webkit-scrollbar {
          width: 5px;
        }
        .policy-dialog-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .policy-dialog-content::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 99px;
        }
        .policy-dialog-content h3 {
          font-family: var(--font-cormorant), Cormorant Garamond, serif;
          font-size: 1.25rem;
          color: var(--gold);
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          font-weight: 400;
        }
        .policy-dialog-content p {
          margin-bottom: 1rem;
        }
        .policy-dialog-content ul {
          padding-left: 1.25rem;
          margin-bottom: 1rem;
        }
        .policy-dialog-content li {
          margin-bottom: 0.35rem;
        }
      `}</style>
    </footer>
  )
}