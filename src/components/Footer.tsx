import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1976d2', // Такий же колір, як у хедера
        color: 'white',
        py: 2, // Відступи зверху й знизу
        mt: 'auto', // Притискаємо донизу, якщо в flex-контейнері
        textAlign: 'center',
        width: '100%',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)', // Тінь для глибини
      }}
    >
      <Box>
        <Typography variant="body2">
          © {new Date().getFullYear()} LearnSphere. Усі права захищено.
        </Typography>
      </Box>
    </Box>
  );
}
