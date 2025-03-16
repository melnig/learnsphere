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
  Link,
  Divider,
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

interface Lesson {
  id: number;
  title: string;
  content: string;
  lesson_order: number;
  code_example?: string;
  video_url?: string;
}

export default function Course() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [hasIncompleteQuiz, setHasIncompleteQuiz] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

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

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('lesson_order', { ascending: true });
      if (lessonsError) {
        setError(`Помилка завантаження уроків: ${lessonsError.message}`);
      } else {
        setLessons(lessonsData || []);
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

          const { data: quizData } = await supabase
            .from('quizzes')
            .select('id')
            .eq('course_id', id);
          const totalQuestions = quizData?.length || 0;
          const { data: answersData } = await supabase
            .from('quiz_answers')
            .select('id, is_correct')
            .eq('user_id', session.session?.user.id)
            .eq('course_id', id);
          const answeredQuestions = answersData?.length || 0;
          const quizScore =
            answersData?.filter((a) => a.is_correct).length || 0;
          setHasIncompleteQuiz(
            answeredQuestions > 0 && answeredQuestions < totalQuestions
          );

          const { data: lessonProgressData } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id')
            .eq('user_id', session.session?.user.id)
            .eq('completed', true);
          setCompletedLessons(
            lessonProgressData?.map((lp) => lp.lesson_id) || []
          );

          const lessonProgress =
            lessonsData && lessonsData.length > 0
              ? (lessonProgressData?.length || 0) / lessonsData.length
              : 0;
          const quizProgress =
            totalQuestions > 0 ? quizScore / totalQuestions : 0;
          const totalProgress = Math.round(
            lessonProgress * 50 + quizProgress * 50
          );
          setProgress(totalProgress);
          if (enrollmentData && enrollmentData.progress !== totalProgress) {
            await supabase
              .from('enrollments')
              .update({ progress: totalProgress })
              .eq('user_id', session.session?.user.id)
              .eq('course_id', id);
          }
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

  const handleQuizComplete = async (newQuizProgress: number) => {
    const { data: session } = await supabase.auth.getSession();
    if (session) {
      const totalQuestions =
        (await supabase.from('quizzes').select('id').eq('course_id', id)).data
          ?.length || 1;
      const quizScore = Math.round((newQuizProgress * totalQuestions) / 100);
      const lessonProgress =
        lessons.length > 0 ? completedLessons.length / lessons.length : 0;
      const totalProgress = Math.round(
        lessonProgress * 50 + (quizScore / totalQuestions) * 50
      );

      const { error } = await supabase
        .from('enrollments')
        .update({ progress: totalProgress })
        .eq('user_id', session.session?.user.id)
        .eq('course_id', id);
      if (!error) {
        setProgress(totalProgress);
        setShowQuiz(false);
        setHasIncompleteQuiz(false);
        setMessage(`Тест завершено! Ваш прогрес: ${totalProgress}%`);
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

  const handleCompleteLesson = async (lessonId: number) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session) {
      setError('Увійдіть, щоб завершити урок.');
      return;
    }

    const { error } = await supabase.from('user_lesson_progress').upsert({
      user_id: session.session?.user.id,
      lesson_id: lessonId,
      completed: true,
    });
    if (error) {
      setError(`Помилка завершення уроку: ${error.message}`);
    } else {
      const newCompletedLessons = [...completedLessons, lessonId];
      setCompletedLessons(newCompletedLessons);
      const lessonProgress =
        lessons.length > 0 ? newCompletedLessons.length / lessons.length : 0;
      const quizScore =
        (
          await supabase
            .from('quiz_answers')
            .select('id, is_correct')
            .eq('user_id', session.session?.user.id)
            .eq('course_id', id)
        ).data?.filter((a) => a.is_correct).length || 0;
      const totalQuestions =
        (await supabase.from('quizzes').select('id').eq('course_id', id)).data
          ?.length || 1;
      const totalProgress = Math.round(
        lessonProgress * 50 + (quizScore / totalQuestions) * 50
      );
      setProgress(totalProgress);
      await supabase
        .from('enrollments')
        .update({ progress: totalProgress })
        .eq('user_id', session.session?.user.id)
        .eq('course_id', id);
      setMessage('Урок виконано!');
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
                  {hasIncompleteQuiz ? 'Продовжити тест' : 'Пройти тест'}
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
      <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 2, color: '#1976d2' }}>
          Уроки курсу
        </Typography>
        {lessons.length === 0 ? (
          <Typography>Уроки відсутні.</Typography>
        ) : (
          lessons.map((lesson) => (
            // У секції уроків:
            <Card key={lesson.id} sx={{ mb: 3, p: 2, boxShadow: 2 }}>
              <Typography variant="h6" sx={{ color: '#1976d2', mb: 1 }}>
                {lesson.title}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                href={`/course/${id}/lesson/${lesson.id}`}
                sx={{ mt: 1 }}
              >
                Детальніше
              </Button>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
}
