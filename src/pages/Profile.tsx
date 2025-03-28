import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  Avatar,
} from '@mui/material';
import { supabase } from '../supabase-config';

interface Enrollment {
  course_id: number;
  progress: number;
  courses: { title: string };
}

interface ProfileData {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [profile, setProfile] = useState<ProfileData>({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError('Помилка: Користувач не авторизований');
        navigate('/login');
        return;
      }
      setUser(userData.user);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, bio')
        .eq('user_id', userData.user.id)
        .single();
      if (!profileError && profileData) {
        setProfile(profileData);
      }

      const { data: enrollData, error: enrollError } = (await supabase
        .from('enrollments')
        .select(
          'course_id, progress, courses!enrollments_course_id_fkey (title)'
        )
        .eq('user_id', userData.user.id)) as {
        data: Enrollment[] | null;
        error: any;
      };
      if (enrollError) {
        setError(`Помилка завантаження курсів: ${enrollError.message}`);
      } else {
        setEnrollments(enrollData || []);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const handleSaveProfile = async () => {
    let avatarUrl = profile.avatar_url;

    if (avatarFile && user) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);
      if (uploadError) {
        setError(`Помилка завантаження аватара: ${uploadError.message}`);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      avatarUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(
        { user_id: user.id, ...profile, avatar_url: avatarUrl },
        { onConflict: 'user_id' }
      );
    if (error) {
      setError(`Помилка збереження профілю: ${error.message}`);
    } else {
      setProfile({ ...profile, avatar_url: avatarUrl });
      setAvatarFile(null);
      setEditMode(false);
    }
  };

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
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        maxWidth: 1200,
        mx: 'auto',
        width: '100%', // Обмежуємо ширину до контейнера
        overflowX: 'hidden', // Запобігаємо горизонтальному скролу
      }}
    >
      <Typography variant="h4" sx={{ mb: 2, color: '#1976d2' }}>
        Профіль
      </Typography>
      <Card sx={{ mb: 3, p: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' }, // Колонка на xs, рядок на sm+
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: 2,
              gap: 2,
            }}
          >
            <Avatar src={profile.avatar_url} sx={{ width: 64, height: 64 }} />
            {editMode ? (
              <Box sx={{ width: '100%', maxWidth: 400 }}>
                <TextField
                  label="Ім’я"
                  value={profile.first_name || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, first_name: e.target.value })
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Прізвище"
                  value={profile.last_name || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, last_name: e.target.value })
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Box sx={{ mb: 2 }}>
                  <Button variant="contained" component="label">
                    Завантажити аватар
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </Button>
                  {avatarFile && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Вибрано: {avatarFile.name}
                    </Typography>
                  )}
                </Box>
                <TextField
                  label="Біо"
                  value={profile.bio || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  fullWidth
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" onClick={handleSaveProfile}>
                    Зберегти
                  </Button>
                  <Button variant="outlined" onClick={() => setEditMode(false)}>
                    Скасувати
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6">
                  {profile.first_name} {profile.last_name}
                </Typography>
                <Typography>Email: {user?.email}</Typography>
                <Typography>Біо: {profile.bio || 'Немає опису'}</Typography>
                <Button
                  variant="contained"
                  onClick={() => setEditMode(true)}
                  sx={{ mt: 2 }}
                >
                  Редагувати
                </Button>
              </Box>
            )}
          </Box>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleLogout}
            sx={{ mt: 2 }}
          >
            Вийти
          </Button>
        </CardContent>
      </Card>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Мої курси
      </Typography>
      {enrollments.length === 0 ? (
        <Typography>Ви ще не записані на жоден курс.</Typography>
      ) : (
        enrollments.map((enrollment) => (
          <Card key={enrollment.course_id} sx={{ mb: 2, p: 2 }}>
            <CardContent>
              <Typography variant="h6">
                {enrollment.courses?.title || 'Без назви'}
              </Typography>
              <Typography>Прогрес: {enrollment.progress}%</Typography>
              <Button
                variant="outlined"
                color="primary"
                href={`/course/${enrollment.course_id}`}
                sx={{ mt: 1 }}
              >
                Перейти до курсу
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
