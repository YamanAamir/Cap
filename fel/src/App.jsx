import { useEffect } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import StudentDashboard from './Screens/StudentDashBoard'
import SuccessScreen from './Screens/SuccessScreen'
import CancelScreen from './Screens/CancelScreen'
import { initPixel } from './utils/metaPixel'

import { identifyVisitor, pushEvent } from './lib/tracking';
import { startRecording } from './lib/sessionRecorder';

function App() {
  useEffect(() => {
    initPixel();
    
    const searchParams = new URLSearchParams(window.location.search);
    const program = searchParams.get("program") || undefined;
    const school = searchParams.get("school") || undefined;

    identifyVisitor('graduation_cap', 'gradcap_configurator', { 
      educationType: program, 
      school: school 
    });
    pushEvent('configurator_started', {}, 'gradcap_configurator');
    startRecording();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<StudentDashboard />} />
      <Route path="/success" element={<SuccessScreen />} />
      <Route path="/cancel" element={<CancelScreen />} />
    </Routes>
  )
}

export default App


