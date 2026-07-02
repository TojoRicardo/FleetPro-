import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Car, Users, Route, Wrench, Activity, TrendingUp, ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '@/components/ui/StatCard';
import { ROUTES } from '@/routes/constants';
import ChartMount from '@/components/ui/ChartMount';
import Card from '@/components/ui/Card';
import ActivityFeed from '@/components/ui/ActivityFeed';
import UpgradeBanner from '@/components/ui/UpgradeBanner';
import OnboardingTip from '@/components/ui/OnboardingTip';
import { CardSkeleton } from '@/components/ui/Skeleton';
import ErrorFallback from '@/components/ui/ErrorFallback';
import { useDashboard, useSubscription, useAuditLogs } from '@/hooks/useQueries';
import { usePollingFallback } from '@/hooks/useRealtime';
import { useTheme } from '@/theme/useTheme';
import { baseChartOptions, getChartColors } from '@/utils/chartTheme';
import { formatCurrency, getPaginatedRows } from '@/utils';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

export default function DashboardPage() {
  usePollingFallback(['dashboard', 'analytics', 'audit-logs'], 60000);
  const { theme } = useTheme();

  const { data, isLoading, isError, refetch } = useDashboard();
  const { data: subscription } = useSubscription();
  const { data: activityData, isLoading: activityLoading } = useAuditLogs({ per_page: 8, page: 1 });

  const stats = data?.statistics;
  const charts = data?.charts;
  const usage = subscription?.usage;
  const usageWarning = usage && Object.values(usage).some((u) => u.used / u.limit >= 0.8);
  const chartColors = getChartColors(theme);
  const chartOpts = baseChartOptions(theme);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6"><ErrorFallback message="Couldn't load dashboard data." onRetry={() => refetch()} /></div>
    );
  }

  const vehicleChart = {
    labels: ['Active', 'Maintenance', 'Inactive'],
    datasets: [{ data: [charts?.vehicle_status?.active ?? 0, charts?.vehicle_status?.maintenance ?? 0, charts?.vehicle_status?.inactive ?? 0], backgroundColor: chartColors.palette.slice(0, 3), borderWidth: 0, hoverOffset: 6 }],
  };

  const tripChart = {
    labels: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
    datasets: [{ label: 'Trips', data: [charts?.trip_status?.scheduled ?? 0, charts?.trip_status?.ongoing ?? 0, charts?.trip_status?.completed ?? 0, charts?.trip_status?.cancelled ?? 0], borderColor: chartColors.primary, backgroundColor: chartColors.primaryFill, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5 }],
  };

  const maintenanceChart = {
    labels: ['This period'],
    datasets: [{ label: 'Cost', data: [stats?.total_maintenance_cost ?? 0], backgroundColor: chartColors.palette[2], borderRadius: 10, barThickness: 40 }],
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
        <OnboardingTip
          id="dashboard-cmdk"
          title="Pro tip: Press ⌘K to search anything"
          description="Jump to pages, find vehicles and drivers, or trigger quick actions from anywhere."
        />

        {usageWarning && (
          <UpgradeBanner
            dismissKey="usage-limit"
            message="You're approaching your plan limits. Upgrade to unlock more vehicles, drivers, and team members."
          />
        )}

        {/* Primary KPIs — one clear focus row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Vehicles" value={stats?.total_vehicles ?? 0} icon={Car} color="primary" trend="Fleet size" trendUp index={0} />
          <StatCard title="Active Drivers" value={stats?.active_drivers ?? 0} icon={Users} color="green" trend="Available" trendUp index={1} />
          <StatCard title="Ongoing Trips" value={stats?.ongoing_trips ?? 0} icon={Route} color="blue" trend="Live now" index={2} />
          <StatCard title="Maintenance" value={formatCurrency(stats?.total_maintenance_cost ?? 0)} icon={Wrench} color="amber" trend="This period" index={3} />
        </div>

        {/* Insights + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card hover className="flex items-center gap-4 !p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active fleet</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.active_vehicles ?? 0}</p>
                </div>
              </Card>
              <Card hover className="flex items-center gap-4 !p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                  <Wrench className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">In service</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.vehicles_in_maintenance ?? 0}</p>
                </div>
              </Card>
              <Link to={ROUTES.ANALYTICS} className="block">
                <Card hover className="flex items-center gap-4 !p-4 h-full group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 ring-1 ring-primary-500/20">
                    <Activity className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total trips</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.total_trips ?? 0}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
                </Card>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <h3 className="text-sm font-semibold text-slate-900">Vehicle status</h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">Distribution across fleet</p>
                <div className="h-48">
                  <ChartMount chartKey={`vehicle-${theme}`}>
                    <Doughnut data={vehicleChart} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: true, position: 'bottom' } } }} />
                  </ChartMount>
                </div>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-slate-900">Trip activity</h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">Operations pipeline</p>
                <div className="h-48">
                  <ChartMount chartKey={`trip-${theme}`}>
                    <Line data={tripChart} options={chartOpts} />
                  </ChartMount>
                </div>
              </Card>
            </div>
          </div>

          <ActivityFeed logs={getPaginatedRows(activityData)} loading={activityLoading} />
        </div>

        {/* Maintenance chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Maintenance spend</h3>
              <p className="text-xs text-slate-500">Total cost this billing period</p>
            </div>
            <Link to={ROUTES.BILLING} className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
              <Sparkles className="h-3.5 w-3.5" /> View plan
            </Link>
          </div>
          <div className="h-32">
            <ChartMount chartKey={`maintenance-${theme}`}>
              <Bar data={maintenanceChart} options={{ ...chartOpts, indexAxis: 'y' as const, scales: { x: { ...chartOpts.scales?.x, grid: { color: chartColors.grid } }, y: { display: false } } }} />
            </ChartMount>
          </div>
        </Card>
    </div>
  );
}
