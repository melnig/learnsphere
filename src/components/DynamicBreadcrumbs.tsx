import { useState, useEffect } from 'react';
import { Breadcrumbs, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase-config';

export default function DynamicBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const [courseTitle, setCourseTitle] = useState<string | null>(null);

  const breadcrumbNames: { [key: string]: string } = {
    '': 'Головна',
    'my-learning': 'Моє навчання',
    assessment: 'Оцінювання',
    progress: 'Прогрес',
    courses: 'Усі курси',
    settings: 'Налаштування',
    profile: 'Профіль',
  };

  useEffect(() => {
    if (pathnames[0] === 'course' && pathnames[1]) {
      const fetchCourseTitle = async () => {
        const { data, error } = await supabase
          .from('courses')
          .select('title')
          .eq('id', pathnames[1])
          .single();
        if (!error && data) {
          setCourseTitle(data.title);
        }
      };
      fetchCourseTitle();
    } else {
      setCourseTitle(null);
    }
  }, [location.pathname, pathnames]);

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      {pathnames.length === 0 ? (
        <Typography color="text.primary">Головна</Typography>
      ) : (
        <Link to="/" style={{ textDecoration: 'none', color: '#1976d2' }}>
          Головна
        </Link>
      )}
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        let displayName = breadcrumbNames[value] || value;

        // Якщо це курс, пропускаємо "course" і показуємо тільки назву
        if (pathnames[0] === 'course') {
          if (value === 'course') return null; // Пропускаємо "course"
          if (last && courseTitle) displayName = courseTitle; // Підставляємо назву курсу
        }

        return last ? (
          <Typography key={to} color="text.primary">
            {displayName}
          </Typography>
        ) : (
          <Link
            key={to}
            to={to}
            style={{ textDecoration: 'none', color: '#1976d2' }}
          >
            {displayName}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
