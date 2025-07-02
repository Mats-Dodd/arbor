import { database } from '@repo/database'
import { notFound } from 'next/navigation'
import CollectionViewer from '../../components/collection-viewer'

interface PageProps {
  params: Promise<{
    collectionId: string
  }>
}

export default async function CollectionPage({ params }: PageProps) {
  const { collectionId } = await params
  
  // Fetch collection with nodes
  const collection = await database.collection.findUnique({
    where: { id: collectionId },
    include: {
      nodes: {
        orderBy: [
          { kind: 'asc' }, // Folders first
          { name: 'asc' }
        ]
      }
    }
  })
  
  if (!collection) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{collection.name}</h1>
        <CollectionViewer collection={collection} />
      </div>
    </div>
  )
} 