import { useEffect, useState } from 'react';
import { supabase } from '../supabase-config';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Link } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  drawerWidth: number;
}

export default function Sidebar({
  mobileOpen,
  onClose,
  drawerWidth,
}: SidebarProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', userData.user.id)
          .single();
        if (profileData?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    };
    checkAdminRole();
  }, []);
  const sidebarItems = [
    { text: 'Моє навчання', icon: <MenuBookIcon />, path: '/my-learning' },
    { text: 'Оцінювання', icon: <AssessmentIcon />, path: '/assessment' },
    { text: 'Прогрес', icon: <TrendingUpIcon />, path: '/progress' },
    { text: 'Курси', icon: <SchoolIcon />, path: '/courses' },
    { text: 'Налаштування', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Профіль', icon: <PersonIcon />, path: '/profile' },
    ...(isAdmin
      ? [
          {
            text: 'Адмін-панель',
            icon: <AdminPanelSettingsIcon />,
            path: '/admin',
          },
        ]
      : []),
  ];

  const drawer = (
    <List>
      {sidebarItems.map((item) => (
        <ListItemButton
          key={item.text}
          component={Link}
          to={item.path}
          onClick={onClose}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            mt: '64px', // Відступ для хедера
            height: 'calc(100vh - 64px - 56px)', // Обмежуємо висоту (хедер + футер)
            overflowY: 'auto', // Додаємо прокрутку
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            mt: '56px',
            height: 'calc(100vh - 64px )',
            overflowY: 'auto',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
