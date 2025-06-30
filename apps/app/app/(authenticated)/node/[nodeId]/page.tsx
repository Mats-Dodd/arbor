import type { Metadata } from 'next';
import Editor from '../../components/editor/editor';

export const metadata: Metadata = {
  title: 'Document Editor',
  description: 'Edit your document',
};

interface PageProps {
  params: Promise<{ nodeId: string }>;
}

const NodePage = async ({ params }: PageProps) => {
  const { nodeId } = await params;
  
  return <Editor nodeId={nodeId} />;
};

export default NodePage; 