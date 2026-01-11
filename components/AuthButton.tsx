'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';

export default function AuthButton() {
  const { user, isLoading } = db.useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log auth state
  useEffect(() => {
    console.log('Auth state:', { user, isLoading, hasAuth: !!db.auth });
  }, [user, isLoading]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Attempting to send magic code to:', email);
      console.log('Available auth methods:', Object.keys(db.auth || {}));
      
      // Check which method exists
      if (typeof (db.auth as any).sendMagicCode === 'function') {
        await (db.auth as any).sendMagicCode({ email });
        setShowCodeInput(true);
      } else if (typeof (db.auth as any).signInWithMagicCode === 'function') {
        await (db.auth as any).signInWithMagicCode({ email });
        setShowCodeInput(true);
      } else {
        throw new Error('No magic code method found. Available methods: ' + Object.keys(db.auth || {}).join(', '));
      }
    } catch (error: any) {
      console.error('Error sending magic code:', error);
      setError(error?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeString = code.join('');
    if (codeString.length !== 6) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Attempting to verify code for:', email);
      console.log('Code entered:', codeString);
      console.log('Available auth methods:', Object.keys(db.auth || {}));
      console.log('Full auth object:', db.auth);
      
      const auth = db.auth as any;
      
      // Try all possible verification methods
      if (typeof auth.confirmMagicCode === 'function') {
        console.log('Using confirmMagicCode');
        await auth.confirmMagicCode({ email, code: codeString });
        setShowCodeInput(false);
        setCode(['', '', '', '', '', '']);
        setEmail('');
      } else if (typeof auth.verifyMagicCode === 'function') {
        console.log('Using verifyMagicCode');
        await auth.verifyMagicCode({ email, code: codeString });
        setShowCodeInput(false);
        setCode(['', '', '', '', '', '']);
        setEmail('');
      } else if (typeof auth.completeMagicCode === 'function') {
        console.log('Using completeMagicCode');
        await auth.completeMagicCode({ email, code: codeString });
        setShowCodeInput(false);
        setCode(['', '', '', '', '', '']);
        setEmail('');
      } else if (typeof auth.signInWithMagicCode === 'function') {
        // Some APIs use the same method for both sending and confirming
        console.log('Trying signInWithMagicCode with code');
        await auth.signInWithMagicCode({ email, code: codeString });
        setShowCodeInput(false);
        setCode(['', '', '', '', '', '']);
        setEmail('');
      } else {
        // Log all available methods for debugging
        const availableMethods = Object.keys(auth).filter(key => typeof auth[key] === 'function');
        console.error('Available auth methods:', availableMethods);
        throw new Error(`No verification method found. Available methods: ${availableMethods.join(', ')}`);
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      setError(error?.message || 'Invalid verification code. Please try again. Check console for details.');
      setCode(['', '', '', '', '', '']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleLogout = async () => {
    await db.auth.signOut();
  };

  if (isLoading) {
    return <div className="user-info">Loading...</div>;
  }

  if (user) {
    return (
      <div className="user-info">
        <span>{user.email}</span>
        <button onClick={handleLogout} className="auth-button" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="auth-container">
      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      {!showCodeInput ? (
        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
          />
          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Sign In'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCodeSubmit}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>
            Enter the 6-digit code sent to {email}
          </p>
          <div className="verification-code-input">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                className="auth-input"
                style={{ width: '3rem', height: '3rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}
              />
            ))}
          </div>
          <button type="submit" className="auth-button" disabled={isSubmitting || code.join('').length !== 6}>
            {isSubmitting ? 'Verifying...' : 'Verify Code'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCodeInput(false);
              setCode(['', '', '', '', '', '']);
            }}
            className="auth-button"
            style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
}
