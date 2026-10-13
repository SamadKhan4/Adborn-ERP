import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, ChevronLeft, ChevronRight, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { hrmsGroups } from '../../config/hrmsNavigation.jsx';
import { cn } from '../../lib/utils.js';
import { Tooltip, TooltipProvider } from '../ui/Tooltip.jsx';
import { useAuthStore } from '../../store/authStore.js';

export default function HRMSSidebar({ collapsed = false, onCollapsedChange, onNavigate, mobile = false }) {
  const reduceMotion = useReducedMotion();
  const role = useAuthStore((state) => state.user?.role);
  const visibleGroups = role === 'employee' ? [{ id: 'self', label: 'My Workspace', items: hrmsGroups.flatMap((group) => group.items).filter((item) => item.path === '/hrms/onboarding').map((item) => ({ ...item, label: 'My Onboarding' })) }] : hrmsGroups;
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(visibleGroups.map((group) => [group.id, true])),
  );
  const showLabels = mobile || !collapsed;

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className={cn('flex h-[68px] shrink-0 items-center border-b border-[#eef3f8] px-4', collapsed && !mobile ? 'justify-center px-2' : 'gap-3')}>
          <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-[#e7f5ff] to-[#d9eeff] text-[#006EB5] shadow-[inset_0_1px_0_white,0_5px_14px_#006eb512]">
            <UsersRound size={20} />
          </span>
          <AnimatePresence initial={false}>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                className="min-w-0"
              >
                <strong className="block text-[15px] text-[#10254b]">HRMS</strong>
                <span className="text-[10px] font-medium text-[#8292a8]">People workspace</span>
              </motion.div>
            )}
          </AnimatePresence>
          {!mobile && (
            <button
              type="button"
              onClick={() => onCollapsedChange(!collapsed)}
              aria-label={collapsed ? 'Expand HRMS sidebar' : 'Collapse HRMS sidebar'}
              className={cn(
                'ml-auto grid size-8 cursor-pointer place-items-center rounded-xl border border-[#e5edf5] bg-white text-[#55708d] shadow-[0_3px_9px_#214f7810] transition-colors hover:bg-[#eef8ff] hover:text-[#006EB5]',
                collapsed && 'absolute -right-3 top-[74px] z-10 ml-0 size-7 rounded-full',
              )}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          )}
        </div>

        <nav
          aria-label="HRMS navigation"
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-3',
            showLabels
              ? 'px-2.5 [scrollbar-width:thin] [scrollbar-color:#d8e8f4_transparent]'
              : 'px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {visibleGroups.map((group) => {
            const isOpen = openGroups[group.id];
            return (
              <div key={group.id} className="mb-2">
                {showLabels ? (
                  <button
                    type="button"
                    onClick={() => setOpenGroups((current) => ({ ...current, [group.id]: !current[group.id] }))}
                    aria-expanded={isOpen}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#8b9aaf] hover:bg-[#f7fafc]"
                  >
                    <span>{group.label}</span>
                    <ChevronDown size={13} className={cn('transition-transform duration-200', !isOpen && '-rotate-90')} />
                  </button>
                ) : (
                  <div className="mx-auto my-3 h-px w-8 bg-[#e7eef5]" aria-hidden="true" />
                )}
                <AnimatePresence initial={false}>
                  {(isOpen || !showLabels) && (
                    <motion.div
                      initial={showLabels ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={showLabels ? { height: 0, opacity: 0 } : undefined}
                      transition={{ duration: reduceMotion ? 0 : 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1 pb-1">
                        {group.items.map(({ label, path, icon: Icon }) => (
                          <Tooltip key={path} label={label} disabled={showLabels}>
                            <NavLink
                              to={path}
                              onClick={onNavigate}
                              aria-label={label}
                              className={({ isActive }) =>
                                cn(
                                  'group relative flex min-h-10 items-center rounded-xl text-[11px] font-medium text-[#526680] transition-all duration-200 hover:bg-[#edf7fd] hover:text-[#006EB5]',
                                  showLabels
                                    ? 'gap-3 px-3'
                                    : 'mx-auto grid size-10 min-h-10 w-10 place-items-center p-0',
                                  isActive && 'bg-gradient-to-r from-[#e5f3fd] to-[#f1f8fe] font-semibold text-[#006EB5]',
                                  isActive && showLabels && 'shadow-[inset_3px_0_0_#006eb5]',
                                )
                              }
                            >
                              <Icon size={17} className="shrink-0" />
                              {showLabels && <span className="truncate">{label}</span>}
                            </NavLink>
                          </Tooltip>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
        {showLabels && (
          <div className="m-3 rounded-xl border border-[#dfeef8] bg-[#f3f9fd] px-3 py-2.5 text-[10px] leading-4 text-[#61768d]">
            <strong className="block text-[#315575]">AdBorn HRMS</strong>
            Live workforce operations
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
