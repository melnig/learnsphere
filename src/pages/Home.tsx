import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';

export default function Home() {
  const courses = [
    {
      id: '1',
      title: 'Introduction to JavaScript',
      description: 'Learn the basics of JS programming.',
    },
    {
      id: '2',
      title: 'React Fundamentals',
      description: 'Master React for modern web apps.',
    },
  ];

  return (
    <>
      <Typography
        variant="h4"
        sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}
      >
        Available Courses
      </Typography>
      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 1 }}>
                  {course.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  href={`/course/${course.id}`}
                >
                  Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
