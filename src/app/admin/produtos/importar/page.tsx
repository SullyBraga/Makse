'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Download, FileSpreadsheet, Check, X, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

const COLUMNS = [
  { col: 'Linha',                                           req: false, desc: 'Nome da linha (ex: Linha Crystal)' },
  { col: 'Nome do Produto',                                 req: true,  desc: 'Nome completo do produto' },
  { col: 'SKU',                                             req: false, desc: 'Código único do produto' },
  { col: 'Quantidade',                                      req: false, desc: 'Volume/peso (ex: 1L, 500g, 1Kg)' },
  { col: 'Ativos',                                          req: false, desc: 'Lista de ativos e ingredientes' },
  { col: 'Tipo de Produto',                                 req: false, desc: 'Shampoo, Máscara, Pó Descolorante...' },
  { col: 'Indicação de uso',                                req: false, desc: 'Para que tipo de cabelo/situação' },
  { col: 'Descrição',                                       req: false, desc: 'Descrição completa do produto' },
  { col: 'Produtos Relacionados',                           req: false, desc: 'Nomes separados por vírgula ou ponto-e-vírgula' },
  { col: 'Quantidade em Estoque',                           req: false, desc: 'Quantidade disponível (padrão: 0)' },
  { col: 'Preço Para Cliente Final',                        req: true,  desc: 'Preço público (ex: 79,90)' },
  { col: 'Preço Para Profissional',                         req: false, desc: 'Preço padrão para cabeleireiros' },
  { col: 'Preço de Desconto para Profissional',             req: false, desc: 'Preço promocional para profissionais' },
  { col: 'Preço para Vendedor/Representante/Distribuidor',  req: false, desc: 'Preço de atacado' },
]


type PreviewRow = {
  row: number; name: string; sku: string | null; productType: string | null;
  weight: string | null; lineName: string | null; price: number; stock: number;
  pricePro?: number | null; priceProDesc?: number | null;
  proOnly: boolean; featured: boolean; active: boolean;
  isDuplicate: boolean; error: string | null; description?: string
}

