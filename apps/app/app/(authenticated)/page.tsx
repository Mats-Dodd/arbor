import type { Metadata } from 'next';
import Link from 'next/link';
import { database } from '@repo/database';
import { FolderOpen, FileText } from 'lucide-react';

const title = 'Acme Inc';
const description = 'My application.';

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  // Fetch collections
  const collections = await database.collection.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { nodes: true }
      }
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-12 py-8 sm:px-16 sm:py-12 md:px-20 md:py-16">
        <h1 className="text-3xl font-semibold mb-8">Your Documents</h1>
        
        {/* Collections Section */}
        {collections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Collections
            </h2>
            <div className="space-y-3">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collection/${collection.id}`}
                  className="block p-4 rounded-lg border border-border hover:border-muted-foreground/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{collection.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {collection._count.nodes} items • Created {new Date(collection.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Individual Documents Section */}
        <div>
          <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Individual Documents
          </h2>
          <div className="space-y-3">
            <Link 
              href="/node/doc-node-1" 
              className="block p-4 rounded-lg border border-border hover:border-muted-foreground/50 transition-colors"
            >
              <h3 className="text-lg font-medium">Test Document</h3>
              <p className="text-sm text-muted-foreground mt-1">Click to open and edit</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
