import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
} from '@mui/material';
import { supabase } from '../supabase-config';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(false);
  const [language, setLanguage] = useState('UA');
  const [theme, setTheme] = useState('system');
  const [message, setMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalLessonsCompleted: 0,
    totalQuizCorrect: 0,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError('Помилка: Користувач не авторизований');
        navigate('/login');
        return;
      }

      setEmail(userData.user.email || '');
      setCreatedAt(userData.user.created_at || null);

      const { data: settingsData } = await supabase
        .from('profiles')
        .select('notifications, language, theme')
        .eq('user_id', userData.user.id)
        .single();
      if (settingsData) {
        setNotifications(settingsData.notifications || false);
        setLanguage(settingsData.language || 'UA');
        setTheme(settingsData.theme || 'system');
      }

      const { data: lessonsData } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', userData.user.id)
        .eq('completed', true);
      const totalLessonsCompleted = lessonsData?.length || 0;

      const { data: quizData } = await supabase
        .from('quiz_answers')
        .select('is_correct')
        .eq('user_id', userData.user.id)
        .eq('is_correct', true);
      const totalQuizCorrect = quizData?.length || 0;

      setStats({ totalLessonsCompleted, totalQuizCorrect });

      setLoading(false);
    };
    fetchUserData();
  }, [navigate]);

  const handleChangePassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError(`Помилка надсилання запиту: ${error.message}`);
    } else {
      setMessage('Посилання для зміни пароля надіслано на ваш email!');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(`Помилка виходу: ${error.message}`);
    } else {
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase.from('enrollments').delete().eq('user_id', userData.user.id);
    await supabase
      .from('user_lesson_progress')
      .delete()
      .eq('user_id', userData.user.id);
    await supabase
      .from('quiz_answers')
      .delete()
      .eq('user_id', userData.user.id);
    await supabase.from('profiles').delete().eq('user_id', userData.user.id);

    await supabase.auth.signOut();
    navigate('/login');
    setMessage('Акаунт видалено (тимчасово лише вихід)');
  };

  const handleSaveSettings = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from('profiles')
      .upsert(
        { user_id: userData.user.id, notifications, language, theme },
        { onConflict: 'user_id' }
      );
    if (error) {
      setError(`Помилка збереження налаштувань: ${error.message}`);
    } else {
      setMessage('Налаштування збережено!');
      setTimeout(() => setMessage(null), 3000);
      window.location.reload(); // Тимчасово для оновлення теми
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, mt: '64px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, mt: '64px' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto', mt: '64px' }}>
      <Typography variant="h4" sx={{ mb: 2, color: '#1976d2' }}>
        Налаштування
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Керуйте безпекою, оформленням та параметрами платформи.
      </Typography>

      {/* Інформація */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Інформація
          </Typography>
          <Typography>Email: {email}</Typography>
          <Typography>
            Дата реєстрації:{' '}
            {createdAt
              ? new Date(createdAt).toLocaleDateString('uk-UA')
              : 'Невідомо'}
          </Typography>
        </CardContent>
      </Card>

      {/* Статистика */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Розширена статистика
          </Typography>
          <Typography>
            Завершено уроків: {stats.totalLessonsCompleted}
          </Typography>
          <Typography>
            Правильних відповідей у квізах: {stats.totalQuizCorrect}
          </Typography>
        </CardContent>
      </Card>

      {/* Налаштування платформи */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Налаштування платформи
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ mb: 1 }}>
              Тема оформлення
            </FormLabel>
            <RadioGroup
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <FormControlLabel
                value="light"
                control={<Radio />}
                label="Світла"
              />
              <FormControlLabel
                value="dark"
                control={<Radio />}
                label="Темна"
              />
              <FormControlLabel
                value="system"
                control={<Radio />}
                label="Системна"
              />
            </RadioGroup>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
            }
            label="Отримувати сповіщення про нові курси"
            sx={{ mb: 2, display: 'block' }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={language === 'UA'}
                onChange={(e) => setLanguage(e.target.checked ? 'UA' : 'EN')}
              />
            }
            label="Українська мова (UA)"
            sx={{ mb: 2, display: 'block' }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveSettings}
          >
            Зберегти
          </Button>
        </CardContent>
      </Card>

      {/* Безпека */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Безпека
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleChangePassword}
            >
              Змінити пароль
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleLogout}>
              Вийти
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Видалити акаунт
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Діалог видалення */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Видалити акаунт?</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити свій акаунт? Усі ваші дані (курси,
            прогрес) будуть втрачені.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Скасувати</Button>
          <Button color="error" onClick={handleDeleteAccount}>
            Видалити
          </Button>
        </DialogActions>
      </Dialog>

      {message && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
    </Box>
  );
}
