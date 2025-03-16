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
    { text: 'Моє навчання', icon: <MenuBookIcon />, path: '/my-learning' },
    { text: 'Оцінювання', icon: <AssessmentIcon />, path: '/assessment' },
    { text: 'Прогрес', icon: <TrendingUpIcon />, path: '/progress' },
    { text: 'Курси', icon: <SchoolIcon />, path: '/courses' },
    { text: 'Налаштування', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Профіль', icon: <PersonIcon />, path: '/profile' },
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
            mt: '64px',
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
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
