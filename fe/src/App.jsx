import { useEffect } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import StudentDashboard from './Screens/StudentDashBoard'
import SuccessScreen from './Screens/SuccessScreen'
import CancelScreen from './Screens/CancelScreen'
import AdminFlags from './Screens/AdminFlags'
import { initPixel } from './utils/metaPixel'

function App() {
  useEffect(() => {
    initPixel();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<StudentDashboard />} />
      <Route path="/success" element={<SuccessScreen />} />
      <Route path="/cancel" element={<CancelScreen />} />
      <Route path="/admin/flags" element={<AdminFlags />} />
    </Routes>
  )
}

export default App



