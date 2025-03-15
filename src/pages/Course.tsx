import { Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function Course() {
  const { id } = useParams(); // Отримуємо ID із URL
  return (
    <div>
      <Typography variant="h4">Course Details</Typography>
      <Typography variant="body1">
        This is the page for Course ID: {id}
      </Typography>
    </div>
  );
}
