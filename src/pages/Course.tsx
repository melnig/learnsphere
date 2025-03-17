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

interface Lesson {
  id: number;
  title: string;
  content: string;
  lesson_order: number;
  code_example?: string;
  video_url?: string;
}

// ... (інші імпорти та інтерфейси без змін)

export default function Course() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
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
        .eq('id', courseId)
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
        .eq('course_id', courseId)
        .order('lesson_order', { ascending: true });
      if (lessonsError) {
        setError(`Помилка завантаження уроків: ${lessonsError.message}`);
      } else {
        setLessons(lessonsData || []);
      }

      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const userId = session.session.user.id;

        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('id, progress')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .single();
        if (!enrollmentError && enrollmentData) {
          setIsEnrolled(true);

          // Завантажуємо прогрес уроків
          const lessonIds = lessonsData?.map((lesson) => lesson.id) || [];
          const { data: lessonProgressData } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id')
            .eq('user_id', userId)
            .eq('completed', true)
            .in('lesson_id', lessonIds);
          const completed = lessonProgressData?.map((lp) => lp.lesson_id) || [];
          setCompletedLessons(completed);

          // Завантажуємо прогрес квіза
          const { data: quizData } = await supabase
            .from('quizzes')
            .select('id')
            .eq('course_id', courseId);
          const totalQuestions = quizData?.length || 0;

          const { data: answersData } = await supabase
            .from('quiz_answers')
            .select('is_correct')
            .eq('user_id', userId)
            .eq('course_id', courseId);
          const quizScore =
            answersData?.filter((a) => a.is_correct).length || 0;
          setHasIncompleteQuiz(
            (answersData?.length || 0) > 0 &&
              (answersData?.length || 0) < totalQuestions
          );

          // Розрахунок прогресу
          const lessonProgress = lessonsData?.length
            ? completed.length / lessonsData.length
            : 0;
          const quizProgress =
            totalQuestions > 0 ? quizScore / totalQuestions : 0;
          const totalProgress = Math.round(
            lessonProgress * 50 + quizProgress * 50
          );

          setProgress(totalProgress);

          if (enrollmentData.progress !== totalProgress) {
            await supabase
              .from('enrollments')
              .update({ progress: totalProgress })
              .eq('user_id', userId)
              .eq('course_id', courseId);
          }
        }
      }

      setLoading(false);
    };
    fetchCourseAndEnrollment();
  }, [courseId]);

  const handleEnroll = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      setError('Увійдіть, щоб записатися на курс.');
      return;
    }
    const userId = session.session.user.id;

    // Перевірка, чи вже записаний
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    if (existingEnrollment) {
      setMessage('Ви вже записані на цей курс!');
      setIsEnrolled(true);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const { error } = await supabase
      .from('enrollments')
      .insert({ user_id: userId, course_id: courseId });
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
    if (session?.session?.user) {
      const userId = session.session.user.id;

      const { data: quizData } = await supabase
        .from('quizzes')
        .select('id')
        .eq('course_id', courseId);
      const totalQuestions = quizData?.length || 1;
      const quizScore = Math.round((newQuizProgress * totalQuestions) / 100);

      const lessonProgress =
        lessons.length > 0 ? completedLessons.length / lessons.length : 0;
      const totalProgress = Math.round(
        lessonProgress * 50 + (quizScore / totalQuestions) * 50
      );

      const { error } = await supabase
        .from('enrollments')
        .update({ progress: totalProgress })
        .eq('user_id', userId)
        .eq('course_id', courseId);
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
    if (!session?.session?.user) {
      setError('Увійдіть, щоб скасувати запис.');
      return;
    }

    const userId = session.session.user.id;

    const { error: unenrollError } = await supabase
      .from('enrollments')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);
    if (unenrollError) {
      setError(`Помилка скасування: ${unenrollError.message}`);
      return;
    }

    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);
    const lessonIds = lessonsData?.map((lesson) => lesson.id) || [];
    if (lessonIds.length > 0) {
      const { error: progressError } = await supabase
        .from('user_lesson_progress')
        .delete()
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);
      if (progressError) {
        setError(`Помилка видалення прогресу уроків: ${progressError.message}`);
        return;
      }
    }

    const { error: quizError } = await supabase
      .from('quiz_answers')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);
    if (quizError) {
      setError(`Помилка видалення відповідей квіза: ${quizError.message}`);
      return;
    }

    setIsEnrolled(false);
    setProgress(0);
    setCompletedLessons([]);
    setHasIncompleteQuiz(false);
    setMessage('Ви скасували запис на курс. Усі дані обнулено.');
    setTimeout(() => setMessage(null), 3000);
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
    <Box sx={{ p: 4, mt: '64px' }}>
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
                Загальний прогрес (уроки + тест): {progress}%
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
            <Quiz courseId={courseId} onComplete={handleQuizComplete} />
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
            <Card key={lesson.id} sx={{ mb: 3, p: 2, boxShadow: 2 }}>
              <Typography variant="h6" sx={{ color: '#1976d2', mb: 1 }}>
                {lesson.title}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                href={`/course/${courseId}/lesson/${lesson.id}`}
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
