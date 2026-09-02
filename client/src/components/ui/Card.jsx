import { motion } from 'framer-motion';

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  children,
  padding = 'md',
  className = '',
  hover = true,
  ...props
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : {}}
      className={`
        rounded-2xl border border-slate-200 dark:border-white/10
        bg-white dark:bg-white/[0.03] backdrop-blur-xl
        transition-all duration-300 shadow-sm shadow-indigo-50/50 dark:shadow-none
        ${hover ? 'hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-300 dark:hover:border-white/20' : ''}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}