export default function ImportarProdutosPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; errors: number } | null>(null)
  const [error, setError] = useState('')
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [zeroMissingPrices, setZeroMissingPrices] = useState(false)
  const [rowImages, setRowImages] = useState<Record<number, File[]>>({})
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)

  const handleAddRowImages = (index: number, files: FileList | null) => {
    if (!files) return
    const fileArr = Array.from(files)
    setRowImages(prev => ({
      ...prev,
      [index]: [...(prev[index] || []), ...fileArr]
    }))
  }

  const removeRowImage = (index: number, imgIndex: number) => {
    setRowImages(prev => {
      const current = prev[index] || []
      const updated = current.filter((_, idx) => idx !== imgIndex)
      return { ...prev, [index]: updated }
    })
  }

  const handleEditCell = (index: number, field: string, value: any) => {
    setPreview(prev => {
      if (!prev) return null
      const updated = [...prev]
      const row = { ...updated[index] }

      if (field === 'price') {
        row.price = parseFloat(value)
        row.error = isNaN(row.price) ? 'Preço (Cliente Final) inválido' : !String(value).trim() ? 'Preço obrigatório' : null
      } else if (field === 'pricePro') {
        row.pricePro = value === '' ? null : parseFloat(value)
      } else if (field === 'priceProDesc') {
        row.priceProDesc = value === '' ? null : parseFloat(value)
      } else if (field === 'stock') {
        row.stock = parseInt(value) || 0
      } else {
        (row as any)[field] = value
      }

      if (field === 'name') {
        row.error = !String(value).trim() ? 'Nome obrigatório' : null
      }

      updated[index] = row
      return updated
    })
  }

  const duplicateCount = preview?.filter(r => r.isDuplicate).length ?? 0
  const hasDuplicates = duplicateCount > 0

  const processFile = async (f: File, zeroPrices: boolean) => {
    setPreview(null); setError(''); setResult(null); setRowImages({}); setUploadProgress(null)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      fd.append('preview', 'true')
      if (zeroPrices) fd.append('zeroMissingPrices', 'true')
      const res = await fetch('/api/admin/products/import', { method: 'POST', body: fd })
      
      let data
      try {
        data = await res.json()
      } catch {
        throw new Error('O servidor retornou uma resposta inválida. Verifique se o arquivo está no formato correto.')
      }

      if (!res.ok) {
        setError(data.error || 'Erro ao ler arquivo')
        setLoading(false)
        return
      }
      setPreview(data.rows)
    } catch (err: any) {
      setError(err.message || 'Erro de conexão ou formato de arquivo inválido.')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (f: File) => {
    setFile(f)
    if (f) processFile(f, zeroMissingPrices)
  }

  const handleImport = async (overwrite = false) => {
    if (!preview) return
    setImporting(true); setError(''); setUploadProgress(null)
    try {
      const payload = {
        products: preview.filter(r => !r.error),
        overwrite,
      }

      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      let data
      try {
        data = await res.json()
      } catch {
        throw new Error('Falha catastrófica ao importar. O servidor não respondeu com dados válidos.')
      }

      if (!res.ok) {
        setError(data.error || 'Erro ao importar')
        setImporting(false)
        return
      }

      // Envia as fotos vinculadas
      const rowsToUpload = Object.entries(rowImages).filter(([, files]) => files && files.length > 0)
      if (rowsToUpload.length > 0 && data.products && Array.isArray(data.products)) {
        let totalImages = 0
        for (const [, files] of rowsToUpload) {
          totalImages += files.length
        }

        setUploadProgress({ current: 0, total: totalImages })

        for (const [idxStr, files] of rowsToUpload) {
          const idx = parseInt(idxStr)
          const rowData = preview?.[idx]
          if (!rowData) continue

          const matchedProduct = data.products.find((p: { id: string; name: string; slug: string; sku: string | null }) => {
            if (rowData.sku && p.sku) {
              return p.sku.toLowerCase() === rowData.sku.toLowerCase()
            }
            return p.name.toLowerCase().trim() === rowData.name.toLowerCase().trim()
          })

          if (matchedProduct) {
            for (const imgFile of files) {
              try {
                const imgFd = new FormData()
                imgFd.append('file', imgFile)
                imgFd.append('productId', matchedProduct.id)
                await fetch('/api/admin/products/images', { method: 'POST', body: imgFd })
              } catch (imgErr) {
                console.error(`Erro no upload da imagem para o produto ${matchedProduct.name}:`, imgErr)
              } finally {
                setUploadProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null)
              }
            }
          } else {
            setUploadProgress(prev => prev ? { ...prev, current: prev.current + files.length } : null)
          }
        }
      }

      setRowImages({})
      setUploadProgress(null)
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Erro de rede ao processar importação.')
      setUploadProgress(null)
    } finally {
      setImporting(false)
    }
  }

  const onClickImport = () => {
    if (hasDuplicates) { setShowDuplicateModal(true); return }
    handleImport(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/admin/produtos')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1px solid var(--border)', borderRadius: '99px', padding: '0.4rem 0.875rem', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <ArrowLeft size={12} /> Voltar
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)' }}>Importar Planilha</h1>
          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>Adicione produtos em massa via arquivo .xlsx ou .csv</p>
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
              {duplicateCount} produto(s) já existe(m)
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              A planilha contém produtos cujos nomes ou SKUs já estão cadastrados. O que deseja fazer?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <button
                onClick={() => { setShowDuplicateModal(false); handleImport(true) }}
                style={{ padding: '0.75rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                Atualizar os existentes
              </button>
              <button
                onClick={() => { setShowDuplicateModal(false); handleImport(false) }}
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

      {uploadProgress ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '3rem', textAlign: 'center', maxWidth: '480px', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid #fde68a' }}>
            <Upload size={28} style={{ color: 'var(--gold)', animation: 'bounce 1s infinite alternate' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.5rem' }}>Vinculando Fotos</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>
            Aguarde enquanto as imagens são vinculadas aos novos produtos criados.
          </p>
          <div style={{ width: '100%', height: '8px', background: 'var(--cream)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.75rem' }}>
            <div style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 500 }}>
            Enviando {uploadProgress.current} de {uploadProgress.total} imagens ({(Math.round((uploadProgress.current / uploadProgress.total) * 100)) || 0}%)
          </p>
        </div>
      ) : result ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '3rem', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Check size={28} style={{ color: '#16a34a' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.5rem' }}>Importação concluída!</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
            <strong style={{ color: '#16a34a' }}>{result.created} produto(s) criado(s)</strong>{' · '}
            {(result as any).updated > 0 && <span>{(result as any).updated} atualizado(s){' · '}</span>}
            {result.skipped > 0 && <span>{result.skipped} já existiam{' · '}</span>}
            {result.errors > 0 && <span style={{ color: '#dc2626' }}>{result.errors} com erro</span>}
          </p>
          <button onClick={() => router.push('/admin/produtos')} style={{ padding: '0.7rem 2rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '99px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            Ver Catálogo
          </button>
        </div>
      ) : (
        <div className="importar-layout-grid">

          {/* Painel principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#dc2626' }}>{error}</div>}

            {/* Checkbox de Importação Zerada */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <input
                type="checkbox"
                id="zeroMissingPrices"
                checked={zeroMissingPrices}
                onChange={e => {
                  setZeroMissingPrices(e.target.checked)
                  if (file) {
                    processFile(file, e.target.checked)
                  }
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--navy)' }}
              />
              <label htmlFor="zeroMissingPrices" style={{ fontSize: '0.8rem', color: 'var(--navy)', cursor: 'pointer', fontWeight: 500, userSelect: 'none' }}>
                Importar produtos sem preço com valor zerado (R$ 0,00) em vez de ignorar
              </label>
            </div>

            {/* Upload zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{ background: file ? 'var(--cream)' : '#fff', border: `2px dashed ${file ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <FileSpreadsheet size={36} style={{ color: file ? 'var(--gold)' : 'var(--border)', margin: '0 auto 1rem', display: 'block' }} />
              {file ? (
                <>
                  <p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '0.25rem' }}>{file.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Clique para trocar o arquivo</p>
                </>
              ) : (
                <>
                  <p style={{ fontWeight: 500, color: 'var(--navy)', marginBottom: '0.25rem' }}>Arraste ou clique para enviar</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Suporta .xlsx, .xls e .csv</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <RefreshCw size={22} style={{ color: 'var(--gold)', margin: '0 auto', display: 'block', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Analisando arquivo...</p>
              </div>
            )}

            {/* Preview table */}
            {preview && !loading && (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)' }}>
                    Prévia — {preview.length} linha(s) · {preview.filter(r => r.error).length} erro(s){duplicateCount > 0 && ` · ${duplicateCount} duplicado(s)`}
                  </h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                        {['Linha', 'Imagens', 'Nome', 'Descrição', 'SKU', 'Tipo', 'Preço', 'Preço Pro', 'Desc. Pro', 'Estoque', 'Linha Produto', 'Status'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 50).map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--cream)', background: row.error ? '#fef2f2' : 'transparent' }}>
                          <td style={{ padding: '0.6rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{row.row}</td>
                          <td style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', border: '1px dashed var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }} title="Adicionar fotos">
                                <span style={{ fontSize: '1.1rem', marginTop: '-2px', fontWeight: 300 }}>+</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={e => handleAddRowImages(i, e.target.files)}
                                />
                              </label>
                              <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', maxWidth: '120px' }}>
                                {(rowImages[i] || []).map((img, imgIdx) => {
                                  const url = URL.createObjectURL(img)
                                  return (
                                    <div key={imgIdx} style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                                      <button
                                        type="button"
                                        onClick={() => removeRowImage(i, imgIdx)}
                                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                                        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = '0' }}
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', minWidth: '180px' }}>
                            <input
                              type="text"
                              value={row.name}
                              onChange={e => handleEditCell(i, 'name', e.target.value)}
                              className="editable-input"
                              style={{ fontWeight: 500, color: 'var(--navy)' }}
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', minWidth: '200px' }}>
                            <input
                              type="text"
                              value={row.description || ''}
                              onChange={e => handleEditCell(i, 'description', e.target.value)}
                              placeholder="Sem descrição"
                              className="editable-input"
                              style={{ color: 'var(--text-muted)' }}
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', minWidth: '100px' }}>
                            <input
                              type="text"
                              value={row.sku || ''}
                              onChange={e => handleEditCell(i, 'sku', e.target.value)}
                              placeholder="—"
                              className="editable-input"
                              style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', minWidth: '120px' }}>
                            <input
                              type="text"
                              value={row.productType || ''}
                              onChange={e => handleEditCell(i, 'productType', e.target.value)}
                              placeholder="—"
                              className="editable-input"
                              style={{ color: 'var(--text-muted)' }}
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', minWidth: '100px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>R$</span>
                              <input
                                type="text"
                                value={isNaN(row.price) ? '' : row.price}
                                onChange={e => handleEditCell(i, 'price', e.target.value)}
                                className="editable-input"
                                style={{ fontWeight: 500, color: 'var(--navy)' }}
                              />
                            </div>
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', minWidth: '100px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>R$</span>
                              <input
                                type="text"
                                value={row.pricePro == null || isNaN(row.pricePro) ? '' : row.pricePro}
                                onChange={e => handleEditCell(i, 'pricePro', e.target.value)}
                                placeholder="—"
                                className="editable-input"
                                style={{ color: 'var(--text-muted)' }}
                              />
                            </div>
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', minWidth: '100px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>R$</span>
                              <input
                                type="text"
                                value={row.priceProDesc == null || isNaN(row.priceProDesc) ? '' : row.priceProDesc}
                                onChange={e => handleEditCell(i, 'priceProDesc', e.target.value)}
                                placeholder="—"
                                className="editable-input"
                                style={{ color: 'var(--text-muted)' }}
                              />
                            </div>
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', minWidth: '80px' }}>
                            <input
                              type="number"
                              value={row.stock}
                              onChange={e => handleEditCell(i, 'stock', e.target.value)}
                              className="editable-input"
                              style={{ color: 'var(--text-muted)' }}
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', minWidth: '140px' }}>
                            <input
                              type="text"
                              value={row.lineName || ''}
                              onChange={e => handleEditCell(i, 'lineName', e.target.value)}
                              placeholder="—"
                              className="editable-input"
                              style={{ color: 'var(--text-muted)' }}
                            />
                          </td>
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
                {preview.length > 50 && (
                  <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Mostrando 50 de {preview.length} linhas. Todos serão importados.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Painel lateral */}
          <div className="importar-sidebar-container">

            {/* Template download */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.875rem' }}>Modelo de Planilha</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
                Baixe o modelo oficial e preencha os dados dos seus produtos. Colunas marcadas com * são obrigatórias.
              </p>
              <a href="/api/admin/products/import" download="makse_template_produtos.xlsx"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.7rem', background: 'var(--cream)', color: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                <Download size={14} /> Baixar Modelo .xlsx
              </a>
            </div>

            {/* Estrutura das colunas */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.5rem' }}>Estrutura das Colunas</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Role a lista abaixo para conferir o formato esperado de cada coluna da sua planilha:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {COLUMNS.map(c => (
                  <div key={c.col} style={{ padding: '0.625rem 0', borderBottom: '1px solid var(--cream)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <code style={{ fontSize: '0.65rem', background: 'var(--cream)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--navy)', wordBreak: 'break-all' }}>
                        {c.col}
                      </code>
                      <span style={{ fontSize: '0.58rem', color: c.req ? '#dc2626' : 'var(--text-muted)', fontWeight: c.req ? 700 : 400, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {c.req ? 'Obrigatório' : 'Opcional'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão importar */}
            {preview && !loading && (
              <button onClick={onClickImport} disabled={importing || preview.every(r => !!r.error)}
                style={{ width: '100%', padding: '0.875rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: importing ? 0.7 : 1, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {importing ? <><RefreshCw size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Importando...</> : <><Upload size={15} /> Confirmar Importação ({preview.filter(r => !r.error).length} produtos)</>}
              </button>
            )}

            {preview && preview.some(r => r.error) && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', gap: '0.625rem' }}>
                <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '0.78rem', color: '#92400e' }}>
                  Linhas com erro serão ignoradas. Apenas {preview.filter(r => !r.error).length} produto(s) válido(s) serão importados.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        .importar-layout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 1.5rem;
          align-items: start;
        }
        .importar-sidebar-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: sticky;
          top: 1.5rem;
        }
        @media (max-width: 1024px) {
          .importar-layout-grid {
            grid-template-columns: 1fr;
          }
          .importar-sidebar-container {
            position: static !important;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-6px); } }
        .editable-input {
          width: 100%;
          padding: 0.3rem 0.4rem;
          border: 1px solid transparent;
          background: transparent;
          font-family: inherit;
          font-size: 0.8rem;
          color: inherit;
          outline: none;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .editable-input:hover {
          border-color: var(--border);
          background: #fafaf9;
        }
        .editable-input:focus {
          border-color: var(--gold);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
        }
      `}</style>
    </div>
  )
}
