import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
} from '@mui/material';
import { supabase } from '../supabase-config';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
}

interface QuizProps {
  courseId: number;
  onComplete: (score: number) => void;
}

export default function Quiz({ courseId, onComplete }: QuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    const fetchQuizData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError('Помилка: Користувач не авторизований');
        return;
      }

      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId);
      if (quizError) {
        setError(`Помилка завантаження питань: ${quizError.message}`);
        return;
      }
      const allQuestions = quizData.map((q: any) => ({
        ...q,
        options: q.options.options,
      }));
      setTotalQuestions(allQuestions.length);

      const { data: answersData, error: answersError } = await supabase
        .from('quiz_answers')
        .select('question_id, is_correct')
        .eq('user_id', userData.user.id)
        .eq('course_id', courseId);
      if (answersError) {
        setError(`Помилка завантаження відповідей: ${answersError.message}`);
        return;
      }

      const answeredIds = answersData?.map((a) => a.question_id) || [];
      const initialScore = answersData?.filter((a) => a.is_correct).length || 0;
      const unansweredQuestions = allQuestions.filter(
        (q) => !answeredIds.includes(q.id)
      );

      setQuestions(
        unansweredQuestions.length > 0 ? unansweredQuestions : allQuestions
      );
      setScore(initialScore);
      setCurrentQuestion(0);
    };
    fetchQuizData();
  }, [courseId]);

  const updateProgress = useCallback(
    async (currentScore: number) => {
      const { data: session } = await supabase.auth.getSession();
      if (session) {
        const progress = Math.round((currentScore * 100) / totalQuestions);
        await supabase
          .from('enrollments')
          .update({ progress })
          .eq('user_id', session.session?.user.id)
          .eq('course_id', courseId);
      }
    },
    [courseId, totalQuestions]
  ); // Залежності updateProgress

  const handleAnswer = useCallback(async () => {
    if (selectedAnswer === null) return;

    const isCorrect =
      selectedAnswer === questions[currentQuestion].correct_answer;
    const newScore = isCorrect ? score + 1 : score;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError('Помилка: Користувач не авторизований');
      return;
    }

    const answerData = {
      user_id: userData.user.id,
      course_id: courseId,
      question_id: questions[currentQuestion].id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    };

    const { error: insertError } = await supabase
      .from('quiz_answers')
      .insert(answerData);
    if (insertError) {
      setError(`Помилка збереження відповіді: ${insertError.message}`);
      return;
    }

    setScore(newScore);
    await updateProgress(newScore);

    setSelectedAnswer(null);
    setTimeLeft(60);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setFinished(true);
      const finalScore = Math.round((newScore * 100) / totalQuestions);
      onComplete(finalScore);
    }
  }, [
    selectedAnswer,
    questions,
    currentQuestion,
    score,
    courseId,
    totalQuestions,
    onComplete,
    updateProgress, // Додаємо updateProgress
  ]);

  useEffect(() => {
    if (timeLeft > 0 && !finished) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleAnswer();
    }
  }, [timeLeft, finished, handleAnswer]);

  if (questions.length === 0) {
    return (
      <Typography>Питання завантажуються або тест завершено...</Typography>
    );
  }

  if (finished) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5">Тест завершено!</Typography>
        <Typography>
          Ваш результат: {score} з {totalQuestions}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">
        Питання {currentQuestion + 1} з {questions.length}
      </Typography>
      <Typography>Час залишилось: {timeLeft} сек</Typography>
      <Typography sx={{ mt: 2 }}>
        {questions[currentQuestion].question}
      </Typography>
      <FormControl component="fieldset" sx={{ mt: 2 }}>
        <RadioGroup
          value={selectedAnswer === null ? '' : selectedAnswer}
          onChange={(e) => setSelectedAnswer(Number(e.target.value))}
        >
          {questions[currentQuestion].options.map((option, index) => (
            <FormControlLabel
              key={index}
              value={index}
              control={<Radio />}
              label={option}
            />
          ))}
        </RadioGroup>
      </FormControl>
      <Button
        variant="contained"
        onClick={handleAnswer}
        disabled={selectedAnswer === null}
        sx={{ mt: 2 }}
      >
        {currentQuestion + 1 === questions.length ? 'Завершити' : 'Наступне'}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
