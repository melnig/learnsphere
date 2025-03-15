import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SchoolIcon from '@mui/icons-material/School';

interface HeaderProps {
  onSidebarToggle: () => void;
}

export default function Header({ onSidebarToggle }: HeaderProps) {
  const user = { avatarUrl: 'https://via.placeholder.com/40', name: 'Ihor' };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#1976d2',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onSidebarToggle}
            sx={{ display: { xs: 'block', sm: 'none' }, mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <SchoolIcon sx={{ mr: 1, fontSize: 32 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', letterSpacing: 1 }}
          >
            LearnSphere
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={user.avatarUrl}
            alt={user.name}
            sx={{ width: 32, height: 32, cursor: 'pointer' }}
            onClick={() => console.log('Go to Profile')} // Пізніше додамо <Link>
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
