import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Outlet } from 'react-router-dom';
import HRMSSidebar from './HRMSSidebar.jsx';
import { Sheet } from '../ui/Sheet.jsx';

export default function HRMSLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerTop, setDrawerTop] = useState(0);
  const rootRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const measure = useCallback(() => {
    setDrawerTop(Math.max(0, Math.round(rootRef.current?.getBoundingClientRect().top || 0)));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    if (mobileOpen) measure();
  }, [mobileOpen, measure]);

  return (
    <div ref={rootRef} className="-mx-2 min-h-[calc(100vh-180px)] font-['Inter',sans-serif] text-[#10254b] sm:mx-0">
      <div className="flex items-start gap-4">
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 72 : 250 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="relative sticky top-4 hidden h-[calc(100vh-58px)] shrink-0 overflow-visible rounded-[20px] border border-[#edf2f7] bg-white shadow-[0_10px_35px_#315d8610] lg:block"
        >
          <div className="h-full overflow-hidden rounded-[20px]">
            <HRMSSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
          </div>
        </motion.aside>
        <main className="min-w-0 flex-1 pb-2">
          <Outlet context={{ openHRMSNavigation: () => setMobileOpen(true) }} />
        </main>
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} top={drawerTop} title="HRMS navigation">
        <HRMSSidebar mobile onNavigate={() => setMobileOpen(false)} />
      </Sheet>
    </div>
  );
}
