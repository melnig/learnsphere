import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase-config';
import Header from './Header';
import Sidebar from './Sidebar';
import DynamicBreadcrumbs from './DynamicBreadcrumbs';
import Footer from './Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const drawerWidth = 250;

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session && location.pathname !== '/login') {
        navigate('/login', { state: { from: location.pathname } });
      }
      setLoading(false);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/login');
        } else if (
          event === 'SIGNED_IN' &&
          session &&
          location.pathname === '/login'
        ) {
          navigate('/');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location]);

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
            mt: '64px',
            p: { xs: 2, sm: 4 },
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            minHeight: 'calc(100vh - 64px)',
            pb: 4, // Додаємо відступ знизу, щоб футер не перекривав контент
          }}
        >
          <DynamicBreadcrumbs />
          {children}
        </Box>
      </Box>
      {/* Футер на всю ширину з fixed позиціонуванням */}
      <Box
        sx={{
          width: '100%',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0, // Розтягуємо до правого краю
          zIndex: 1210,
          backgroundColor: '#1976d2',
          textAlign: 'center', // Забезпечуємо, що колір не зміщується
        }}
      >
        <Footer />
      </Box>
    </Box>
  );
}
