import type { Metadata } from 'next';
import '@/styles/globals.css';
import AuthButton from '@/components/AuthButton';
import NavLink from '@/components/NavLink';

export const metadata: Metadata = {
  title: 'Meme Generator',
  description: 'Create hilarious memes in seconds',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-wrapper">
          <header className="app-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="app-title">Meme Generator</h1>
                <p className="app-subtitle">Create hilarious memes in seconds</p>
              </div>
              <nav className="header-nav">
                <NavLink href="/">Create</NavLink>
                <NavLink href="/feed">Feed</NavLink>
                <AuthButton />
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
