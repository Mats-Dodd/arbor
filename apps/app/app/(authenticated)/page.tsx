import type { Metadata } from 'next';
import Link from 'next/link';

const title = 'Acme Inc';
const description = 'My application.';

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-12 py-8 sm:px-16 sm:py-12 md:px-20 md:py-16">
        <h1 className="text-3xl font-semibold mb-8">Your Documents</h1>
        
        <div className="space-y-4">
          <Link 
            href="/node/doc-node-1" 
            className="block p-4 rounded-lg border border-border hover:border-muted-foreground/50 transition-colors"
          >
            <h2 className="text-lg font-medium">Test Document</h2>
            <p className="text-sm text-muted-foreground mt-1">Click to open and edit</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default App;
