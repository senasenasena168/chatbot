import Head from 'next/head';
import { useState } from 'react';
import ChatInterface from '../src/components/ChatInterface';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Chatbot Development</title>
        <meta name="description" content="Simple chatbot interface" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <header style={{
            backgroundColor: '#0070f3',
            color: 'white',
            padding: '20px',
            textAlign: 'center'
          }}>
            <h1>🤖 Simple Chatbot</h1>
            <p>Development Version - Port 3333</p>
          </header>

          <ChatInterface />
        </div>
      </main>
    </div>
  );
}