import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  Link,
} from '@mui/material';
import { supabase } from '../supabase-config';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';

export default function Landing() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState(0); // 0 - Вхід, 1 - Реєстрація
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`, // Динамічний редирект
      },
    });
    if (error) {
      setMessage(`Помилка реєстрації: ${error.message}`);
    } else {
      setMessage('Перевірте вашу пошту для підтвердження.');
    }
  };

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage(`Помилка входу: ${error.message}`);
    } else {
      navigate('/'); // Відносний шлях, працює з поточним доменом
    }
  };

  const handleResetPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`, // Динамічний редирект
    });
    if (error) {
      setMessage(`Помилка скидання пароля: ${error.message}`);
    } else {
      setMessage('Перевірте ваш email для скидання пароля!');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <SchoolIcon sx={{ fontSize: 40, color: '#1976d2', mr: 1 }} />
          <Typography
            variant="h3"
            sx={{ fontWeight: 'bold', color: '#1976d2' }}
          >
            LearnSphere
          </Typography>
        </Box>
        <Typography variant="subtitle1" sx={{ color: '#555', maxWidth: 400 }}>
          Платформа для вашого навчання та професійного зростання
        </Typography>
      </Box>
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          bgcolor: 'white',
          p: 3,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': { boxShadow: '0 6px 25px rgba(0, 0, 0, 0.15)' },
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          centered
          sx={{ mb: 3 }}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Вхід" sx={{ fontWeight: 'bold' }} />
          <Tab label="Реєстрація" sx={{ fontWeight: 'bold' }} />
        </Tabs>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <TextField
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        {tab === 0 && (
          <Link
            component="button"
            variant="body2"
            onClick={handleResetPassword}
            sx={{
              display: 'block',
              textAlign: 'right',
              mb: 2,
              color: '#1976d2',
            }}
          >
            Забув пароль?
          </Link>
        )}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 1 }}
          onClick={tab === 0 ? handleSignIn : handleSignUp}
        >
          {tab === 0 ? 'Увійти' : 'Зареєструватися'}
        </Button>
        {message && (
          <Alert
            severity={message.includes('Помилка') ? 'error' : 'info'}
            sx={{ mt: 2 }}
          >
            {message}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
