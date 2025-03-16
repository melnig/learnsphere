import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { supabase } from '../supabase-config';

interface Enrollment {
  course_id: number;
  progress: number;
  courses: { title: string }; // Об’єкт
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError('Помилка: Користувач не авторизований');
        navigate('/login');
        return;
      }
      setUser(userData.user);

      const { data: enrollData, error: enrollError } = (await supabase
        .from('enrollments')
        .select(
          'course_id, progress, courses!enrollments_course_id_fkey (title)'
        )
        .eq('user_id', userData.user.id)) as {
        data: Enrollment[] | null;
        error: any;
      }; // Явна типізація
      if (enrollError) {
        setError(`Помилка завантаження курсів: ${enrollError.message}`);
      } else {
        console.log('Enrollments data:', enrollData);
        setEnrollments(enrollData || []);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2, color: '#1976d2' }}>
        Профіль
      </Typography>
      <Card sx={{ mb: 3, p: 2 }}>
        <CardContent>
          <Typography variant="h6">Користувач: {user?.email}</Typography>
          <Typography>ID: {user?.id}</Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleLogout}
            sx={{ mt: 2 }}
          >
            Вийти
          </Button>
        </CardContent>
      </Card>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Мої курси
      </Typography>
      {enrollments.length === 0 ? (
        <Typography>Ви ще не записані на жоден курс.</Typography>
      ) : (
        enrollments.map((enrollment) => (
          <Card key={enrollment.course_id} sx={{ mb: 2, p: 2 }}>
            <CardContent>
              <Typography variant="h6">
                {enrollment.courses?.title || 'Без назви'}
              </Typography>
              <Typography>Прогрес: {enrollment.progress}%</Typography>
              <Button
                variant="outlined"
                color="primary"
                href={`/course/${enrollment.course_id}`}
                sx={{ mt: 1 }}
              >
                Перейти до курсу
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
