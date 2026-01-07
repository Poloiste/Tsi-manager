import React, { useState } from 'react';

/**
 * Tooltip - Reusable tooltip component
 * @param {React.ReactNode} children - The element to wrap with tooltip
 * @param {string} content - The tooltip text content
 * @param {string} position - Position of the tooltip (top, bottom, left, right)
 */
export function Tooltip({ children, content, position = 'top' }) {
  const [show, setShow] = useState(false);
  
  if (!content) {
    return children;
  }
  
  return (
    <div 
      className="tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`tooltip tooltip-${position}`}>
          {content}
        </div>
      )}
    </div>
  );
}
