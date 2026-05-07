'use client'
import KitForm from '../../KitForm'

type Props = {
  kitId: string
  defaultValues: any
}

export default function KitFormEdit({ kitId, defaultValues }: Props) {
  return <KitForm kitId={kitId} defaultValues={defaultValues} />
}
