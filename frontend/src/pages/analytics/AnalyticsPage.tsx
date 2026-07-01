import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Car, Route, Users, Wrench } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import ChartMount from '@/components/ui/ChartMount';
import Card from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useTenantAnalytics, useDashboard } from '@/hooks/useQueries';
import { useTheme } from '@/theme/useTheme';
import { baseChartOptions, getChartColors } from '@/utils/chartTheme';
import { formatCurrency } from '@/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const { data: metrics, isLoading } = useTenantAnalytics();
  const { data: dashboard } = useDashboard();

  const chartColors = getChartColors(theme);
  const chartOpts = baseChartOptions(theme);

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
    );
  }

  const fleetData = {
    labels: ['Vehicles', 'Drivers', 'Trips', 'Maintenance'],
    datasets: [{
      label: 'Count',
      data: [metrics?.vehicles_count ?? 0, metrics?.drivers_count ?? 0, metrics?.trips_count ?? 0, metrics?.maintenance_count ?? 0],
      backgroundColor: chartColors.palette,
      borderRadius: 10,
      barThickness: 32,
    }],
  };

  const tripData = {
    labels: ['Active', 'Completed', 'Scheduled', 'Cancelled'],
    datasets: [{
      label: 'Trips',
      data: [
        dashboard?.charts?.trip_status?.ongoing ?? 0,
        dashboard?.charts?.trip_status?.completed ?? 0,
        dashboard?.charts?.trip_status?.scheduled ?? 0,
        dashboard?.charts?.trip_status?.cancelled ?? 0,
      ],
      backgroundColor: chartColors.primary,
      borderRadius: 10,
    }],
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
        <p className="text-sm text-slate-500">Track fleet performance and operational trends from your live data</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Vehicles" value={metrics?.vehicles_count ?? 0} icon={Car} color="primary" index={0} />
          <StatCard title="Drivers" value={metrics?.drivers_count ?? 0} icon={Users} color="green" index={1} />
          <StatCard title="Total Trips" value={metrics?.trips_count ?? 0} icon={Route} color="purple" index={2} />
          <StatCard title="Active Trips" value={metrics?.active_trips ?? 0} icon={Route} color="blue" trend="Live now" index={3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-slate-900">Fleet overview</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">Resource breakdown</p>
            <div className="h-72">
              <ChartMount chartKey={`fleet-${theme}`}>
                <Bar data={fleetData} options={chartOpts} />
              </ChartMount>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-slate-900">Trip breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">Status distribution</p>
            <div className="h-72">
              <ChartMount chartKey={`trips-${theme}`}>
                <Bar data={tripData} options={chartOpts} />
              </ChartMount>
            </div>
          </Card>
        </div>

        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <Wrench className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{metrics?.maintenance_count ?? 0} maintenance records</p>
            <p className="text-sm text-slate-500">Total spend: {formatCurrency(metrics?.maintenance_cost ?? dashboard?.statistics?.total_maintenance_cost ?? 0)}</p>
          </div>
        </Card>
    </div>
  );
}
