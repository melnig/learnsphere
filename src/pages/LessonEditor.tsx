import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
} from '@mui/material';
import { supabase } from '../supabase-config';

interface Course {
  id: number;
  title: string;
}

export default function LessonEditor() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [codeExample, setCodeExample] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [lessonOrder, setLessonOrder] = useState(1);
  const [courseId, setCourseId] = useState<number | ''>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Завантаження курсів для вибору
  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title');
      if (!error && data) setCourses(data);
    };
    fetchCourses();
  }, []);

  const handleSave = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      setMessage('Увійдіть, щоб створювати уроки.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!courseId || !title || !content) {
      setMessage('Заповніть усі обов’язкові поля: курс, назва, зміст.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const { error } = await supabase.from('lessons').insert({
      course_id: courseId,
      title,
      content,
      code_example: codeExample || null,
      video_url: videoUrl || null,
      lesson_order: lessonOrder,
    });

    if (error) {
      setMessage(`Помилка збереження: ${error.message}`);
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage('Урок успішно збережено!');
      setTimeout(() => {
        setMessage(null);
        navigate(`/course/${courseId}`);
      }, 2000);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2, color: '#1976d2' }}>
        Редактор уроків
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Курс</InputLabel>
        <Select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value as number)}
          label="Курс"
        >
          {courses.map((course) => (
            <MenuItem key={course.id} value={course.id}>
              {course.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Назва уроку"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Зміст уроку"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        multiline
        rows={4}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Приклад коду"
        value={codeExample}
        onChange={(e) => setCodeExample(e.target.value)}
        multiline
        rows={6}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Посилання на відео"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Порядок уроку"
        type="number"
        value={lessonOrder}
        onChange={(e) => setLessonOrder(Number(e.target.value))}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        sx={{ mr: 2 }}
      >
        Зберегти урок
      </Button>
      <Button variant="outlined" color="secondary" onClick={() => navigate(-1)}>
        Назад
      </Button>
      {message && (
        <Alert
          severity={message.includes('Помилка') ? 'error' : 'success'}
          sx={{ mt: 2 }}
        >
          {message}
        </Alert>
      )}
    </Box>
  );
}
