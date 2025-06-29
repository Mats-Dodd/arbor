import type { Metadata } from 'next';
import { Chatbot } from './components/chatbot';
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
      <Header pages={['Building Your Application']} page="AI Chatbot" />
      <Chatbot />
    </>
  );
};

export default App;
