import type { Metadata } from 'next';
import Editor from './components/editor';
import { Header } from './components/header';

const title = 'Acme Inc';
const description = 'My application.';

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  return (
    <>
      {/* <Header pages={['Building Your Application']} page="Editor" /> */}
      <Editor />
    </>
  );
};

export default App;
