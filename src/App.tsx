import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Course from './pages/Course';

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
            </Routes>
          </Box>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;
