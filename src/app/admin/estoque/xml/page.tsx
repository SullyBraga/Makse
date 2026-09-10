'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Upload, Check, RefreshCw, AlertCircle, PackageCheck, Layers } from 'lucide-react'

type ParsedItem = {
  xmlCode: string
  xmlName: string
  xmlQuantity: number
  xmlPrice: number
  matched: boolean
  productId: string | null
  productName: string | null
  variantId: string | null
  variantLabel: string | null
  currentStock: number
  newStock: number
}

type NfeData = {
  nfNumber: string
  issuer: string
  totalItems: number
  matchedCount: number
  items: ParsedItem[]
}

export default function StockXmlPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [nfeData, setNfeData] = useState<NfeData | null>(null)
  const [fileName, setFileName] = useState('')

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.xml')) {
      setError('Por favor, selecione um arquivo XML (.xml) válido de Nota Fiscal Eletrônica.')
      return
    }
    setError('')
    setSuccess('')
    setLoading(true)
    setFileName(file.name)

    try {
      const xmlContent = await file.text()
      const res = await fetch('/api/admin/stock/import-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlContent }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao processar arquivo XML')
        setNfeData(null)
      } else {
        setNfeData(data)
      }
    } catch {
      setError('Erro de conexão ao ler arquivo XML')
      setNfeData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyStock = async () => {
    if (!nfeData) return
    const matched = nfeData.items.filter(i => i.matched && i.variantId)
    if (matched.length === 0) {
      setError('Nenhum item correspondente encontrado para atualizar o estoque.')
      return
    }

    setApplying(true)
    setError('')
    try {
      const updates = matched.map(i => ({
        variantId: i.variantId,
        addedStock: i.xmlQuantity,
      }))

      const res = await fetch('/api/admin/stock/import-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply: true, updates }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao atualizar estoque')
      } else {
        setSuccess(`Estoque de ${data.updatedCount} produto(s) atualizado com sucesso a partir da NF-e nº ${nfeData.nfNumber}!`)
        setNfeData(null)
      }
    } catch {
      setError('Erro ao aplicar atualização de estoque')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/admin/produtos')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1px solid var(--border)', borderRadius: '99px', padding: '0.4rem 0.875rem', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <ArrowLeft size={12} /> Produtos
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', margin: 0 }}>
            Entrada de Estoque por Nota Fiscal XML
          </h1>
          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)', margin: 0 }}>
            Faça upload do XML da NF-e emitida pelo fornecedor para dar entrada automática no estoque dos produtos
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#dc2626', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {success && (
        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#166534', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={16} /> {success}
        </div>
      )}

      {/* Upload Zone */}
      <div style={{ background: '#fff', border: '2px dashed var(--border)', borderRadius: '20px', padding: '3rem 2rem', textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
        <input
          type="file"
          accept=".xml"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
        />
        <FileText size={40} style={{ color: 'var(--gold)', margin: '0 auto 1rem', display: 'block' }} />
        <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--navy)', margin: '0 0 0.5rem' }}>
          {loading ? 'Lendo e identificando produtos da NF-e...' : 'Selecione ou arraste o arquivo XML da Nota Fiscal'}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          Suporta arquivos .xml padrão NF-e (Nota Fiscal Eletrônica). O sistema compara os códigos/SKUs e atualiza o estoque.
        </p>
        {fileName && (
          <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--cream)', padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.75rem', color: 'var(--navy)', fontWeight: 600 }}>
            <FileText size={12} /> {fileName}
          </div>
        )}
      </div>

      {/* Preview Table */}
      {nfeData && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>
                Nota Fiscal nº {nfeData.nfNumber}
              </span>
              <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.3rem', fontWeight: 400, color: 'var(--navy)', margin: '0.1rem 0 0' }}>
                Emitente: {nfeData.issuer}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                {nfeData.matchedCount} de {nfeData.totalItems} produto(s) correspondentes no seu catálogo.
              </p>
            </div>

            <button
              onClick={handleApplyStock}
              disabled={applying || nfeData.matchedCount === 0}
              style={{
                background: nfeData.matchedCount > 0 ? 'var(--navy)' : '#ccc',
                color: '#fff', border: 'none', borderRadius: '99px',
                padding: '0.75rem 1.5rem', fontSize: '0.8rem', fontWeight: 600,
                cursor: nfeData.matchedCount > 0 ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}
            >
              {applying ? <RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <PackageCheck size={16} />}
              Confirmar Entrada no Estoque
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Cód / SKU NF</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Descrição na Nota</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Produto makse</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Qtd NF</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Estoque Atual</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Novo Estoque</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {nfeData.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--cream)', fontSize: '0.82rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {item.xmlCode || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--navy)', fontWeight: 500 }}>
                      {item.xmlName}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: item.matched ? 'var(--navy)' : 'var(--text-muted)' }}>
                      {item.matched ? (
                        <div>
                          <strong style={{ display: 'block' }}>{item.productName}</strong>
                          {item.variantLabel && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Variação: {item.variantLabel}</span>}
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#999' }}>Não localizado</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--navy)' }}>
                      +{item.xmlQuantity}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {item.matched ? item.currentStock : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700, color: item.matched ? '#16a34a' : 'var(--text-muted)' }}>
                      {item.matched ? item.newStock : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '99px', background: item.matched ? '#dcfce7' : '#fee2e2', color: item.matched ? '#166534' : '#dc2626', fontWeight: 600 }}>
                        {item.matched ? 'Pronto' : 'Não pareado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
