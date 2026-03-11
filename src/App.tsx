import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ScoreTableScreen } from './screens/ScoreTableScreen';
import { InstallPrompt } from './components/InstallPrompt';

const App: React.FC = () => (
  <BrowserRouter basename="/jancal">
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/quiz" element={<QuizScreen />} />
      <Route path="/score-table" element={<ScoreTableScreen />} />
    </Routes>
    <InstallPrompt />
  </BrowserRouter>
);

export default App;
