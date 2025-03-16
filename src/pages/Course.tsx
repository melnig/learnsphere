import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  Alert,
} from '@mui/material';
import { supabase } from '../supabase-config';
import Quiz from '../components/Quiz';

interface CourseData {
  id: number;
  title: string;
  description: string;
  image_url: string;
  duration: string;
}

export default function Course() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      if (courseError) {
        setError(`Помилка завантаження курсу: ${courseError.message}`);
      } else if (!courseData) {
        setError('Курс не знайдено.');
      } else {
        setCourse(courseData);
      }

      const { data: session } = await supabase.auth.getSession();
      if (session) {
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('id, progress')
          .eq('user_id', session.session?.user.id)
          .eq('course_id', id)
          .single();
        if (!enrollmentError && enrollmentData) {
          setIsEnrolled(true);
          setProgress(enrollmentData.progress || 0);
        }
      }

      setLoading(false);
    };
    fetchCourseAndEnrollment();
  }, [id]);

  const handleEnroll = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session) {
      setError('Увійдіть, щоб записатися на курс.');
      return;
    }

    const { error } = await supabase
      .from('enrollments')
      .insert({ user_id: session.session?.user.id, course_id: id });
    if (error) {
      setError(`Помилка запису: ${error.message}`);
    } else {
      setIsEnrolled(true);
      setProgress(0);
      setMessage('Ви успішно записалися на курс!');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleQuizComplete = async (newProgress: number) => {
    const { data: session } = await supabase.auth.getSession();
    if (session) {
      const { error } = await supabase
        .from('enrollments')
        .update({ progress: newProgress })
        .eq('user_id', session.session?.user.id)
        .eq('course_id', id);
      if (!error) {
        setProgress(newProgress);
        setShowQuiz(false);
        setMessage(`Тест завершено! Ваш прогрес: ${newProgress}%`);
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  const handleUnenroll = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session) {
      setError('Увійдіть, щоб скасувати запис.');
      return;
    }

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('user_id', session.session?.user.id)
      .eq('course_id', id);
    if (error) {
      setError(`Помилка скасування: ${error.message}`);
    } else {
      setIsEnrolled(false);
      setProgress(0);
      setMessage('Ви скасували запис на курс.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return <Typography>Завантаження...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!course) {
    return <Typography>Курс не знайдено.</Typography>;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Card sx={{ maxWidth: 800, mx: 'auto', boxShadow: 3 }}>
        <CardMedia
          component="img"
          height="300"
          image={course.image_url}
          alt={course.title}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 'bold', color: '#1976d2' }}
          >
            {course.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {course.description}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Тривалість: {course.duration}
          </Typography>
          {isEnrolled && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Прогрес: {progress}%
              </Typography>
              {progress === 100 ? (
                <Button
                  variant="contained"
                  color="success"
                  disabled
                  sx={{ mt: 2, mr: 2 }}
                >
                  Курс пройдено
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setShowQuiz(true)}
                  sx={{ mt: 2, mr: 2 }}
                >
                  Пройти тест
                </Button>
              )}
            </>
          )}
          {isEnrolled ? (
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleUnenroll}
              disabled={progress === 100}
              sx={{ mt: 2 }}
            >
              Скасувати запис
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleEnroll}
              sx={{ mt: 2 }}
            >
              Записатися на курс
            </Button>
          )}
          {message && (
            <Alert
              severity={message.includes('Помилка') ? 'error' : 'success'}
              sx={{ mt: 2 }}
            >
              {message}
            </Alert>
          )}
          {showQuiz && isEnrolled && progress < 100 && (
            <Quiz courseId={Number(id)} onComplete={handleQuizComplete} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
