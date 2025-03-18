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

interface Course {
  id: number;
  title: string;
  description: string;
  image_url: string;
}

export default function Header({ onSidebarToggle }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchAnchorEl, setSearchAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [userData, setUserData] = useState<{
    firstName?: string;
    lastName?: string;
    avatarUrl: string;
  }>({
    avatarUrl: 'https://via.placeholder.com/40',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const open = Boolean(anchorEl);
  const searchOpen = Boolean(searchAnchorEl);
  const navigate = useNavigate();

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
      }
    }
  };

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
            avatarUrl: updatedProfile.avatar_url || prev.avatarUrl,
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

  const handleSearchChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, image_url')
        .ilike('title', `%${query}%`)
        .limit(5);
      if (!error && data && data.length > 0) {
        setSearchResults(data);
        setSearchAnchorEl(event.target as HTMLElement);
      } else {
        setSearchResults([]);
        setSearchAnchorEl(null);
      }
    } else {
      setSearchResults([]);
      setSearchAnchorEl(null);
    }
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter' && searchResults.length > 0) {
      const firstResult = searchResults[0];
      setSearchQuery('');
      setSearchResults([]);
      setSearchAnchorEl(null);
      navigate(`/course/${firstResult.id}`);
    }
  };

  const handleSearchSelect = (courseId: number) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchAnchorEl(null);
    navigate(`/course/${courseId}`);
  };

  const handleSearchClose = () => {
    setSearchAnchorEl(null);
    // Не очищаємо searchQuery тут, щоб уникнути втрати тексту
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: '#1976d2',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: '100%',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 56 }}>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            variant="outlined"
            placeholder="Пошук курсів..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            // Прибрано onBlur, щоб уникнути очищення
            size="small"
            sx={{
              display: { xs: 'none', sm: 'block' },
              backgroundColor: 'white',
              borderRadius: 1,
              width: 200,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' },
              },
            }}
          />
          <Menu
            anchorEl={searchAnchorEl}
            open={searchOpen}
            onClose={handleSearchClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              sx: { maxHeight: 300, width: 300 },
            }}
          >
            {searchResults.length > 0 ? (
              searchResults.map((course) => (
                <MenuItem
                  key={course.id}
                  onClick={() => handleSearchSelect(course.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={course.image_url}
                      alt={course.title}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography variant="body2" noWrap>
                      {course.title}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <Typography variant="body2">Немає результатів</Typography>
              </MenuItem>
            )}
          </Menu>
          <Typography
            sx={{
              display: { xs: 'none', sm: 'block' },
              color: 'white',
              mr: 1,
            }}
          >
            {userData.firstName} {userData.lastName}
          </Typography>
          <Avatar
            src={userData.avatarUrl}
            alt="User"
            sx={{ width: 32, height: 32, cursor: 'pointer' }}
            onClick={handleMenuOpen}
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
