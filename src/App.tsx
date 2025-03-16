import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Course from './pages/Course';
import MyLearning from './pages/MyLearning';
import Assessment from './pages/Assessment';
import Progress from './pages/Progress';
import Courses from './pages/Courses';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Landing />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <DashboardLayout>
              <Home />
            </DashboardLayout>
          }
        />
        <Route
          path="/course/:id"
          element={
            <DashboardLayout>
              <Course />
            </DashboardLayout>
          }
        />
        <Route
          path="/my-learning"
          element={
            <DashboardLayout>
              <MyLearning />
            </DashboardLayout>
          }
        />
        <Route
          path="/assessment"
          element={
            <DashboardLayout>
              <Assessment />
            </DashboardLayout>
          }
        />
        <Route
          path="/progress"
          element={
            <DashboardLayout>
              <Progress />
            </DashboardLayout>
          }
        />
        <Route
          path="/courses"
          element={
            <DashboardLayout>
              <Courses />
            </DashboardLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
