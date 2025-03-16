import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { supabase } from '../supabase-config';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUpdatePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    if (error) {
      setMessage(`Помилка оновлення пароля: ${error.message}`);
    } else {
      setMessage('Пароль успішно оновлено!');
      setTimeout(() => navigate('/'), 2000); // Редирект на головну через 2 секунди
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Скинути пароль
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
        onClick={handleUpdatePassword}
        sx={{ py: 1.5 }}
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
  );
}
