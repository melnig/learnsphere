import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TableSortLabel,
  DialogContentText,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { supabase, supabaseAdmin } from '../supabase-config';
import { User } from '@supabase/supabase-js';

interface Course {
  id: number;
  title: string;
  description: string;
  image_url: string;
  duration: string;
  is_featured: boolean;
}

interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content: string;
  lesson_order: number;
  code_example?: string;
  video_url?: string;
}

interface QuizQuestion {
  id: number;
  course_id: number;
  question: string;
  options: { options: string[] };
  correct_answer: number;
}

interface AppUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  total_progress: number;
  course_progress?: { course_title: string; progress: number }[];
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const [openLessonDialog, setOpenLessonDialog] = useState(false);
  const [openQuizDialog, setOpenQuizDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    type: string;
    id: number | string;
  } | null>(null);
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    image_url: '',
    duration: '',
    is_featured: false,
  });
  const [newLesson, setNewLesson] = useState({
    course_id: 0,
    title: '',
    content: '',
    lesson_order: 1,
    code_example: '',
    video_url: '',
  });
  const [newQuizQuestion, setNewQuizQuestion] = useState({
    course_id: 0,
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
  });
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [editQuizQuestion, setEditQuizQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  // Стани для сортування та фільтрації
  const [courseSort, setCourseSort] = useState<{
    field: keyof Course;
    direction: 'asc' | 'desc';
  }>({ field: 'title', direction: 'asc' });
  const [lessonSort, setLessonSort] = useState<{
    field: keyof Lesson;
    direction: 'asc' | 'desc';
  }>({ field: 'lesson_order', direction: 'asc' });
  const [quizSort, setQuizSort] = useState<{
    field: keyof QuizQuestion;
    direction: 'asc' | 'desc';
  }>({ field: 'question', direction: 'asc' });
  const [userSort, setUserSort] = useState<{
    field: keyof AppUser;
    direction: 'asc' | 'desc';
  }>({ field: 'email', direction: 'asc' });
  const [courseFilter, setCourseFilter] = useState('');
  const [lessonFilter, setLessonFilter] = useState('');
  const [quizFilter, setQuizFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError('Помилка: Користувач не авторизований');
        navigate('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userData.user.id)
        .single();
      if (profileError || !profileData || profileData.role !== 'admin') {
        setError('Доступ заборонено: Ви не адміністратор');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchCourses();
      fetchUsers();
    };

    const fetchCourses = async () => {
      const { data, error } = await supabase.from('courses').select('*');
      if (error) {
        setError(`Помилка завантаження курсів: ${error.message}`);
      } else {
        setCourses(data || []);
      }
      setLoading(false);
    };

    const loadLessons = async () => {
      if (selectedCourseId) {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', selectedCourseId);
        if (error) {
          setError(`Помилка завантаження уроків: ${error.message}`);
        } else {
          setLessons(data || []);
        }
      }
    };

    const loadQuizQuestions = async () => {
      if (selectedCourseId) {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('course_id', selectedCourseId);
        if (error) {
          setError(`Помилка завантаження квіза: ${error.message}`);
        } else {
          setQuizQuestions(data || []);
        }
      }
    };

    const fetchUsers = async () => {
      const { data, error: usersError } =
        await supabaseAdmin.auth.admin.listUsers();
      if (usersError) {
        setError(`Помилка завантаження користувачів: ${usersError.message}`);
        return;
      }

      const usersWithDetails = await Promise.all(
        (data?.users || []).map(async (user: User) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', user.id)
            .single();

          const { data: enrollData } = await supabase
            .from('enrollments')
            .select('progress, course_id')
            .eq('user_id', user.id);

          const totalProgress =
            enrollData && enrollData.length > 0
              ? Math.round(
                  enrollData.reduce(
                    (sum: number, e: { progress: number }) => sum + e.progress,
                    0
                  ) / enrollData.length
                )
              : 0;

          // Отримуємо назви курсів для детального прогресу
          const courseProgress = await Promise.all(
            (enrollData || []).map(
              async (enroll: { course_id: number; progress: number }) => {
                const { data: courseData } = await supabase
                  .from('courses')
                  .select('title')
                  .eq('id', enroll.course_id)
                  .single();
                return {
                  course_title: courseData?.title || 'Невідомий курс',
                  progress: enroll.progress,
                };
              }
            )
          );

          return {
            id: user.id,
            email: user.email || '',
            first_name: profileData?.first_name,
            last_name: profileData?.last_name,
            total_progress: totalProgress,
            course_progress: courseProgress,
          };
        })
      );
      setUsers(usersWithDetails);
    };

    checkAdminRole();
    loadLessons();
    loadQuizQuestions();
  }, [navigate, selectedCourseId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedCourseId(null);
    setCourseFilter('');
    setLessonFilter('');
    setQuizFilter('');
    setUserFilter('');
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  // Функції для сортування
  const handleSort = <T,>(
    field: keyof T,
    sortState: { field: keyof T; direction: 'asc' | 'desc' },
    setSortState: (sort: { field: keyof T; direction: 'asc' | 'desc' }) => void
  ) => {
    const direction =
      sortState.field === field && sortState.direction === 'asc'
        ? 'desc'
        : 'asc';
    setSortState({ field, direction });
  };

  const sortData = <T,>(
    data: T[],
    sortState: { field: keyof T; direction: 'asc' | 'desc' }
  ) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortState.field];
      const bValue = b[sortState.field];
      if (aValue < bValue) return sortState.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortState.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Функції для фільтрації
  const filterData = <T,>(data: T[], filter: string, fields: (keyof T)[]) => {
    if (!filter) return data;
    return data.filter((item) =>
      fields.some((field) => {
        const value = item[field];
        return (
          typeof value === 'string' &&
          value.toLowerCase().includes(filter.toLowerCase())
        );
      })
    );
  };

  // Підтвердження видалення
  const handleOpenDeleteDialog = (type: string, id: number | string) => {
    setDeleteItem({ type, id });
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeleteItem(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    const { type, id } = deleteItem;

    if (type === 'course') {
      await handleDeleteCourse(Number(id));
    } else if (type === 'lesson') {
      await handleDeleteLesson(Number(id));
    } else if (type === 'quiz') {
      await handleDeleteQuizQuestion(Number(id));
    } else if (type === 'user') {
      await handleDeleteUser(String(id));
    }

    handleCloseDeleteDialog();
  };

  // Детальний перегляд прогресу
  const handleOpenProgressDialog = (user: AppUser) => {
    setSelectedUser(user);
    setOpenProgressDialog(true);
  };

  const handleCloseProgressDialog = () => {
    setOpenProgressDialog(false);
    setSelectedUser(null);
  };

  // Курси
  const handleOpenCourseDialog = () => {
    setNewCourse({
      title: '',
      description: '',
      image_url: '',
      duration: '',
      is_featured: false,
    });
    setImageFile(null);
    setEditCourse(null);
    setOpenCourseDialog(true);
  };

  const handleCloseCourseDialog = () => {
    setOpenCourseDialog(false);
    setEditCourse(null);
    setImageFile(null);
  };

  const handleCreateCourse = async () => {
    let imageUrl = newCourse.image_url;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('course-images')
        .upload(fileName, imageFile);
      if (uploadError) {
        setError(`Помилка завантаження зображення: ${uploadError.message}`);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from('course-images')
        .getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const courseData = { ...newCourse, image_url: imageUrl };
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select();
    if (error) {
      setError(`Помилка створення курсу: ${error.message}`);
    } else if (data) {
      setCourses([...courses, data[0]]);
      handleCloseCourseDialog();
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditCourse(course);
    setNewCourse({
      title: course.title,
      description: course.description,
      image_url: course.image_url,
      duration: course.duration,
      is_featured: course.is_featured,
    });
    setImageFile(null);
    setOpenCourseDialog(true);
  };

  const handleUpdateCourse = async () => {
    if (!editCourse) return;
    let imageUrl = newCourse.image_url;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('course-images')
        .upload(fileName, imageFile);
      if (uploadError) {
        setError(`Помилка завантаження зображення: ${uploadError.message}`);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from('course-images')
        .getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const courseData = { ...newCourse, image_url: imageUrl };
    const { error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', editCourse.id);
    if (error) {
      setError(`Помилка оновлення курсу: ${error.message}`);
    } else {
      setCourses(
        courses.map((course) =>
          course.id === editCourse.id ? { ...course, ...courseData } : course
        )
      );
      handleCloseCourseDialog();
    }
  };

  const handleDeleteCourse = async (id: number) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) {
      setError(`Помилка видалення курсу: ${error.message}`);
    } else {
      setCourses(courses.filter((course) => course.id !== id));
    }
  };

  // Уроки
  const handleOpenLessonDialog = () => {
    setNewLesson({
      course_id: selectedCourseId || 0,
      title: '',
      content: '',
      lesson_order: 1,
      code_example: '',
      video_url: '',
    });
    setEditLesson(null);
    setOpenLessonDialog(true);
  };

  const handleCloseLessonDialog = () => {
    setOpenLessonDialog(false);
    setEditLesson(null);
  };

  const handleCreateLesson = async () => {
    const { data, error } = await supabase
      .from('lessons')
      .insert([newLesson])
      .select();
    if (error) {
      setError(`Помилка створення уроку: ${error.message}`);
    } else if (data) {
      setLessons([...lessons, data[0]]);
      handleCloseLessonDialog();
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditLesson(lesson);
    setNewLesson({
      course_id: lesson.course_id,
      title: lesson.title,
      content: lesson.content,
      lesson_order: lesson.lesson_order,
      code_example: lesson.code_example || '',
      video_url: lesson.video_url || '',
    });
    setOpenLessonDialog(true);
  };

  const handleUpdateLesson = async () => {
    if (!editLesson) return;
    const { error } = await supabase
      .from('lessons')
      .update(newLesson)
      .eq('id', editLesson.id);
    if (error) {
      setError(`Помилка оновлення уроку: ${error.message}`);
    } else {
      setLessons(
        lessons.map((lesson) =>
          lesson.id === editLesson.id ? { ...lesson, ...newLesson } : lesson
        )
      );
      handleCloseLessonDialog();
    }
  };

  const handleDeleteLesson = async (id: number) => {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) {
      setError(`Помилка видалення уроку: ${error.message}`);
    } else {
      setLessons(lessons.filter((lesson) => lesson.id !== id));
    }
  };

  // Квізи
  const handleOpenQuizDialog = () => {
    setNewQuizQuestion({
      course_id: selectedCourseId || 0,
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
    });
    setEditQuizQuestion(null);
    setOpenQuizDialog(true);
  };

  const handleCloseQuizDialog = () => {
    setOpenQuizDialog(false);
    setEditQuizQuestion(null);
  };

  const handleCreateQuizQuestion = async () => {
    const questionData = {
      course_id: newQuizQuestion.course_id,
      question: newQuizQuestion.question,
      options: { options: newQuizQuestion.options },
      correct_answer: newQuizQuestion.correct_answer,
    };
    const { data, error } = await supabase
      .from('quizzes')
      .insert([questionData])
      .select();
    if (error) {
      setError(`Помилка створення питання: ${error.message}`);
    } else if (data) {
      setQuizQuestions([...quizQuestions, data[0]]);
      handleCloseQuizDialog();
    }
  };

  const handleEditQuizQuestion = (question: QuizQuestion) => {
    setEditQuizQuestion(question);
    setNewQuizQuestion({
      course_id: question.course_id,
      question: question.question,
      options: question.options.options,
      correct_answer: question.correct_answer,
    });
    setOpenQuizDialog(true);
  };

  const handleUpdateQuizQuestion = async () => {
    if (!editQuizQuestion) return;
    const questionData = {
      course_id: newQuizQuestion.course_id,
      question: newQuizQuestion.question,
      options: { options: newQuizQuestion.options },
      correct_answer: newQuizQuestion.correct_answer,
    };
    const { error } = await supabase
      .from('quizzes')
      .update(questionData)
      .eq('id', editQuizQuestion.id);
    if (error) {
      setError(`Помилка оновлення питання: ${error.message}`);
    } else {
      setQuizQuestions(
        quizQuestions.map((q) =>
          q.id === editQuizQuestion.id ? { ...q, ...questionData } : q
        )
      );
      handleCloseQuizDialog();
    }
  };

  const handleDeleteQuizQuestion = async (id: number) => {
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) {
      setError(`Помилка видалення питання: ${error.message}`);
    } else {
      setQuizQuestions(quizQuestions.filter((q) => q.id !== id));
    }
  };

  // Користувачі
  const handleDeleteUser = async (id: string) => {
    await supabase.from('enrollments').delete().eq('user_id', id);
    await supabase.from('user_lesson_progress').delete().eq('user_id', id);
    await supabase.from('quiz_answers').delete().eq('user_id', id);
    await supabase.from('profiles').delete().eq('user_id', id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      setError(`Помилка видалення користувача: ${error.message}`);
    } else {
      setUsers(users.filter((user) => user.id !== id));
    }
  };

  if (loading) {
    return <Typography>Завантаження...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!isAdmin) {
    return null;
  }

  // Фільтровані та відсортовані дані
  const filteredCourses = filterData(courses, courseFilter, [
    'title',
    'description',
  ]);
  const sortedCourses = sortData(filteredCourses, courseSort);

  const filteredLessons = filterData(lessons, lessonFilter, ['title']);
  const sortedLessons = sortData(filteredLessons, lessonSort);

  const filteredQuizQuestions = filterData(quizQuestions, quizFilter, [
    'question',
  ]);
  const sortedQuizQuestions = sortData(filteredQuizQuestions, quizSort);

  const filteredUsers = filterData(users, userFilter, [
    'email',
    'first_name',
    'last_name',
  ]);
  const sortedUsers = sortData(filteredUsers, userSort);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ color: '#1976d2' }}>
          Адмін-панель
        </Typography>
      </Box>
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Курси" />
        <Tab label="Уроки" />
        <Tab label="Квізи" />
        <Tab label="Користувачі" />
      </Tabs>

      {/* Курси */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenCourseDialog}
            >
              Додати курс
            </Button>
            <TextField
              label="Пошук курсів"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={courseSort.field === 'title'}
                      direction={
                        courseSort.field === 'title'
                          ? courseSort.direction
                          : 'asc'
                      }
                      onClick={() =>
                        handleSort('title', courseSort, setCourseSort)
                      }
                    >
                      Назва
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={courseSort.field === 'description'}
                      direction={
                        courseSort.field === 'description'
                          ? courseSort.direction
                          : 'asc'
                      }
                      onClick={() =>
                        handleSort('description', courseSort, setCourseSort)
                      }
                    >
                      Опис
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={courseSort.field === 'duration'}
                      direction={
                        courseSort.field === 'duration'
                          ? courseSort.direction
                          : 'asc'
                      }
                      onClick={() =>
                        handleSort('duration', courseSort, setCourseSort)
                      }
                    >
                      Тривалість
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={courseSort.field === 'is_featured'}
                      direction={
                        courseSort.field === 'is_featured'
                          ? courseSort.direction
                          : 'asc'
                      }
                      onClick={() =>
                        handleSort('is_featured', courseSort, setCourseSort)
                      }
                    >
                      Рекомендований
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{course.description.slice(0, 50)}...</TableCell>
                    <TableCell>{course.duration}</TableCell>
                    <TableCell>{course.is_featured ? 'Так' : 'Ні'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditCourse(course)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() =>
                          handleOpenDeleteDialog('course', course.id)
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Уроки */}
      {tabValue === 1 && (
        <Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Виберіть курс</InputLabel>
            <Select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            >
              <MenuItem value="">Оберіть курс</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedCourseId && (
            <>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenLessonDialog}
                >
                  Додати урок
                </Button>
                <TextField
                  label="Пошук уроків"
                  value={lessonFilter}
                  onChange={(e) => setLessonFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 300 }}
                />
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={lessonSort.field === 'title'}
                          direction={
                            lessonSort.field === 'title'
                              ? lessonSort.direction
                              : 'asc'
                          }
                          onClick={() =>
                            handleSort('title', lessonSort, setLessonSort)
                          }
                        >
                          Назва
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={lessonSort.field === 'lesson_order'}
                          direction={
                            lessonSort.field === 'lesson_order'
                              ? lessonSort.direction
                              : 'asc'
                          }
                          onClick={() =>
                            handleSort(
                              'lesson_order',
                              lessonSort,
                              setLessonSort
                            )
                          }
                        >
                          Порядок
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Дії</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedLessons.map((lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell>{lesson.title}</TableCell>
                        <TableCell>{lesson.lesson_order}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEditLesson(lesson)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              handleOpenDeleteDialog('lesson', lesson.id)
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      )}

      {/* Квізи */}
      {tabValue === 2 && (
        <Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Виберіть курс</InputLabel>
            <Select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            >
              <MenuItem value="">Оберіть курс</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedCourseId && (
            <>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenQuizDialog}
                >
                  Додати питання
                </Button>
                <TextField
                  label="Пошук питань"
                  value={quizFilter}
                  onChange={(e) => setQuizFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 300 }}
                />
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={quizSort.field === 'question'}
                          direction={
                            quizSort.field === 'question'
                              ? quizSort.direction
                              : 'asc'
                          }
                          onClick={() =>
                            handleSort('question', quizSort, setQuizSort)
                          }
                        >
                          Питання
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Правильна відповідь</TableCell>
                      <TableCell>Дії</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedQuizQuestions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell>{question.question}</TableCell>
                        <TableCell>
                          {question.options.options[question.correct_answer]}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleEditQuizQuestion(question)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              handleOpenDeleteDialog('quiz', question.id)
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      )}

      {/* Користувачі */}
      {tabValue === 3 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <TextField
              label="Пошук користувачів"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={userSort.field === 'email'}
                      direction={
                        userSort.field === 'email' ? userSort.direction : 'asc'
                      }
                      onClick={() => handleSort('email', userSort, setUserSort)}
                    >
                      Email
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={userSort.field === 'first_name'}
                      direction={
                        userSort.field === 'first_name'
                          ? userSort.direction
                          : 'asc'
                      }
                      onClick={() =>
                        handleSort('first_name', userSort, setUserSort)
                      }
                    >
                      Ім'я
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={userSort.field === 'total_progress'}
                      direction={
                        userSort.field === 'total_progress'
                          ? userSort.direction
                          : 'asc'
                      }
                      onClick={() =>
                        handleSort('total_progress', userSort, setUserSort)
                      }
                    >
                      Прогрес
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.total_progress}%</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleOpenProgressDialog(user)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleOpenDeleteDialog('user', user.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Діалог для створення/редагування курсу */}
      <Dialog open={openCourseDialog} onClose={handleCloseCourseDialog}>
        <DialogTitle>
          {editCourse ? 'Редагувати курс' : 'Додати курс'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Назва"
            value={newCourse.title}
            onChange={(e) =>
              setNewCourse({ ...newCourse, title: e.target.value })
            }
            fullWidth
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Опис"
            value={newCourse.description}
            onChange={(e) =>
              setNewCourse({ ...newCourse, description: e.target.value })
            }
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <Button variant="contained" component="label">
              Завантажити зображення
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            {imageFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Вибрано: {imageFile.name}
              </Typography>
            )}
            {editCourse && !imageFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Поточне зображення: {editCourse.image_url}
              </Typography>
            )}
          </Box>
          <TextField
            label="Тривалість"
            value={newCourse.duration}
            onChange={(e) =>
              setNewCourse({ ...newCourse, duration: e.target.value })
            }
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <input
                type="checkbox"
                checked={newCourse.is_featured}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, is_featured: e.target.checked })
                }
              />
            }
            label="Рекомендований курс"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCourseDialog}>Скасувати</Button>
          <Button
            onClick={editCourse ? handleUpdateCourse : handleCreateCourse}
            variant="contained"
            color="primary"
          >
            {editCourse ? 'Оновити' : 'Створити'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог для створення/редагування уроку */}
      <Dialog open={openLessonDialog} onClose={handleCloseLessonDialog}>
        <DialogTitle>
          {editLesson ? 'Редагувати урок' : 'Додати урок'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Назва"
            value={newLesson.title}
            onChange={(e) =>
              setNewLesson({ ...newLesson, title: e.target.value })
            }
            fullWidth
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Вміст"
            value={newLesson.content}
            onChange={(e) =>
              setNewLesson({ ...newLesson, content: e.target.value })
            }
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Порядок уроку"
            type="number"
            value={newLesson.lesson_order}
            onChange={(e) =>
              setNewLesson({
                ...newLesson,
                lesson_order: Number(e.target.value),
              })
            }
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Приклад коду (опціонально)"
            value={newLesson.code_example}
            onChange={(e) =>
              setNewLesson({ ...newLesson, code_example: e.target.value })
            }
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <TextField
            label="URL відео (опціонально)"
            value={newLesson.video_url}
            onChange={(e) =>
              setNewLesson({ ...newLesson, video_url: e.target.value })
            }
            fullWidth
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLessonDialog}>Скасувати</Button>
          <Button
            onClick={editLesson ? handleUpdateLesson : handleCreateLesson}
            variant="contained"
            color="primary"
          >
            {editLesson ? 'Оновити' : 'Створити'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог для створення/редагування питання квіза */}
      <Dialog open={openQuizDialog} onClose={handleCloseQuizDialog}>
        <DialogTitle>
          {editQuizQuestion ? 'Редагувати питання' : 'Додати питання'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Питання"
            value={newQuizQuestion.question}
            onChange={(e) =>
              setNewQuizQuestion({
                ...newQuizQuestion,
                question: e.target.value,
              })
            }
            fullWidth
            sx={{ mb: 2, mt: 1 }}
          />
          {newQuizQuestion.options.map((option, index) => (
            <TextField
              key={index}
              label={`Варіант ${index + 1}`}
              value={option}
              onChange={(e) => {
                const newOptions = [...newQuizQuestion.options];
                newOptions[index] = e.target.value;
                setNewQuizQuestion({ ...newQuizQuestion, options: newOptions });
              }}
              fullWidth
              sx={{ mb: 2 }}
            />
          ))}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Правильна відповідь</InputLabel>
            <Select
              value={newQuizQuestion.correct_answer}
              onChange={(e) =>
                setNewQuizQuestion({
                  ...newQuizQuestion,
                  correct_answer: Number(e.target.value),
                })
              }
            >
              {newQuizQuestion.options.map((_, index) => (
                <MenuItem key={index} value={index}>
                  Варіант {index + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuizDialog}>Скасувати</Button>
          <Button
            onClick={
              editQuizQuestion
                ? handleUpdateQuizQuestion
                : handleCreateQuizQuestion
            }
            variant="contained"
            color="primary"
          >
            {editQuizQuestion ? 'Оновити' : 'Створити'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог підтвердження видалення */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ви впевнені, що хочете видалити{' '}
            {deleteItem?.type === 'course'
              ? 'цей курс'
              : deleteItem?.type === 'lesson'
              ? 'цей урок'
              : deleteItem?.type === 'quiz'
              ? 'це питання'
              : 'цього користувача'}
            ? Цю дію неможливо скасувати.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Скасувати</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Видалити
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог детального прогресу користувача */}
      <Dialog open={openProgressDialog} onClose={handleCloseProgressDialog}>
        <DialogTitle>Прогрес користувача: {selectedUser?.email}</DialogTitle>
        <DialogContent>
          <Typography variant="h6">
            Загальний прогрес: {selectedUser?.total_progress}%
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Прогрес по курсах:
          </Typography>
          {selectedUser?.course_progress &&
          selectedUser.course_progress.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Курс</TableCell>
                    <TableCell>Прогрес</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedUser.course_progress.map((progress, index) => (
                    <TableRow key={index}>
                      <TableCell>{progress.course_title}</TableCell>
                      <TableCell>{progress.progress}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>Немає даних про прогрес.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProgressDialog}>Закрити</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
