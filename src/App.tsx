import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopPage from './pages/TopPage';
import FormPage from './pages/FormPage';
import SamplePage from './pages/SamplePage';
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/sample" element={<SamplePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
