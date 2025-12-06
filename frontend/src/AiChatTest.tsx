// src/AiChatTest.tsx
import React, { useState } from 'react';

const AiChatTest: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [reply, setReply] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Access the environment variable
  const AI_URL = import.meta.env.VITE_AI_SERVICE_URL;

  const sendMessage = async () => {
    if (!input) return;
    setLoading(true);
    setReply('');

    try {
      const url = `${AI_URL}/chat/`;
      console.log(`🔵 Sending request to: ${url}`);
      console.log(`📨 Request body:`, { message: input });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }), 
      });

      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response headers:`, Object.fromEntries(response.headers));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Server error: ${response.status}`, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ AI Replied:", data);
      
      // Handle different possible response formats
      const aiText = data.response || data.answer || data.message || JSON.stringify(data);
      setReply(aiText);
      
    } catch (error: any) {
      console.error('❌ Full error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Stack:', error.stack);
      
      // More specific error messages
      if (error.message.includes('Failed to fetch')) {
        setReply('❌ Network error - AI service may be down or CORS blocked. Check console.');
      } else {
        setReply(`❌ Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 m-4 border-2 border-dashed border-blue-500 rounded bg-white text-black">
      <h3 className="text-xl font-bold mb-2">🤖 AI Connection Test</h3>
      <p className="text-sm text-gray-600 mb-4">Target: <code>{AI_URL}</code></p>
      
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI something..."
          className="flex-1 p-2 border rounded border-gray-300"
        />
        <button 
          onClick={sendMessage} 
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {reply && (
        <div className="bg-gray-100 p-3 rounded">
          <strong>AI says:</strong> {reply}
        </div>
      )}
    </div>
  );
};

export default AiChatTest;