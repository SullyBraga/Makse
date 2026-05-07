'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Download, FileSpreadsheet, Check, X, AlertTriangle, RefreshCw, ArrowLeft, Layers, Package, Plus } from 'lucide-react'
import Link from 'next/link'

type PreviewRow = {
  row: number; name: string; sku: string | null; price: number | null
  pricePro: number | null; priceVendedor: number | null
  skuComponents: string[]; quantities: number[]
  showInCatalog: boolean; showAsSuggestion: boolean
  isDuplicate: boolean; missingSkus: string[]; error: string | null
}

export default function ImportarKitsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [missingSKUs, setMissingSKUs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; errors: number } | null>(null)
  const [error, setError] = useState('')
  const [duplicateAction, setDuplicateAction] = useState<'update' | 'skip' | null>(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)

  const hasDuplicates = preview?.some(r => r.isDuplicate) ?? false
  const duplicateCount = preview?.filter(r => r.isDuplicate).length ?? 0

  const handleFile = async (f: File) => {
    setFile(f); setPreview(null); setError(''); setResult(null); setDuplicateAction(null); setMissingSKUs([])
    if (!f) return
    setLoading(true)
    const fd = new FormData(); fd.append('file', f); fd.append('preview', 'true')
    const res = await fetch('/api/admin/kits/import', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao ler arquivo'); setLoading(false); return }
    setPreview(data.rows)
    setMissingSKUs(data.missingSKUs || [])
    setLoading(false)
  }

  const handleImport = async (overwrite: boolean) => {
    if (!file) return
    setImporting(true); setError('')
    const fd = new FormData()
    fd.append('file', file)
    if (overwrite) fd.append('overwrite', 'true')
    const res = await fetch('/api/admin/kits/import', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao importar'); setImporting(false); return }
    setResult(data)
    setImporting(false)
  }

  const onClickImport = () => {
    if (hasDuplicates && duplicateAction === null) {
      setShowDuplicateModal(true)
      return
    }
    handleImport(duplicateAction === 'update')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/admin/kits')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1px solid var(--border)', borderRadius: '99px', padding: '0.4rem 0.875rem', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <ArrowLeft size={12} /> Voltar
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)' }}>Importar Kits</h1>
          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>Adicione kits em massa via planilha .xlsx ou .csv</p>
        </div>
      </div>

      {/* Duplicate modal */}
      {showDuplicateModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, backdropFilter: 'blur(3px)' }} onClick={() => setShowDuplicateModal(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: '20px', padding: '2rem', zIndex: 51, width: '100%', maxWidth: '460px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <AlertTriangle size={22} style={{ color: '#d97706' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', fontWeight: 400, color: 'var(--navy)', textAlign: 'center', marginBottom: '0.5rem' }}>
              {duplicateCount} kit(s) já existe(m)
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              A planilha contém kits cujos nomes ou SKUs já estão cadastrados. O que deseja fazer com eles?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <button
                onClick={() => { setDuplicateAction('update'); setShowDuplicateModal(false); handleImport(true) }}
                style={{ padding: '0.75rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                Atualizar os existentes
              </button>
              <button
                onClick={() => { setDuplicateAction('skip'); setShowDuplicateModal(false); handleImport(false) }}
                style={{ padding: '0.75rem', background: '#fff', color: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                Pular os duplicados ({duplicateCount})
              </button>
              <button
                onClick={() => setShowDuplicateModal(false)}
                style={{ padding: '0.75rem', background: 'none', color: 'var(--text-muted)', border: 'none', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}

      {result ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '3rem', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Check size={28} style={{ color: '#16a34a' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.5rem' }}>Importação concluída!</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
            <strong style={{ color: '#16a34a' }}>{result.created} criado(s)</strong>
            {result.updated > 0 && <> · <strong style={{ color: 'var(--navy)' }}>{result.updated} atualizado(s)</strong></>}
            {result.skipped > 0 && <> · {result.skipped} ignorado(s)</>}
            {result.errors > 0 && <> · <span style={{ color: '#dc2626' }}>{result.errors} com erro</span></>}
          </p>
          <button onClick={() => router.push('/admin/kits')} style={{ padding: '0.7rem 2rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '99px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            Ver Kits
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#dc2626' }}>{error}</div>}

            {/* Upload zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{ background: file ? 'var(--cream)' : '#fff', border: `2px dashed ${file ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <FileSpreadsheet size={36} style={{ color: file ? 'var(--gold)' : 'var(--border)', margin: '0 auto 1rem', display: 'block' }} />
              {file ? (
                <><p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '0.25rem' }}>{file.name}</p><p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Clique para trocar o arquivo</p></>
              ) : (
                <><p style={{ fontWeight: 500, color: 'var(--navy)', marginBottom: '0.25rem' }}>Arraste ou clique para enviar</p><p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Suporta .xlsx, .xls e .csv</p></>
              )}
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <RefreshCw size={22} style={{ color: 'var(--gold)', margin: '0 auto', display: 'block', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Analisando arquivo...</p>
              </div>
            )}

            {/* Missing SKUs alert */}
            {!loading && missingSKUs.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <AlertTriangle size={15} style={{ color: '#d97706', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.84rem', color: '#92400e', fontWeight: 600 }}>
                    {missingSKUs.length} SKU(s) de produto não encontrado(s) no catálogo
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.875rem' }}>
                  {missingSKUs.map(sku => (
                    <div key={sku} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #fde68a' }}>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#92400e' }}>{sku}</span>
                      <Link href="/admin/produtos/novo" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
                        <Plus size={10} /> Adicionar produto
                      </Link>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#92400e' }}>
                  Kits com SKUs ausentes serão importados sem esses componentes. Cadastre os produtos e reimporte para associar.
                </p>
              </div>
            )}

            {/* Preview table */}
            {preview && !loading && (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)' }}>
                    Prévia — {preview.length} kit(s) · {preview.filter(r => r.error).length} erro(s) · {duplicateCount} duplicado(s)
                  </h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                        {['#', 'Nome', 'SKU', 'Preço', 'Componentes', 'Catálogo', 'Sugestão', 'Status'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 50).map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--cream)', background: row.error ? '#fef2f2' : row.isDuplicate ? '#fffbeb' : 'transparent' }}>
                          <td style={{ padding: '0.6rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{row.row}</td>
                          <td style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--navy)' }}>{row.name || '—'}</td>
                          <td style={{ padding: '0.6rem 1rem', fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{row.sku || '—'}</td>
                          <td style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                            {row.price != null ? `R$ ${row.price.toFixed(2).replace('.', ',')}` : '—'}
                          </td>
                          <td style={{ padding: '0.6rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {row.skuComponents.length} produto(s)
                            {row.missingSkus.length > 0 && <span style={{ color: '#d97706', fontWeight: 600 }}> · {row.missingSkus.length} ausente(s)</span>}
                          </td>
                          <td style={{ padding: '0.6rem 1rem', fontSize: '0.72rem' }}>{row.showInCatalog ? '✓' : '—'}</td>
                          <td style={{ padding: '0.6rem 1rem', fontSize: '0.72rem' }}>{row.showAsSuggestion ? '✓' : '—'}</td>
                          <td style={{ padding: '0.6rem 1rem' }}>
                            {row.error ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', color: '#dc2626', fontWeight: 500 }}>
                                <X size={11} /> {row.error}
                              </span>
                            ) : row.isDuplicate ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', color: '#d97706', fontWeight: 500 }}>
                                <AlertTriangle size={11} /> Duplicado
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', color: '#16a34a', fontWeight: 500 }}>
                                <Check size={11} /> OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1.5rem' }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.875rem' }}>Modelo de Planilha</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
                Baixe o modelo e preencha os kits. A coluna <code style={{ fontFamily: 'monospace', background: 'var(--cream)', padding: '1px 4px', borderRadius: '4px' }}>skus_componentes</code> deve conter os SKUs separados por ponto e vírgula.
              </p>
              <a href="/api/admin/kits/import" download="makse_template_kits.xlsx"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.7rem', background: 'var(--cream)', color: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 500, textDecoration: 'none' }}>
                <Download size={14} /> Baixar Modelo .xlsx
              </a>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1rem' }}>Colunas da Planilha</h2>
              {[
                { col: 'nome', req: true, desc: 'Nome do kit' },
                { col: 'sku', req: false, desc: 'Código único (ex: KIT-001)' },
                { col: 'descricao', req: false, desc: 'Descrição do kit' },
                { col: 'preco', req: true, desc: 'Preço cliente final' },
                { col: 'preco_pro', req: false, desc: 'Preço profissional' },
                { col: 'preco_vendedor', req: false, desc: 'Preço para vendedores' },
                { col: 'skus_componentes', req: false, desc: 'SKUs separados por ; (ex: SKU1;SKU2)' },
                { col: 'quantidades', req: false, desc: 'Qtds por componente (ex: 1;2)' },
                { col: 'exibir_catalogo', req: false, desc: 'Sim ou Não' },
                { col: 'exibir_sugestoes', req: false, desc: 'Sim ou Não' },
              ].map(c => (
                <div key={c.col} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.5rem 0', borderBottom: '1px solid var(--cream)' }}>
                  <code style={{ fontSize: '0.65rem', background: 'var(--cream)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--navy)', flexShrink: 0, marginTop: '1px' }}>{c.col}</code>
                  <div>
                    <span style={{ fontSize: '0.62rem', color: c.req ? '#dc2626' : 'var(--text-muted)', fontWeight: c.req ? 700 : 400, letterSpacing: '0.05em', display: 'block', marginBottom: '1px' }}>
                      {c.req ? '* Obrigatório' : 'Opcional'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {preview && !loading && (
              <button onClick={onClickImport} disabled={importing || preview.every(r => !!r.error)}
                style={{ width: '100%', padding: '0.875rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: importing ? 0.7 : 1, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {importing ? <><RefreshCw size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Importando...</> : <><Upload size={15} /> Importar ({preview.filter(r => !r.error).length} kits)</>}
              </button>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
