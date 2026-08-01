import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { BlogEditor } from '../BlogEditor';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock the upload to cloudinary
vi.mock('@/lib/cloudinary-upload-client', () => ({
  uploadImageToCloudinary: vi.fn(),
}));

describe('BlogEditor', () => {
  test('renders all toolbar buttons with correct aria-labels', () => {
    render(<BlogEditor initialContent={null} />);

    expect(screen.getByRole('button', { name: 'Heading 2' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Heading 3' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Bullet List' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Ordered List' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Blockquote' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Code Block' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Insert Image' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Insert Diagram' })).toBeDefined();
  });
});
