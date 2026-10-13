import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { tw } from '../../lib/tailwind.js';

export default function DraggableNavigation({ items }) {
  const location = useLocation();
  const gesture = useRef(null);
  const navigationRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const nav = navigationRef.current;
    const measure = () => {
      const left = nav.scrollLeft > 2;
      const right = nav.scrollWidth - nav.clientWidth - nav.scrollLeft > 2;
      setEdges((previous) =>
        previous.left === left && previous.right === right
          ? previous
          : { left, right },
      );
    };
    const initial = window.setTimeout(measure, 0);
    nav.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measure)
        : null;
    observer?.observe(nav);
    return () => {
      window.clearTimeout(initial);
      nav.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [items.length]);
  const slide = (direction) =>
    navigationRef.current.scrollBy({
      left: direction * navigationRef.current.clientWidth * 0.6,
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  const finish = (event) => {
    if (!gesture.current) return;
    gesture.current.active = false;
    delete event.currentTarget.dataset.dragging;
    event.currentTarget.style.cursor = '';
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return (
    <div className="relative min-w-0 max-w-[660px] flex-1 max-md:order-3 max-md:basis-full">
      <nav
        ref={navigationRef}
        aria-label="Primary navigation"
        className="flex w-full min-w-0 select-none items-center gap-0.5 overflow-x-auto rounded-full border border-[#f4f7fb] bg-white p-[7px] shadow-[0_9px_24px_#286fc410] cursor-grab [scrollbar-width:none] [&::-webkit-scrollbar]:hidden data-[dragging=true]:[&_a]:cursor-grabbing"
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse' || event.button !== 0) {
            gesture.current = null;
            return;
          }
          gesture.current = {
            active: true,
            x: event.clientX,
            scroll: event.currentTarget.scrollLeft,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const drag = gesture.current;
          if (!drag?.active) return;
          const distance = event.clientX - drag.x;
          if (Math.abs(distance) > 6) drag.moved = true;
          if (!drag.moved) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture?.(event.pointerId);
          event.currentTarget.style.cursor = 'grabbing';
          event.currentTarget.dataset.dragging = 'true';
          event.currentTarget.scrollLeft = drag.scroll - distance;
        }}
        onPointerUp={finish}
        onPointerCancel={(event) => {
          finish(event);
          gesture.current = null;
        }}
        onLostPointerCapture={finish}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (event.detail !== 0 && gesture.current?.moved) {
            event.preventDefault();
            event.stopPropagation();
            gesture.current = null;
          }
        }}
      >
        {items.map(({ label, path, matchPrefix, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            draggable={false}
            title={label}
            className={({ isActive }) => {
              const active = isActive || (matchPrefix && location.pathname.startsWith(`${matchPrefix}/`));
              return `${tw(`nav-item ${active ? 'active' : ''}`)} min-w-0 basis-[calc((100%_-_8px)/5)] shrink-0 justify-center cursor-pointer px-2! gap-1.5! max-md:basis-[calc((100%_-_4px)/3)]`;
            }}
            onFocus={(event) =>
              event.currentTarget.scrollIntoView?.({
                block: 'nearest',
                inline: 'nearest',
              })
            }
          >
            <Icon size={18} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      {edges.left && (
        <div className="pointer-events-none absolute inset-y-px left-px flex w-9 items-center rounded-l-full bg-gradient-to-r from-white via-white/95 to-transparent">
          <button
            type="button"
            aria-label="Show previous modules"
            onClick={() => slide(-1)}
            className="pointer-events-auto ml-0.5 grid size-6 cursor-pointer place-items-center rounded-full bg-white text-[#006eb5] shadow-[0_2px_7px_#003b6214] hover:bg-[#eaf5fc]"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      )}
      {edges.right && (
        <div className="pointer-events-none absolute inset-y-px right-px flex w-9 items-center justify-end rounded-r-full bg-gradient-to-l from-white via-white/95 to-transparent">
          <button
            type="button"
            aria-label="Show more modules"
            onClick={() => slide(1)}
            className="pointer-events-auto mr-0.5 grid size-6 cursor-pointer place-items-center rounded-full bg-white text-[#006eb5] shadow-[0_2px_7px_#003b6214] hover:bg-[#eaf5fc]"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
