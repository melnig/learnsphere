import React from 'react';
import logo from './logo.svg';
import { supabase } from './supabase-config';
import './App.css';

function App() {
  const testSupabase = async () => {
    const { data, error } = await supabase
      .from('test_table')
      .insert([{ name: 'Test Entry' }])
      .select(); // Додаємо .select(), щоб повернути вставлені дані
    console.log('Data:', data, 'Error:', error);
  };

  return (
    <div>
      <h1>LearnSphere</h1>
      <button onClick={testSupabase}>Test Supabase</button>
    </div>
  );
}

export default App;
