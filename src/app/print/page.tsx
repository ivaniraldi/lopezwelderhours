import dynamic from 'next/dynamic'

const PrintClient = dynamic(
  () => import('@/components/print-client'),
  { 
    ssr: false,
    loading: () => <div className="p-8">Generando reporte...</div>
  }
)

export default function PrintPage() {
  return <PrintClient />
}
