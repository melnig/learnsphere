import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import { supabase } from '../supabase-config';

interface CourseGrade {
  course_id: number;
  course_title: string;
  total_lessons: number;
  completed_lessons: number;
  total_questions: number;
  correct_answers: number;
  progress: number;
}

export default function Assessment() {
  const navigate = useNavigate();
  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError('Помилка: Користувач не авторизований');
        navigate('/login');
        return;
      }
      const userId = userData.user.id;

      const { data: enrollments, error: enrollError } = (await supabase
        .from('enrollments')
        .select(
          'course_id, progress, courses!enrollments_course_id_fkey (title)'
        )
        .eq('user_id', userId)) as {
        data:
          | {
              course_id: number;
              progress: number;
              courses: { title: string };
            }[]
          | null;
        error: any;
      };

      if (enrollError) {
        setError(`Помилка завантаження курсів: ${enrollError.message}`);
        setLoading(false);
        return;
      }

      if (!enrollments || enrollments.length === 0) {
        setGrades([]);
        setLoading(false);
        return;
      }

      const gradePromises = enrollments.map(async (enrollment) => {
        const courseId = enrollment.course_id;

        // Уроки
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', courseId);
        if (lessonsError) {
          throw new Error(
            `Помилка завантаження уроків: ${lessonsError.message}`
          );
        }
        const totalLessons = lessonsData?.length || 0;
        const lessonIds = lessonsData?.map((lesson) => lesson.id) || [];

        const { data: lessonProgressData, error: progressError } =
          await supabase
            .from('user_lesson_progress')
            .select('lesson_id')
            .eq('user_id', userId)
            .eq('completed', true)
            .in('lesson_id', lessonIds); // Фільтруємо за lesson_id
        if (progressError) {
          throw new Error(
            `Помилка завантаження прогресу уроків: ${progressError.message}`
          );
        }
        const completedLessons = lessonProgressData?.length || 0;

        // Квіз
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('id')
          .eq('course_id', courseId);
        if (quizError) {
          throw new Error(`Помилка завантаження квіза: ${quizError.message}`);
        }
        const totalQuestions = quizData?.length || 0;

        const { data: answersData, error: answersError } = await supabase
          .from('quiz_answers')
          .select('is_correct')
          .eq('user_id', userId)
          .eq('course_id', courseId);
        if (answersError) {
          throw new Error(
            `Помилка завантаження відповідей: ${answersError.message}`
          );
        }
        const correctAnswers =
          answersData?.filter((a) => a.is_correct).length || 0;

        // Прогрес
        const lessonProgress =
          totalLessons > 0 ? completedLessons / totalLessons : 0;
        const quizProgress =
          totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
        const totalProgress = Math.round(
          lessonProgress * 50 + quizProgress * 50
        );

        return {
          course_id: courseId,
          course_title: enrollment.courses.title,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          progress: totalProgress,
        };
      });

      try {
        const gradesData = await Promise.all(gradePromises);
        setGrades(gradesData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [navigate]);

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'success';
    if (progress >= 40) return 'warning';
    return 'error';
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

  const averageProgress =
    grades.length > 0
      ? Math.round(
          grades.reduce((sum, g) => sum + g.progress, 0) / grades.length
        )
      : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto', mt: '64px' }}>
      <Typography variant="h4" sx={{ mb: 2, color: '#1976d2' }}>
        Оцінки
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Тут відображається ваш загальний прогрес по курсах (50% уроки + 50%
        тест).
      </Typography>
      {grades.length === 0 ? (
        <Typography>
          Ви ще не маєте оцінок. Запишіться на курс і почніть навчання!
        </Typography>
      ) : (
        <>
          {grades.map((grade) => (
            <Card
              key={grade.course_id}
              sx={{
                mb: 3,
                boxShadow: 3,
                borderRadius: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.02)' },
              }}
            >
              <CardContent
                sx={{ display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {grade.course_title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Уроки: {grade.completed_lessons} / {grade.total_lessons}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Тест: {grade.correct_answers} / {grade.total_questions}
                  </Typography>
                </Box>
                <Box sx={{ flex: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={grade.progress}
                    color={getProgressColor(grade.progress)}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ minWidth: 60, textAlign: 'right' }}
                >
                  {grade.progress}%
                </Typography>
              </CardContent>
            </Card>
          ))}
          <Card
            sx={{ mt: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}
          >
            <CardContent>
              <Typography variant="h6">Середній прогрес по курсах:</Typography>
              <Typography
                variant="h4"
                color={getProgressColor(averageProgress)}
              >
                {averageProgress}%
              </Typography>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
