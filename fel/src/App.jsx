import { useEffect } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import StudentDashboard from './Screens/StudentDashBoard'
import SuccessScreen from './Screens/SuccessScreen'
import CancelScreen from './Screens/CancelScreen'
import { initPixel } from './utils/metaPixel'

import { identifyVisitor, pushEvent } from './lib/tracking';

function App() {
  useEffect(() => {
    initPixel();
    identifyVisitor('graduation_cap', 'gradcap_configurator');
    pushEvent('configurator_started', {}, 'gradcap_configurator');
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


