import { useState, useRef, useEffect } from 'react';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your chatbot assistant. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (autoScroll) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isLoading, autoScroll]);

  // Apply dark mode styles
  useEffect(() => {
    if (darkMode) {
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
    } else {
      document.body.style.backgroundColor = '#f5f5f5';
      document.body.style.color = '#000000';
    }
  }, [darkMode]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error || 'Something went wrong'}`
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      height: '500px',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: darkMode ? '#2d2d2d' : 'white',
      borderRadius: darkMode ? '10px' : '0',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
          borderRadius: '5px',
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: darkMode ? '#3a3a3a' : '#fafafa',
          color: darkMode ? '#ffffff' : '#000000',
          scrollBehavior: 'smooth'
        }}
      >
        {messages.map((message, index) => (
          <div key={index} style={{
            marginBottom: '15px',
            textAlign: message.role === 'user' ? 'right' : 'left'
          }}>
            <div style={{
              display: 'inline-block',
              maxWidth: '70%',
              padding: '10px 15px',
              borderRadius: '15px',
              backgroundColor: message.role === 'user'
                ? (darkMode ? '#0051cc' : '#0070f3')
                : (darkMode ? '#555' : '#e3e3e3'),
              color: message.role === 'user' ? 'white' : (darkMode ? '#ffffff' : 'black')
            }}>
              <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong> {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ textAlign: 'left' }}>
            <div style={{
              display: 'inline-block',
              padding: '10px 15px',
              borderRadius: '15px',
              backgroundColor: darkMode ? '#555' : '#e3e3e3',
              color: darkMode ? '#ffffff' : 'black'
            }}>
              <strong>Assistant:</strong> <em>Thinking...</em>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} style={{
        display: 'flex',
        gap: '10px'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '12px 15px',
            border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
            borderRadius: '25px',
            outline: 'none',
            fontSize: '16px',
            backgroundColor: darkMode ? '#444' : 'white',
            color: darkMode ? '#ffffff' : 'black'
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '12px 20px',
            backgroundColor: isLoading || !input.trim()
              ? (darkMode ? '#666' : '#ccc')
              : (darkMode ? '#0051cc' : '#0070f3'),
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? '⏳' : 'Send'}
        </button>
      </form>

      {/* Controls and Status */}
      <div style={{
        marginTop: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#666'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              style={{ margin: 0 }}
            />
            Auto-scroll
          </label>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              ⚙️ Settings
            </button>

            {showSettings && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '10px',
                minWidth: '200px',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    Dark Mode
                  </label>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Message Font Size:
                  </label>
                  <select
                    value="medium"
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #ddd',
                      borderRadius: '3px'
                    }}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Max Response Length:
                  </label>
                  <select
                    value="500"
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #ddd',
                      borderRadius: '3px'
                    }}
                  >
                    <option value="100">Short (100 tokens)</option>
                    <option value="500">Medium (500 tokens)</option>
                    <option value="1000">Long (1000 tokens)</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          Using OpenRouter API • Model: meta-llama/llama-3.2-3b-instruct:free
        </div>
      </div>
    </div>
  );
}