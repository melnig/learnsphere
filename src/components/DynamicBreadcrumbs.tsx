import { Breadcrumbs, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

export default function DynamicBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbNames: { [key: string]: string } = {
    '': 'Головна',
    'my-learning': 'Моє навчання',
    assessment: 'Оцінювання',
    progress: 'Прогрес',
    courses: 'Курси',
    settings: 'Налаштування',
    profile: 'Профіль',
    course: 'Курс',
  };

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
        const displayName = breadcrumbNames[value] || value;

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
