import type { Metadata } from 'next';
import Editor from './components/editor/editor';

const title = 'Acme Inc';
const description = 'My application.';

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  return <Editor />;
};

export default App;
