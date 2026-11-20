import { Skeleton } from '@dh-araria/ui/components';

export default function RootLoading() {
  return (
    <div className="mx-auto space-y-4 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Skeleton variant="title" widthClassName="w-40" />
        <Skeleton variant="text" widthClassName="w-80" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((card) => (
          <div key={card} className="rounded-xl border border-outline-variant p-4">
            <Skeleton variant="title" widthClassName="w-24" />
            <Skeleton variant="text" widthClassName="w-full" lines={2} className="mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
