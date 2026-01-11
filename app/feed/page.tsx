'use client';

import { useEffect } from 'react';
import { db } from '@/lib/db';
import MemeCard from '@/components/MemeCard';

export default function FeedPage() {
  // Query memes - start simple, add links later if needed
  const { data, isLoading, error } = db.useQuery({
    memes: {},
  });

  // Debug: Log query results
  useEffect(() => {
    console.log('Feed query results:', { data, isLoading, error });
    if (data?.memes) {
      console.log('Memes found:', data.memes.length, data.memes);
    }
  }, [data, isLoading, error]);

  if (isLoading) {
    return (
      <div className="feed-container">
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Meme Feed</h1>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading memes...</div>
      </div>
    );
  }

  if (error) {
    console.error('Feed query error:', error);
  }

  const memes = data?.memes || [];

  // Sort memes by createdAt manually
  const sortedMemes = [...memes].sort((a: any, b: any) => {
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  // Get author email from the link relationship
  const getAuthorEmail = (meme: any) => {
    return meme.author?.email || meme.email || 'Anonymous';
  };

  if (sortedMemes.length === 0) {
    return (
      <div className="feed-container">
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Meme Feed</h1>
        <div className="empty-state">
          <p>No memes yet</p>
          <span>Be the first to post a meme!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Meme Feed</h1>
      <div className="feed-grid">
        {sortedMemes.map((meme: any) => (
          <MemeCard key={meme.id} meme={meme} authorEmail={getAuthorEmail(meme)} />
        ))}
      </div>
    </div>
  );
}
