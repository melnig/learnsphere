import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { supabase } from '../supabase-config';

export default function Course() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      setCourse(data);
    };
    fetchCourse();
  }, [id]);

  if (!course) return <Typography>Завантаження...</Typography>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4">{course.title}</Typography>
      <Typography>{course.description}</Typography>
      <img
        src={course.image_url}
        alt={course.title}
        style={{ maxWidth: '100%' }}
      />
    </Box>
  );
}
