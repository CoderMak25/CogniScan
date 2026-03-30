import { Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import LandingHero from './components/LandingHero.jsx'
import CognitiveTaskScreen from './components/tasks/CognitiveTaskScreen.jsx'
import DashboardScreen from './components/DashboardScreen.jsx'
import SpeechAnalyzer from './components/SpeechAnalyzer.jsx'
import FacialAnalyzer from './components/FacialAnalyzer.jsx'
import InsightsScreen from './components/InsightsScreen.jsx'
import ResultsScreen from './components/ResultsScreen.jsx'
import CaregiverDrawer from './components/CaregiverDrawer.jsx'
import SpecializedTaskScreen from './components/tasks/SpecializedTaskScreen.jsx'

function App() {
  return (
    <div className="min-h-screen bg-bg text-textPrimary font-sans antialiased overflow-x-hidden">
      <NavBar />
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-[104px] pb-20">
        <Routes>
          <Route path="/" element={<LandingHero />} />
          <Route path="/tasks" element={<CognitiveTaskScreen />} />
          <Route path="/tasks/:taskType" element={<SpecializedTaskScreen />} />
          <Route path="/results" element={<ResultsScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/speech" element={<SpeechAnalyzer />} />
          <Route path="/facial" element={<FacialAnalyzer />} />
          <Route path="/insights" element={<InsightsScreen />} />
        </Routes>
      </main>
      <CaregiverDrawer />
      <footer className="text-center pb-12 text-[11px] text-baseline font-medium max-w-[800px] mx-auto px-6 uppercase tracking-widest">
        CogniScan · Wellness monitoring tool only · Not a medical device · Consult
        a physician for clinical evaluation
      </footer>
    </div>
  )
}

export default App
