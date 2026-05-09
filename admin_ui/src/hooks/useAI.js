import { useState } from 'react';

export async function callClaude(prompt) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch('/api/v1/admin/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error('AI endpoint not available');
  const data = await res.json();
  return data.response ?? data.message ?? JSON.stringify(data);
}

export function useAI() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function ask(prompt) {
    setLoading(true);
    setError(null);
    setMessages(m => [...m, { role: 'user', content: prompt }]);
    try {
      const reply = await callClaude(prompt);
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setMessages([]);
    setError(null);
  }

  return { messages, loading, error, ask, clear };
}
