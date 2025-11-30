import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CoachList } from './pages/CoachList';
import { CoachDetails } from './pages/CoachDetails';
import { CoachDashboard } from './pages/CoachDashboard';
import { Questionnaire } from './pages/Questionnaire';
import { AdminDashboard } from './pages/Admin';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<CoachList />} />
          <Route path="/coach/:id" element={<CoachDetails />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/for-coaches" element={<CoachDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;