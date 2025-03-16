import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
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

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId);
      if (!error && data) {
        setQuestions(
          data.map((q: any) => ({
            ...q,
            options: q.options.options,
          }))
        );
      }
    };
    fetchQuestions();
  }, [courseId]);

  const handleAnswer = () => {
    if (selectedAnswer === questions[currentQuestion].correct_answer) {
      setScore(score + 1);
    }
    setSelectedAnswer(null);
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setFinished(true);
      onComplete(Math.round(((score + 1) * 100) / questions.length));
    }
  };

  if (questions.length === 0) {
    return <Typography>Питання завантажуються...</Typography>;
  }

  if (finished) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5">Тест завершено!</Typography>
        <Typography>
          Ваш результат: {score} з {questions.length}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">
        Питання {currentQuestion + 1} з {questions.length}
      </Typography>
      <Typography sx={{ mt: 2 }}>
        {questions[currentQuestion].question}
      </Typography>
      <FormControl component="fieldset" sx={{ mt: 2 }}>
        <RadioGroup
          value={selectedAnswer}
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
        Наступне
      </Button>
    </Box>
  );
}
