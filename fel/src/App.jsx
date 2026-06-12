import './App.css'
import { Routes, Route } from 'react-router-dom'
import StudentDashboard from './Screens/StudentDashBoard'
import SuccessScreen from './Screens/SuccessScreen'
import CancelScreen from './Screens/CancelScreen'

function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentDashboard />} />
      <Route path="/success" element={<SuccessScreen />} />
      <Route path="/cancel" element={<CancelScreen />} />
    </Routes>
  )
}

export default App


