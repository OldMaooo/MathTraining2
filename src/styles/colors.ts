// 颜色Token系统
export const colors = {
  // 背景色
  background: {
    primary: 'bg-white dark:bg-gray-800',
    secondary: 'bg-gray-50 dark:bg-gray-700',
    tertiary: 'bg-gray-100 dark:bg-gray-600',
    page: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800',
  },
  
  // 文本色
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-700 dark:text-gray-300',
    tertiary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
  },
  
  // 边框色
  border: {
    primary: 'border-gray-200 dark:border-gray-700',
    secondary: 'border-gray-300 dark:border-gray-600',
    muted: 'border-gray-100 dark:border-gray-800',
  },
  
  // 状态色（深色模式下更亮）
  status: {
    success: 'text-green-600 dark:text-green-400',
    successBg: 'bg-green-50 dark:bg-green-900/40',
    successBorder: 'border-green-200 dark:border-green-700',
    
    error: 'text-red-600 dark:text-red-400',
    errorBg: 'bg-red-50 dark:bg-red-900/40',
    errorBorder: 'border-red-200 dark:border-red-700',
    
    warning: 'text-yellow-600 dark:text-yellow-400',
    warningBg: 'bg-yellow-50 dark:bg-yellow-900/40',
    warningBorder: 'border-yellow-200 dark:border-yellow-700',
    
    info: 'text-blue-600 dark:text-blue-400',
    infoBg: 'bg-blue-50 dark:bg-blue-900/40',
    infoBorder: 'border-blue-200 dark:border-blue-700',
  },
  
  // 交互色
  interactive: {
    primary: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600',
    danger: 'bg-red-500/80 hover:bg-red-600/80 dark:bg-red-600/80 dark:hover:bg-red-700/80',
  },
  
  // 表单元素
  form: {
    input: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100',
    checkbox: 'border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400',
    select: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    option: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  },
  
  // 表格
  table: {
    header: 'bg-gray-50 dark:bg-gray-700',
    row: 'hover:bg-gray-50 dark:hover:bg-gray-600',
    border: 'border-gray-100 dark:border-gray-700',
  },
  
  // 进度条
  progress: {
    background: 'bg-gray-200 dark:bg-gray-700',
    fill: 'bg-green-500 dark:bg-green-400',
  },
} as const;
