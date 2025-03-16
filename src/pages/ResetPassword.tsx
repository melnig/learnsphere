import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { supabase } from '../supabase-config';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Перевіряємо, чи є сесія після переходу за посиланням
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setMessage('Сесія відсутня. Перейдіть за посиланням із листа ще раз.');
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async () => {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(`Помилка оновлення пароля: ${error.message}`);
    } else if (data) {
      setMessage('Пароль успішно оновлено!');
      setTimeout(() => navigate('/login'), 2000); // На /login через 2 секунди
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
          Оновіть ваш пароль для продовження
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
        <Typography
          variant="h5"
          sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}
        >
          Оновлення пароля
        </Typography>
        <TextField
          label="Новий пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 1 }}
          onClick={handleUpdatePassword}
        >
          Оновити пароль
        </Button>
        {message && (
          <Alert
            severity={message.includes('Помилка') ? 'error' : 'success'}
            sx={{ mt: 2 }}
          >
            {message}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
