/**
 * Redimensiona e comprime uma imagem no navegador do usuário utilizando HTMLCanvasElement.
 * Retorna uma promessa com o Blob da imagem comprimida (JPEG, 82% qualidade, max 1000px).
 */
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
      return resolve(file) // Retorna o arquivo original se não estiver no navegador ou não for imagem
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = document.createElement('img')
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1000
        const MAX_HEIGHT = 1000
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              resolve(file) // Fallback para o original em caso de falha
            }
          },
          'image/jpeg',
          0.82 // Qualidade da compressão (82%)
        )
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}
