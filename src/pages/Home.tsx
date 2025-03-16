import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Breadcrumbs,
} from '@mui/material';
import { supabase } from '../supabase-config';
import { Link } from 'react-router-dom';

interface Course {
  id: number;
  title: string;
  description: string;
  image_url: string;
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from('courses').select('*');
      if (error) {
        setError(`Помилка завантаження курсів: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError('Курси поки що недоступні.');
      } else {
        setCourses(data);
      }
      setLoading(false);
    };
    fetchCourses();
  }, []);

  if (loading) {
    return <Typography>Завантаження...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#1976d2' }}
      >
        Доступні курси
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
                '&:hover': { boxShadow: 6 },
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
                  onError={() =>
                    console.log(`Failed to load image: ${course.image_url}`)
                  }
                />
                <CardContent sx={{ textAlign: 'left', p: 2 }}>
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
                    }}
                  >
                    {course.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
