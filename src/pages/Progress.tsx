import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { supabase } from '../supabase-config';

interface ProgressData {
  course_id: number;
  course_title: string;
  lessons_completed: number;
  total_lessons: number;
  quiz_score: number;
  total_questions: number;
}

export default function Progress() {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError('Помилка: Користувач не авторизований');
        return;
      }

      const { data: enrollData, error: enrollError } = (await supabase
        .from('enrollments')
        .select('course_id, courses!enrollments_course_id_fkey (title)')
        .eq('user_id', userData.user.id)) as {
        data: { course_id: number; courses: { title: string } }[] | null;
        error: any;
      };
      if (enrollError) {
        setError(`Помилка завантаження курсів: ${enrollError.message}`);
        return;
      }

      console.log('Enrollments data:', enrollData);

      // Обробка випадку, коли enrollData === null
      const progressPromises = (enrollData || []).map(async (enrollment) => {
        const courseId = enrollment.course_id;

        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', courseId);
        const totalLessons = lessonsData?.length || 0;

        const { data: completedData } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id')
          .eq('user_id', userData.user.id)
          .eq('completed', true)
          .in('lesson_id', lessonsData?.map((l) => l.id) || []);
        const lessonsCompleted = completedData?.length || 0;

        const { data: quizAnswers } = await supabase
          .from('quiz_answers')
          .select('is_correct')
          .eq('user_id', userData.user.id)
          .eq('course_id', courseId);
        const quizScore = quizAnswers?.filter((a) => a.is_correct).length || 0;

        const { data: totalQuestionsData } = await supabase
          .from('quizzes')
          .select('id')
          .eq('course_id', courseId);
        const totalQuestions = totalQuestionsData?.length || 0;

        return {
          course_id: courseId,
          course_title: enrollment.courses?.title || 'Без назви',
          lessons_completed: lessonsCompleted,
          total_lessons: totalLessons,
          quiz_score: quizScore,
          total_questions: totalQuestions,
        };
      });

      const data = await Promise.all(progressPromises);
      setProgressData(data);
      setLoading(false);
    };
    fetchProgress();
  }, []);

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
        Мій прогрес
      </Typography>
      {progressData.length === 0 ? (
        <Typography>Прогрес відсутній.</Typography>
      ) : (
        progressData.map((course) => (
          <Card key={course.course_id} sx={{ mb: 3, p: 2 }}>
            <CardContent>
              <Typography variant="h6">{course.course_title}</Typography>
              <Typography>
                Завершені уроки: {course.lessons_completed} з{' '}
                {course.total_lessons}
              </Typography>
              <Typography>
                Результат квіза: {course.quiz_score} з {course.total_questions}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
