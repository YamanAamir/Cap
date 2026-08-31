import { useEffect } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import StudentDashboard from './Screens/StudentDashBoard'
import SuccessScreen from './Screens/SuccessScreen'
import CancelScreen from './Screens/CancelScreen'
import AdminFlags from './Screens/AdminFlags'
import SmsSignupScreen from './Screens/SmsSignupScreen'
import MaintenanceScreen from './Screens/MaintenanceScreen'
import { initPixel } from './utils/metaPixel'

import { identifyVisitor, pushEvent } from './lib/tracking';
import { startRecording } from './lib/sessionRecorder';

function App() {
  if (window.location.hostname === 'studenterhue.studentlife.dk' && window.location.pathname.includes('/sms-signup/')) {
    const parts = window.location.pathname.split('/');
    const smsSignupIndex = parts.indexOf('sms-signup');
    if (smsSignupIndex !== -1 && parts[smsSignupIndex + 1]) {
      const slug = parts[smsSignupIndex + 1];
      window.location.href = `https://studenterhue.studentlife.dk/studentlife/sms-signup/${slug}`;
      return null;
    }
  }

  if (import.meta.env.VITE_MAINTENANCE_MODE === 'true') {
    return <MaintenanceScreen />;
  }

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
      <Route path="/sms-signup/:slug" element={<SmsSignupScreen />} />
      <Route path="/admin/flags" element={<AdminFlags />} />
    </Routes>
  )
}

export default App



