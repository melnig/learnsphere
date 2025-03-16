import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Link,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { supabase } from '../supabase-config';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeIcon from '@mui/icons-material/Code';
import VideoIcon from '@mui/icons-material/Videocam';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Lesson {
  id: number;
  title: string;
  content: string;
  code_example?: string;
  video_url?: string;
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .eq('course_id', courseId)
        .single();
      if (!error && data) setLesson(data);

      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', session.session.user.id)
          .eq('course_id', courseId)
          .single();
        setIsEnrolled(!!enrollment);

        const { data: progress } = await supabase
          .from('user_lesson_progress')
          .select('completed')
          .eq('user_id', session.session.user.id)
          .eq('lesson_id', lessonId)
          .single();
        setIsCompleted(progress?.completed || false);
      }
    };
    fetchLesson();
  }, [courseId, lessonId]);

  const handleCompleteLesson = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    await supabase
      .from('user_lesson_progress')
      .upsert({
        user_id: session.session.user.id,
        lesson_id: lessonId,
        completed: true,
      });
    setIsCompleted(true);
  };

  if (!lesson) return <Typography>Завантаження...</Typography>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/course/${courseId}`)}
        sx={{ mb: 2 }}
      >
        Назад до курсу
      </Button>
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h4" sx={{ color: '#1976d2', mb: 2 }}>
            {lesson.title}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography sx={{ mb: 2 }}>{lesson.content}</Typography>
          {lesson.code_example && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
              >
                <CodeIcon sx={{ mr: 1, color: '#1976d2' }} /> Приклад коду
              </Typography>
              <SyntaxHighlighter
                language="javascript"
                style={dark}
                customStyle={{ padding: '1rem', borderRadius: '4px' }}
              >
                {lesson.code_example}
              </SyntaxHighlighter>
            </Box>
          )}
          {lesson.video_url && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
              >
                <VideoIcon sx={{ mr: 1, color: '#1976d2' }} /> Відео
              </Typography>
              <Link
                href={lesson.video_url}
                target="_blank"
                rel="noopener"
                sx={{ color: '#1976d2' }}
              >
                Переглянути відео
              </Link>
            </Box>
          )}
          {isEnrolled ? (
            isCompleted ? (
              <Typography sx={{ color: 'green', fontWeight: 'bold', mt: 2 }}>
                Урок виконано
              </Typography>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleCompleteLesson}
                sx={{ mt: 2 }}
              >
                Урок виконано
              </Button>
            )
          ) : (
            <Typography sx={{ mt: 2, color: 'gray' }}>
              Запишіться на курс, щоб завершувати уроки
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
