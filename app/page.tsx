'use client';

import { useState, useEffect } from 'react';
import { db, id } from '@/lib/db';
import MemeCanvas, { TextBox } from '@/components/MemeCanvas';
import TextBoxList from '@/components/TextBoxList';
import AuthButton from '@/components/AuthButton';
import { useRouter } from 'next/navigation';

const templateImages = [
  { name: 'Bell Curve', path: '/assets/bell-curve-v0-ua8cx3e0fa3f1.jpg' },
  { name: 'Big Brain Wojak', path: '/assets/big-brain-wojak.gif' },
  { name: 'Puppet Awkward', path: '/assets/puppet-awkward.gif' },
];

export default function Home() {
  const router = useRouter();
  const { user, isLoading: authLoading } = db.useAuth();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [nextId, setNextId] = useState(1);
  const [selectedTextBox, setSelectedTextBox] = useState<TextBox | null>(null);
  const [currentFontSize, setCurrentFontSize] = useState(40);
  const [currentTextColor, setCurrentTextColor] = useState('#FFFFFF');
  const [textInput, setTextInput] = useState('');
  const [caption, setCaption] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Debug: Log user state
  useEffect(() => {
    console.log('Page - Auth state:', { user, authLoading, hasUser: !!user, userId: user?.id });
  }, [user, authLoading]);

  const loadTemplateImage = (path: string) => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => {
      alert('Failed to load template image. Please check if the file exists.');
    };
    img.src = path;
  };

  const loadImageFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const addTextBox = (text: string) => {
    if (!image) return;

    const centerX = image.width / 2;
    const centerY = image.height / 2;

    const textBox: TextBox = {
      id: nextId,
      text: text,
      originalText: text,
      x: centerX,
      y: centerY,
      fontSize: currentFontSize,
      color: currentTextColor,
    };

    setTextBoxes([...textBoxes, textBox]);
    setNextId(nextId + 1);
    setTextInput('');
  };

  const removeTextBox = (id: number) => {
    setTextBoxes(textBoxes.filter((tb) => tb.id !== id));
    if (selectedTextBox?.id === id) {
      setSelectedTextBox(null);
    }
  };

  const updateTextBox = (id: number, newText: string) => {
    setTextBoxes(
      textBoxes.map((tb) =>
        tb.id === id ? { ...tb, text: newText, originalText: newText } : tb
      )
    );
  };

  const handleAddText = () => {
    const text = textInput.trim();
    if (!text || !image) {
      if (!image) {
        alert('Please upload an image first!');
      }
      return;
    }

    if (isEditing && selectedTextBox) {
      updateTextBox(selectedTextBox.id, text);
      setSelectedTextBox(null);
      setIsEditing(false);
      setTextInput('');
    } else {
      addTextBox(text);
    }
  };

  const handleEditTextBox = (textBox: TextBox) => {
    setSelectedTextBox(textBox);
    setTextInput(textBox.originalText || textBox.text);
    setCurrentFontSize(textBox.fontSize);
    setCurrentTextColor(textBox.color || '#FFFFFF');
    setIsEditing(true);
  };

  const handleTextBoxMove = (id: number, x: number, y: number) => {
    setTextBoxes(
      textBoxes.map((tb) => (tb.id === id ? { ...tb, x, y } : tb))
    );
  };

  const handleFontSizeChange = (size: number) => {
    setCurrentFontSize(size);
    if (selectedTextBox) {
      setTextBoxes(
        textBoxes.map((tb) =>
          tb.id === selectedTextBox.id ? { ...tb, fontSize: size } : tb
        )
      );
    }
  };

  const handleColorChange = (color: string) => {
    setCurrentTextColor(color);
    if (selectedTextBox) {
      setTextBoxes(
        textBoxes.map((tb) =>
          tb.id === selectedTextBox.id ? { ...tb, color } : tb
        )
      );
    }
  };

  const downloadMeme = () => {
    if (!image || textBoxes.length === 0) {
      alert('Please add an image and at least one text box!');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    textBoxes.forEach((textBox) => {
      ctx.save();
      ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textBox.color || '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(3, textBox.fontSize / 8);
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;

      const lines = textBox.text.split('\n');
      const lineHeight = textBox.fontSize * 1.2;
      const totalHeight = lines.length * lineHeight;
      const startY = textBox.y - totalHeight / 2 + lineHeight / 2;

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.strokeText(line, textBox.x, y);
        ctx.fillText(line, textBox.x, y);
      });

      ctx.restore();
    });

    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePostMeme = async () => {
    if (!user) {
      alert('Please sign in to post memes! Click "Sign In" in the header.');
      return;
    }

    if (!image || textBoxes.length === 0) {
      alert('Please add an image and at least one text box!');
      return;
    }

    setIsPosting(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = image.width;
      canvas.height = image.height;

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      textBoxes.forEach((textBox) => {
        ctx.save();
        ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textBox.color || '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(3, textBox.fontSize / 8);
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;

        const lines = textBox.text.split('\n');
        const lineHeight = textBox.fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = textBox.y - totalHeight / 2 + lineHeight / 2;

        lines.forEach((line, index) => {
          const y = startY + index * lineHeight;
          ctx.strokeText(line, textBox.x, y);
          ctx.fillText(line, textBox.x, y);
        });

        ctx.restore();
      });

      const imageData = canvas.toDataURL('image/png');
      const textBoxesJson = JSON.stringify(textBoxes);

      const memeId = id();
      const memeData = {
        imageData,
        textBoxes: textBoxesJson,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        createdAt: Date.now(),
        email: user.email || '',
        caption: caption.trim() || undefined, // Use undefined instead of empty string for optional field
      };

      console.log('Posting meme with data:', {
        memeId,
        userId: user.id,
        canvasSize: `${canvas.width}x${canvas.height}`,
        textBoxesCount: textBoxes.length,
        imageDataLength: imageData.length,
      });

      // Create meme with links in a single transaction
      // In Instant DB, links are set using .link() method
      await db.transact([
        db.tx.memes[memeId].update({
          ...memeData,
        }),
        // Set links separately using .link()
        db.tx.memes[memeId].link({ author: user.id }),
        db.tx.memes[memeId].link({ owner: user.id }),
      ]);

      console.log('Meme posted successfully!', memeId);
      // Clear caption after successful post
      setCaption('');
      alert('Meme posted successfully!');
      router.push('/feed');
    } catch (error) {
      console.error('Error posting meme:', error);
      alert('Failed to post meme. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="app-wrapper">
      <main className="app-main">
        <div className="workspace">
          <div className="left-panel">
            <div className="left-section">
              <div className="section-header">
                <h2>Templates</h2>
              </div>
              <div className="templates-grid">
                {templateImages.map((template, index) => (
                  <div
                    key={index}
                    className="template-item"
                    onClick={() => loadTemplateImage(template.path)}
                  >
                    <img
                      src={template.path}
                      alt={template.name}
                      className="template-thumbnail"
                    />
                    <div className="template-overlay">
                      <span className="template-name">{template.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="left-section">
              <div className="section-header">
                <h2>Upload Your Own Image</h2>
              </div>
              <label htmlFor="imageInput" className="upload-area">
                <input
                  type="file"
                  id="imageInput"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) loadImageFromFile(file);
                  }}
                />
                <div className="upload-content">
                  <div className="upload-icon">☁</div>
                  <div className="upload-text-large">Upload Your Own Image</div>
                  <div className="upload-text-small">Click or drag and drop</div>
                </div>
              </label>
            </div>

            <div className="canvas-area">
              <div className="canvas-wrapper">
                <MemeCanvas
                  image={image}
                  textBoxes={textBoxes}
                  selectedTextBox={selectedTextBox}
                  onTextBoxClick={setSelectedTextBox}
                  onTextBoxMove={handleTextBoxMove}
                />
              </div>
            </div>
          </div>

          <div className="resizer" />

          <aside className="right-panel">
            <div className="sidebar-section">
              <div className="section-header">
                <h2>Text Content</h2>
              </div>
              <textarea
                id="textInput"
                className="text-input"
                placeholder="Enter your meme text&#10;Press Enter for new lines"
                rows={3}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>

            <div className="sidebar-section">
              <div className="section-header">
                <h2>Font Size</h2>
              </div>
              <div className="slider-wrapper">
                <input
                  type="range"
                  id="fontSizeInput"
                  min="20"
                  max="200"
                  value={currentFontSize}
                  className="slider"
                  onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                />
                <span id="fontSizeDisplay" className="slider-value">
                  {currentFontSize}
                </span>
              </div>
            </div>

            <div className="sidebar-section">
              <div className="section-header">
                <h2>Text Color</h2>
              </div>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  id="textColorInput"
                  value={currentTextColor}
                  className="color-picker"
                  onChange={(e) => handleColorChange(e.target.value)}
                />
                <span className="color-value">{currentTextColor.toUpperCase()}</span>
              </div>
            </div>

            <div className="sidebar-section">
              <button
                id="addTextBtn"
                className="add-button"
                onClick={handleAddText}
              >
                <span>{isEditing ? 'Update Text' : 'Add Text to Canvas'}</span>
              </button>
            </div>

            <div className="sidebar-section">
              <div className="section-header">
                <h2>Text Boxes</h2>
                <span className="layer-count">{textBoxes.length}</span>
              </div>
              <div id="textBoxesList" className="text-layers">
                <TextBoxList
                  textBoxes={textBoxes}
                  selectedTextBox={selectedTextBox}
                  onSelect={setSelectedTextBox}
                  onEdit={handleEditTextBox}
                  onDelete={removeTextBox}
                />
              </div>
            </div>

            <div className="sidebar-section">
              <button
                id="downloadBtn"
                className="download-button"
                onClick={downloadMeme}
                disabled={!image || textBoxes.length === 0}
              >
                <span>Download Meme</span>
              </button>
            </div>

            <div className="sidebar-section">
              <label htmlFor="captionInput" className="input-label">
                Caption (Optional)
              </label>
              <textarea
                id="captionInput"
                className="text-input"
                placeholder="Add a caption for your meme..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                style={{ marginBottom: '1rem' }}
              />
              <button
                className="post-button"
                onClick={handlePostMeme}
                disabled={!image || textBoxes.length === 0 || isPosting}
                style={{
                  opacity: (!image || textBoxes.length === 0 || !user) ? 0.5 : 1,
                  cursor: (!image || textBoxes.length === 0 || !user) ? 'not-allowed' : 'pointer',
                }}
              >
                <span>{isPosting ? 'Posting...' : 'Post Meme'}</span>
              </button>
              {!user && (
                <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem', textAlign: 'center', fontWeight: 600 }}>
                  ⚠️ Sign in to post memes
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
