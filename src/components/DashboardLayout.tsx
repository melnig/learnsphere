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
  const headerHeight = 64; // Висота хедера
  const footerHeight = 56; // Висота футера (налаштуй, якщо потрібно)

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
            p: { xs: 2, sm: 4 },
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            minHeight: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`, // Висота контенту
          }}
        >
          <DynamicBreadcrumbs />
          {children}
        </Box>
      </Box>
      {/* Футер у потоці */}
      <Box
        sx={{
          width: '100%',
          mt: 'auto', // Притискаємо донизу
          zIndex: 1200, // Піднімаємо над боковим меню
        }}
      >
        <Footer />
      </Box>
    </Box>
  );
}
