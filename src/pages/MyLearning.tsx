import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  LinearProgress,
} from '@mui/material';
import { supabase } from '../supabase-config';
import { Link } from 'react-router-dom';

interface EnrolledCourse {
  id: number;
  title: string;
  description: string;
  image_url: string;
  progress: number;
}

export default function MyLearning() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        setError('Увійдіть, щоб переглянути ваші курси.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('enrollments')
        .select('courses (id, title, description, image_url), progress')
        .eq('user_id', session.session?.user.id);

      if (error) {
        setError(`Помилка завантаження курсів: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError('Ви ще не записані на жоден курс.');
      } else {
        setCourses(
          data.map((item: any) => ({
            ...item.courses,
            progress: item.progress,
          }))
        );
      }
      setLoading(false);
    };
    fetchEnrolledCourses();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto', mt: '64px' }}>
        <Typography>Завантаження...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'regular', color: '#1976d2', mb: 4 }}
      >
        Моє навчання
      </Typography>
      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={12} md={6} lg={4} key={course.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 3,
                '&:hover': { boxShadow: 6 },
                mb: 3,
              }}
            >
              <CardActionArea
                component={Link}
                to={`/course/${course.id}`}
                sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={course.image_url}
                  alt={course.title}
                />
                <CardContent sx={{ textAlign: 'left', p: 2, flexGrow: 0 }}>
                  <Typography
                    gutterBottom
                    variant="h6"
                    component="div"
                    sx={{
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {course.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1,
                    }}
                  >
                    {course.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mr: 1 }}
                    >
                      Прогрес:
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={course.progress}
                      sx={{ flexGrow: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {course.progress}%
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
