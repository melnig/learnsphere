import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phiyeinfnmmrtomtqila.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoaXllaW5mbm1tcnRvbXRxaWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDc3MTAsImV4cCI6MjA1NzYyMzcxMH0.HLQXXyCxtLPqHgfQelEZsbYVTLqI4NgKvQ2IYtS43Qs'; // Встав свій Anon Key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
