import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

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
  const sidebarItems = [
    {
      text: 'Моє навчання',
      icon: <MenuBookIcon />,
      onClick: () => console.log('My Learning'),
    },
    {
      text: 'Оцінювання',
      icon: <AssessmentIcon />,
      onClick: () => console.log('Assessment'),
    },
    {
      text: 'Прогрес',
      icon: <TrendingUpIcon />,
      onClick: () => console.log('Progress'),
    },
    {
      text: 'Курси',
      icon: <SchoolIcon />,
      onClick: () => console.log('Courses'),
    },
    {
      text: 'Налаштування',
      icon: <SettingsIcon />,
      onClick: () => console.log('Settings'),
    },
    {
      text: 'Профіль',
      icon: <PersonIcon />,
      onClick: () => console.log('Profile'),
    },
  ];

  const drawer = (
    <List>
      {sidebarItems.map((item) => (
        <ListItemButton key={item.text} onClick={item.onClick}>
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <>
      {/* Сайдбар для десктопу */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            mt: '64px',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        {drawer}
      </Drawer>
      {/* Сайдбар для мобільних */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
