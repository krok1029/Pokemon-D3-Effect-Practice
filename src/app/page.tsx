import TotalCountSection from '@/app/components/dashboard/TotalCountSection';
import AverageStatsSection from '@/app/components/dashboard/AverageStatsSection';

export default async function Home() {
  return (
    <div className="flex flex-wrap gap-4">
      <TotalCountSection />
      <AverageStatsSection />
    </div>
  );
}
