'use client';

import UpvoteButton from './UpvoteButton';

interface MemeCardProps {
  meme: {
    id: string;
    imageData?: string;
    imageUrl?: string;
    textBoxes?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    createdAt: number;
    caption?: string;
    author?: {
      id: string;
      email?: string;
    };
    owner?: {
      id: string;
      email?: string;
    };
  };
  authorEmail?: string;
}

export default function MemeCard({ meme, authorEmail }: MemeCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Use imageUrl if available, otherwise use imageData
  const imageSrc = meme.imageUrl || meme.imageData || '';

  return (
    <div className="meme-card">
      <img src={imageSrc} alt={meme.caption || 'Meme'} className="meme-image" />
      <div className="meme-card-footer">
        <div className="meme-meta">
          <div className="meme-author">{authorEmail || meme.author?.email || 'Anonymous'}</div>
          {meme.caption && (
            <div className="meme-caption" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {meme.caption}
            </div>
          )}
          <div className="meme-date">{formatDate(meme.createdAt)}</div>
        </div>
        <UpvoteButton memeId={meme.id} />
      </div>
    </div>
  );
}
