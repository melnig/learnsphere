import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Button,
} from '@mui/material';
import { supabase } from '../supabase-config';
import { Link, useNavigate } from 'react-router-dom';

interface Course {
  id: number;
  title: string;
  description: string;
  image_url: string;
  is_featured?: boolean;
}

export default function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [lastCourseId, setLastCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*');
      if (coursesError) {
        setError(`Помилка завантаження курсів: ${coursesError.message}`);
      } else if (!coursesData || coursesData.length === 0) {
        setError('Курси поки що недоступні.');
      } else {
        setCourses(coursesData);
        setFeaturedCourses(coursesData.filter((course) => course.is_featured));
      }

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (!userError && userData.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', userData.user.id)
          .single();
        setUserName(profileData?.first_name || null);

        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false });
        if (enrollData) {
          setEnrolledCount(enrollData.length);
          setLastCourseId(enrollData[0]?.course_id || null);
        }
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Завантаження...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Герой-секція */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ color: '#1976d2', mb: 2 }}>
          {userName
            ? `Вітаємо, ${userName}!`
            : 'Ласкаво просимо до LearnSphere!'}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          {userName
            ? 'Продовжуйте навчання та відкривайте нові знання.'
            : 'Увійдіть, щоб розпочати свою подорож у світ знань.'}
        </Typography>
        {userName && enrolledCount > 0 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              navigate(lastCourseId ? `/course/${lastCourseId}` : '/progress')
            }
          >
            Продовжити навчання
          </Button>
        ) : (
          !userName && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
            >
              Увійти
            </Button>
          )
        )}
      </Box>

      {/* Рекомендовані курси */}
      {featuredCourses.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 'bold', color: '#1976d2' }}
          >
            Рекомендовані курси
          </Typography>
          <Grid container spacing={3}>
            {featuredCourses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 3,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.03)', boxShadow: 6 },
                  }}
                >
                  <CardActionArea component={Link} to={`/course/${course.id}`}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={course.image_url}
                      alt={course.title}
                      onError={() =>
                        console.log(`Failed to load image: ${course.image_url}`)
                      }
                    />
                    <CardContent>
                      <Typography
                        gutterBottom
                        variant="h6"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {course.description.slice(0, 100)}...
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Усі курси */}
      <Box>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: 'bold', color: '#1976d2' }}
        >
          Усі доступні курси
        </Typography>
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 3,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.03)', boxShadow: 6 },
                }}
              >
                <CardActionArea component={Link} to={`/course/${course.id}`}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={course.image_url}
                    alt={course.title}
                    onError={() =>
                      console.log(`Failed to load image: ${course.image_url}`)
                    }
                  />
                  <CardContent>
                    <Typography
                      gutterBottom
                      variant="h6"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {course.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {course.description.slice(0, 100)}...
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Статистика для авторизованих */}
      {userName && enrolledCount > 0 && (
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Ваш прогрес: записано на {enrolledCount} курс
            {enrolledCount > 1 ? 'и' : ''}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/progress')}
          >
            Переглянути прогрес
          </Button>
        </Box>
      )}
    </Box>
  );
}
