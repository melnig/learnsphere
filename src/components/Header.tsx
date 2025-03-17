import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import SchoolIcon from '@mui/icons-material/School';
import { supabase } from '../supabase-config';

interface HeaderProps {
  onSidebarToggle: () => void;
}

export default function Header({ onSidebarToggle }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userData, setUserData] = useState<{
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  // Функція для завантаження даних користувача
  const fetchUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('user_id', user.id)
        .single();
      if (!error && data) {
        setUserData({
          firstName: data.first_name,
          lastName: data.last_name,
          avatarUrl: data.avatar_url || 'https://via.placeholder.com/40',
        });
      } else {
        setUserData({ avatarUrl: 'https://via.placeholder.com/40' });
      }
    }
  };

  // Завантаження та підписка
  useEffect(() => {
    fetchUserData();

    const subscription = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updatedProfile = payload.new as {
            first_name?: string;
            last_name?: string;
            avatar_url?: string;
          };
          setUserData((prev) => ({
            ...prev,
            firstName: updatedProfile.first_name,
            lastName: updatedProfile.last_name,
            avatarUrl:
              updatedProfile.avatar_url ||
              prev?.avatarUrl ||
              'https://via.placeholder.com/40',
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    handleMenuClose();
    navigate('/login');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    // Логіка пошуку буде додана пізніше
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: '#1976d2',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
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
          <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', letterSpacing: 1 }}
            >
              LearnSphere
            </Typography>
          </Link>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {userData && (
            <Typography sx={{ color: 'white', mr: 2 }}>
              {userData.firstName} {userData.lastName}
            </Typography>
          )}
          <Avatar
            src={userData?.avatarUrl || 'https://via.placeholder.com/40'}
            alt="User"
            sx={{ width: 32, height: 32, cursor: 'pointer', mr: 2 }}
            onClick={handleMenuOpen}
          />
          <TextField
            variant="outlined"
            size="small"
            placeholder="Пошук..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
              backgroundColor: 'white',
              borderRadius: 1,
              '& .MuiInputBase-input': { padding: '6px 12px' },
            }}
          />
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleMenuClose} component={Link} to="/profile">
              Профіль
            </MenuItem>
            <MenuItem onClick={handleSignOut}>Вийти</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
