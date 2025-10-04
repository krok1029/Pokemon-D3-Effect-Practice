import AverageStatsSection from '@/app/components/dashboard/sections/AverageStatsSection';
import TotalCountSection from '@/app/components/dashboard/sections/TotalCountSection';

export default async function Home() {
  return (
    <div className="flex flex-wrap gap-4">
      <TotalCountSection />
      <AverageStatsSection />
    </div>
  );
}
