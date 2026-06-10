/**
 * Converte o arquivo de imagem enviado em uma string Base64 Data URL,
 * armazenando as imagens diretamente no banco de dados. Isso garante que as imagens
 * persistam permanentemente e nunca desapareçam durante novos deploys/builds do servidor.
 */
export async function saveUploadedFile(file: File, subFolder: string, filename: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')
  const mimeType = file.type || 'image/jpeg'
  return `data:${mimeType};base64,${base64}`
}

/**
 * Como as imagens são salvas diretamente no banco de dados como Base64,
 * não há necessidade de excluir arquivos do disco.
 */
export async function deleteUploadedFile(imageUrl: string): Promise<void> {
  // Sem operação física no disco necessária
}
