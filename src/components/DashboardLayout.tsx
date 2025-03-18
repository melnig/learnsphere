import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase-config';
import Header from './Header';
import Sidebar from './Sidebar';
import DynamicBreadcrumbs from './DynamicBreadcrumbs';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // Додаємо для перевірки поточного шляху
  const drawerWidth = 250;

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session && location.pathname !== '/login') {
        navigate('/login', { state: { from: location.pathname } }); // Зберігаємо шлях для повернення
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
          navigate('/'); // Редирект на головну тільки з /login
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
          }}
        >
          <DynamicBreadcrumbs />
          {children}
        </Box>
      </Box>
    </Box>
  );
}
