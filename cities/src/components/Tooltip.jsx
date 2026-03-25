import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import React from 'react';

/**
 * Generic portal tooltip — mirrors provinces/src/components/Tooltip.jsx
 * Hover (desktop) or tap (mobile) reveals content. Smart-positions above/below.
 */
export default function Tooltip({ children, content }) {
  const [visible, setVisible]     = useState(false);
  const [style, setStyle]         = useState({});
  const [placement, setPlacement] = useState('above');
  const triggerRef = useRef(null);
  const tipRef     = useRef(null);
  const hideTimer  = useRef(null);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r     = el.getBoundingClientRect();
    const above = r.top > 170;
    setPlacement(above ? 'above' : 'below');
    const HALF = 116;
    const rawLeft = r.left + r.width / 2;
    const left = Math.max(HALF + 8, Math.min(rawLeft, window.innerWidth - HALF - 8));
    setStyle({ left, top: above ? r.top - 10 : r.bottom + 10 });
  }, []);

  const show = useCallback(() => { clearTimeout(hideTimer.current); place(); setVisible(true); }, [place]);
  const hide = useCallback(() => { hideTimer.current = setTimeout(() => setVisible(false), 120); }, []);

  useEffect(() => {
    if (!visible) return;
    const handler = e => {
      if (!triggerRef.current?.contains(e.target) && !tipRef.current?.contains(e.target))
        setVisible(false);
    };
    document.addEventListener('touchstart', handler, { passive: true });
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('mousedown', handler);
    };
  }, [visible]);

  if (!content) return <>{children}</>;

  const child = React.Children.only(children);
  const trigger = React.cloneElement(child, {
    ref: triggerRef,
    onMouseEnter: show,
    onMouseLeave: hide,
    onClick: e => {
      child.props.onClick?.(e);
      e.stopPropagation();
      visible ? setVisible(false) : show();
    },
  });

  return (
    <>
      {trigger}
      {visible && createPortal(
        <div
          ref={tipRef}
          className={`tipcard tipcard--${placement}`}
          style={style}
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={hide}
          role="tooltip"
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
}
