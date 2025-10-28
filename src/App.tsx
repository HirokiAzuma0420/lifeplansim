import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopPage from './pages/TopPage';
import FormPage from './pages/FormPage';
import SamplePage from './pages/SamplePage';
import ResultPage from './pages/ResultPage';
import SimulationSpecPage from './pages/SimulationSpecPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/sample" element={<SamplePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/introduce" element={<SimulationSpecPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

