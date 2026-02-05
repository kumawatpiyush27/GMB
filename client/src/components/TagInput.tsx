'use client';

import { useState, KeyboardEvent } from 'react';

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

export default function TagInput({ tags, onChange, placeholder }: TagInputProps) {
    const [input, setInput] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const addTag = () => {
        const trimmed = input.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
            setInput('');
        }
    };

    const removeTag = (index: number) => {
        onChange(tags.filter((_, i) => i !== index));
    };

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            background: 'rgba(0,0,0,0.2)', // Matches typical input background
            border: '1px solid #334155',   // Matches typical input border
            borderRadius: '8px',
            padding: '8px',
            minHeight: '42px'
        }}>
            {tags.map((tag, index) => (
                <span key={index} style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(index)}
                        style={{
                            border: 'none',
                            background: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1,
                            fontSize: '1em'
                        }}
                    >
                        ×
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={tags.length === 0 ? placeholder : ''}
                style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    color: 'inherit',
                    flex: 1,
                    minWidth: '120px',
                    fontSize: '1rem',
                    padding: '4px 0'
                }}
            />
        </div>
    );
}
