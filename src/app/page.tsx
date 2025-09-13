import AverageStatsContainer from '@/features/dashboard/containers/AverageStatsContainer';
import TotalCountContainer from '@/features/dashboard/containers/TotalCountContainer';

export default async function Home() {
  return (
    <div className="flex flex-wrap gap-4">
      <TotalCountContainer />
      <AverageStatsContainer />
    </div>
  );
}
