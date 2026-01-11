'use client';

import { TextBox } from './MemeCanvas';

interface TextBoxListProps {
  textBoxes: TextBox[];
  selectedTextBox: TextBox | null;
  onSelect: (textBox: TextBox) => void;
  onEdit: (textBox: TextBox) => void;
  onDelete: (id: number) => void;
}

export default function TextBoxList({
  textBoxes,
  selectedTextBox,
  onSelect,
  onEdit,
  onDelete,
}: TextBoxListProps) {
  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  if (textBoxes.length === 0) {
    return (
      <div className="empty-state">
        <p>No text layers yet</p>
        <span>Add text to get started</span>
      </div>
    );
  }

  return (
    <>
      {textBoxes.map((textBox) => (
        <div
          key={textBox.id}
          className={`text-layer-item ${selectedTextBox?.id === textBox.id ? 'active' : ''}`}
          onClick={() => onSelect(textBox)}
        >
          <div className="text-layer-content">{escapeHtml(textBox.text)}</div>
          <div className="text-layer-actions">
            <button
              className="layer-action-btn edit-layer-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(textBox);
              }}
            >
              Edit
            </button>
            <button
              className="layer-action-btn delete-layer-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(textBox.id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
