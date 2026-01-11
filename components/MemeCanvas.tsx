'use client';

import { useEffect, useRef, useState } from 'react';

export interface TextBox {
  id: number;
  text: string;
  originalText: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

interface MemeCanvasProps {
  image: HTMLImageElement | null;
  textBoxes: TextBox[];
  selectedTextBox: TextBox | null;
  onTextBoxClick: (textBox: TextBox) => void;
  onTextBoxMove: (id: number, x: number, y: number) => void;
}

export default function MemeCanvas({
  image,
  textBoxes,
  selectedTextBox,
  onTextBoxClick,
  onTextBoxMove,
}: MemeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      textBoxes.forEach((textBox) => {
        drawText(ctx, textBox);
      });
    };

    draw();
  }, [image, textBoxes]);


  const drawText = (ctx: CanvasRenderingContext2D, textBox: TextBox) => {
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
  };

  const isPointInText = (x: number, y: number, textBox: TextBox): boolean => {
    if (!canvasRef.current) return false;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.save();
    ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = textBox.text.split('\n');
    const lineHeight = textBox.fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;

    let maxWidth = 0;
    lines.forEach((line) => {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxWidth) maxWidth = metrics.width;
    });

    const left = textBox.x - maxWidth / 2;
    const right = textBox.x + maxWidth / 2;
    const top = textBox.y - totalHeight / 2;
    const bottom = textBox.y + totalHeight / 2;

    ctx.restore();

    return x >= left && x <= right && y >= top && y <= bottom;
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    const coords = getCanvasCoordinates(e);

    for (let i = textBoxes.length - 1; i >= 0; i--) {
      if (isPointInText(coords.x, coords.y, textBoxes[i])) {
        onTextBoxClick(textBoxes[i]);
        setDragOffset({
          x: coords.x - textBoxes[i].x,
          y: coords.y - textBoxes[i].y,
        });

        const timeout = setTimeout(() => {
          setIsDragging(true);
          if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grabbing';
          }
        }, 200);

        setClickTimeout(timeout);
        e.preventDefault();
        return;
      }
    }

    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image || !canvasRef.current) return;

    const coords = getCanvasCoordinates(e);

    if (isDragging && selectedTextBox) {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        setClickTimeout(null);
      }
      onTextBoxMove(selectedTextBox.id, coords.x - dragOffset.x, coords.y - dragOffset.y);
    } else {
      let hovering = false;
      for (let i = textBoxes.length - 1; i >= 0; i--) {
        if (isPointInText(coords.x, coords.y, textBoxes[i])) {
          canvasRef.current.style.cursor = 'grab';
          hovering = true;
          break;
        }
      }
      if (!hovering) {
        canvasRef.current.style.cursor = 'move';
      }
    }
  };

  const handleMouseUp = () => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    setIsDragging(false);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'move';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'move';
    }
  };

  if (!image) {
    return (
      <div className="canvas-placeholder">
        <div className="placeholder-content">
          <div className="placeholder-icon">🖼</div>
          <p>Upload an image to get started</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="meme-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}
