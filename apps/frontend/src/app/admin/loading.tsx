import { Skeleton } from '@dh-araria/ui/components';

export default function AdminLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="title" widthClassName="w-40" />
        <Skeleton variant="text" widthClassName="w-20" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((stat) => (
          <div key={stat} className="rounded-xl border border-outline-variant p-4">
            <Skeleton variant="text" widthClassName="w-24" />
            <Skeleton variant="title" widthClassName="w-16" className="mt-2" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="rounded-xl border border-outline-variant p-4">
            <Skeleton variant="title" widthClassName="w-1/3" />
            <Skeleton variant="text" widthClassName="w-1/2" className="mt-2" />
            <Skeleton variant="text" widthClassName="w-2/3" lines={2} className="mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
