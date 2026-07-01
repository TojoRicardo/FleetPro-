import type { Theme } from '@/theme/theme';

export function getChartColors(theme: Theme = 'light') {
  const isDark = theme === 'dark';
  return {
    grid: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.12)',
    text: isDark ? '#94A3B8' : '#64748b',
    primary: isDark ? '#3B82F6' : '#2563eb',
    primaryFill: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
    palette: ['#2563eb', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'],
    tooltipBg: isDark ? '#0F172A' : '#ffffff',
    tooltipTitle: isDark ? '#F8FAFC' : '#0f172a',
    tooltipBody: isDark ? '#94A3B8' : '#64748b',
    tooltipBorder: isDark ? '#1E293B' : '#e2e8f0',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function baseChartOptions(theme: Theme = 'light'): any {
  const c = getChartColors(theme);
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false,
        labels: { usePointStyle: true, padding: 16, font: { size: 11 }, color: c.text },
      },
      tooltip: {
        backgroundColor: c.tooltipBg,
        titleColor: c.tooltipTitle,
        bodyColor: c.tooltipBody,
        borderColor: c.tooltipBorder,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: c.text, font: { size: 11 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: c.grid },
        ticks: { color: c.text, font: { size: 11 }, padding: 8 },
        border: { display: false },
      },
    },
  };
}
