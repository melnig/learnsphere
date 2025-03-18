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
  Button,
  Grid,
} from '@mui/material';
import { supabase } from '../supabase-config';

interface ProgressData {
  course_id: number;
  course_title: string;
  lessons_completed: number;
  total_lessons: number;
  quiz_score: number;
  total_questions: number;
  lesson_progress: number;
  quiz_progress: number;
  total_progress: number;
}

export default function Progress() {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError('Помилка: Користувач не авторизований');
        navigate('/login');
        return;
      }
      const userId = userData.user.id;

      const { data: enrollData, error: enrollError } = (await supabase
        .from('enrollments')
        .select('course_id, courses!enrollments_course_id_fkey (title)')
        .eq('user_id', userId)) as {
        data: { course_id: number; courses: { title: string } }[] | null;
        error: any;
      };
      if (enrollError) {
        setError(`Помилка завантаження курсів: ${enrollError.message}`);
        setLoading(false);
        return;
      }

      // Унікалізація курсів за course_id
      const uniqueEnrollments = Array.from(
        new Map(
          (enrollData || []).map((item) => [item.course_id, item])
        ).values()
      );

      const progressPromises = uniqueEnrollments.map(async (enrollment) => {
        const courseId = enrollment.course_id;

        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', courseId);
        const totalLessons = lessonsData?.length || 0;
        const lessonIds = lessonsData?.map((l) => l.id) || [];

        const { data: completedData } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id')
          .eq('user_id', userId)
          .eq('completed', true)
          .in('lesson_id', lessonIds);
        const lessonsCompleted = completedData?.length || 0;

        const { data: quizAnswers } = await supabase
          .from('quiz_answers')
          .select('is_correct')
          .eq('user_id', userId)
          .eq('course_id', courseId);
        const quizScore = quizAnswers?.filter((a) => a.is_correct).length || 0;

        const { data: totalQuestionsData } = await supabase
          .from('quizzes')
          .select('id')
          .eq('course_id', courseId);
        const totalQuestions = totalQuestionsData?.length || 0;

        const lessonProgress =
          totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;
        const quizProgress =
          totalQuestions > 0 ? (quizScore / totalQuestions) * 100 : 0;
        const totalProgress = Math.round(
          lessonProgress * 0.5 + quizProgress * 0.5
        );

        return {
          course_id: courseId,
          course_title: enrollment.courses?.title || 'Без назви',
          lessons_completed: lessonsCompleted,
          total_lessons: totalLessons,
          quiz_score: quizScore,
          total_questions: totalQuestions,
          lesson_progress: Math.round(lessonProgress),
          quiz_progress: Math.round(quizProgress),
          total_progress: totalProgress,
        };
      });

      try {
        const data = await Promise.all(progressPromises);
        setProgressData(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
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

  const totalCourses = progressData.length;
  const completedCourses = progressData.filter(
    (p) => p.total_progress === 100
  ).length;
  const averageProgress =
    totalCourses > 0
      ? Math.round(
          progressData.reduce((sum, p) => sum + p.total_progress, 0) /
            totalCourses
        )
      : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2, color: '#1976d2' }}>
        Мій прогрес
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Перегляньте вашу статистику навчання та прогрес по курсах.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, textAlign: 'center', boxShadow: 3 }}>
            <Typography variant="h6">Курсів розпочато</Typography>
            <Typography variant="h4" color="#1976d2">
              {totalCourses}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, textAlign: 'center', boxShadow: 3 }}>
            <Typography variant="h6">Курсів завершено</Typography>
            <Typography variant="h4" color="#1976d2">
              {completedCourses}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, textAlign: 'center', boxShadow: 3 }}>
            <Typography variant="h6">Середній прогрес</Typography>
            <Typography variant="h4" color={getProgressColor(averageProgress)}>
              {averageProgress}%
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {progressData.length === 0 ? (
        <Typography>
          Прогрес відсутній. Запишіться на курс, щоб почати!
        </Typography>
      ) : (
        progressData.map((course) => (
          <Card
            key={course.course_id}
            sx={{
              mb: 3,
              boxShadow: 3,
              borderRadius: 2,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' },
            }}
          >
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {course.course_title}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Уроки: {course.lessons_completed} / {course.total_lessons}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={course.lesson_progress}
                  color={getProgressColor(course.lesson_progress)}
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Тест: {course.quiz_score} / {course.total_questions}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={course.quiz_progress}
                  color={getProgressColor(course.quiz_progress)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6">
                  Загальний прогрес: {course.total_progress}%
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => navigate(`/course/${course.course_id}`)}
                >
                  Продовжити
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
