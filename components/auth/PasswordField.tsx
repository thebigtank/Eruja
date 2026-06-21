'use client';

import { useState } from 'react';
import { Icon } from '@/components/primitives';
import styles from './PasswordField.module.css';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

/** Password input with an eye / eyeOff show-hide toggle (a real labelled button). */
export function PasswordField({
  value,
  onChange,
  placeholder = 'Password',
  autoComplete = 'current-password',
}: PasswordFieldProps) {
  const [shown, setShown] = useState(false);
  return (
    <div className={styles.wrap}>
      <input
        className={`fld ${styles.input}`}
        type={shown ? 'text' : 'password'}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className={styles.toggle}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        onClick={() => setShown((s) => !s)}
      >
        <Icon name={shown ? 'eyeOff' : 'eye'} size={18} stroke={1.9} />
      </button>
    </div>
  );
}
