import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

/**
 * Salva um arquivo enviado tanto no diretório public ativo do Next.js
 * quanto no diretório do workspace de persistência em modo standalone,
 * evitando que as imagens sejam apagadas a cada novo build/deploy.
 */
export async function saveUploadedFile(file: File, subFolder: string, filename: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  
  // Diretório relativo base de upload (ex: 'public/uploads/products/123')
  const relativeDir = path.join('public', 'uploads', subFolder)

  // 1. Salva no diretório de execução atual (process.cwd())
  const cwdDir = path.join(process.cwd(), relativeDir)
  await mkdir(cwdDir, { recursive: true })
  await writeFile(path.join(cwdDir, filename), buffer)

  // 2. Salva no diretório raiz do workspace se estiver rodando em modo standalone (.next/standalone)
  const normalizedCwd = process.cwd().replace(/\\/g, '/')
  const isStandalone = normalizedCwd.endsWith('.next/standalone') || normalizedCwd.includes('.next/standalone')
  
  if (isStandalone) {
    const workspaceDir = path.join(process.cwd(), '..', '..', relativeDir)
    try {
      await mkdir(workspaceDir, { recursive: true })
      await writeFile(path.join(workspaceDir, filename), buffer)
      console.log(`[saveUploadedFile] Cópia persistida salva na raiz do workspace: ${path.join(workspaceDir, filename)}`)
    } catch (err) {
      console.error(`[saveUploadedFile] Falha ao persistir cópia no workspace:`, err)
    }
  }

  // Retorna a URL pública amigável
  return `/uploads/${subFolder}/${filename}`
}

/**
 * Remove o arquivo de ambos os diretórios (ativo e de persistência no workspace).
 */
export async function deleteUploadedFile(imageUrl: string): Promise<void> {
  // Remove a barra inicial da URL (ex: '/uploads/products/123/img.jpg' -> 'uploads/products/123/img.jpg')
  const relativePath = path.join('public', imageUrl.replace(/^\//, ''))

  // 1. Remove do diretório de execução atual
  try {
    const cwdFile = path.join(process.cwd(), relativePath)
    await unlink(cwdFile)
  } catch (err) {
    // Arquivo pode não existir no disco ativo, ignorar
  }

  // 2. Remove do diretório raiz do workspace se estiver rodando em modo standalone
  const normalizedCwd = process.cwd().replace(/\\/g, '/')
  const isStandalone = normalizedCwd.endsWith('.next/standalone') || normalizedCwd.includes('.next/standalone')
  
  if (isStandalone) {
    try {
      const workspaceFile = path.join(process.cwd(), '..', '..', relativePath)
      await unlink(workspaceFile)
    } catch (err) {
      // Arquivo pode não existir no workspace, ignorar
    }
  }
}
