import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Course from './pages/Course';
import MyLearning from './pages/MyLearning';
import Assessment from './pages/Assessment';
import Progress from './pages/Progress';
import Courses from './pages/Courses';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerWidth = 250;

  return (
    <BrowserRouter>
      <Box
        sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <Header onSidebarToggle={() => setMobileOpen(!mobileOpen)} />
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          <Sidebar
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
            drawerWidth={drawerWidth}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 4 },
              width: { sm: `calc(100% - ${drawerWidth}px)` },
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/course/:id" element={<Course />} />
              <Route path="/my-learning" element={<MyLearning />} />
              <Route path="/assessment" element={<Assessment />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;
