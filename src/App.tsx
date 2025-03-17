import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { supabase } from './supabase-config';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Course from './pages/Course';
import MyLearning from './pages/MyLearning';
import Assessment from './pages/Assessment';
import Progress from './pages/Progress';
import Courses from './pages/Courses';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import DashboardLayout from './components/DashboardLayout';
import LessonEditor from './pages/LessonEditor';
import LessonPage from './pages/LessonPage';

function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const fetchTheme = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData?.user) {
        setThemeMode('light'); // За замовчуванням, якщо користувач не авторизований
        return;
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('theme')
        .eq('user_id', userData.user.id)
        .single();
      const userTheme = profileData?.theme || 'system';
      if (userTheme === 'system') {
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        setThemeMode(prefersDark ? 'dark' : 'light');
      } else {
        setThemeMode(userTheme);
      }
    };
    fetchTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = async (e: MediaQueryListEvent) => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData?.user) return;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('theme')
        .eq('user_id', userData.user.id)
        .single();
      if (profileData?.theme === 'system') {
        setThemeMode(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const theme = createTheme({
    palette: {
      mode: themeMode,
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Landing />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <DashboardLayout>
                <Home />
              </DashboardLayout>
            }
          />
          <Route
            path="/course/:id"
            element={
              <DashboardLayout>
                <Course />
              </DashboardLayout>
            }
          />
          <Route
            path="/my-learning"
            element={
              <DashboardLayout>
                <MyLearning />
              </DashboardLayout>
            }
          />
          <Route
            path="/assessment"
            element={
              <DashboardLayout>
                <Assessment />
              </DashboardLayout>
            }
          />
          <Route
            path="/progress"
            element={
              <DashboardLayout>
                <Progress />
              </DashboardLayout>
            }
          />
          <Route
            path="/courses"
            element={
              <DashboardLayout>
                <Courses />
              </DashboardLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            }
          />
          <Route path="/admin/lesson-editor" element={<LessonEditor />} />
          <Route
            path="/course/:courseId/lesson/:lessonId"
            element={<LessonPage />}
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
