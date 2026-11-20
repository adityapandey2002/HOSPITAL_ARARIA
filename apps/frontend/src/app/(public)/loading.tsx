import { Skeleton } from '@dh-araria/ui/components';

export default function PublicLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton variant="title" widthClassName="w-2/3" />
        <Skeleton variant="text" widthClassName="w-full" lines={3} />
        <Skeleton variant="title" widthClassName="w-1/2" />
        <div className="rounded-xl border border-outline-variant p-4 space-y-2">
          <Skeleton variant="text" widthClassName="w-1/3" />
          <Skeleton variant="text" widthClassName="w-full" lines={2} />
        </div>
      </div>
    </div>
  );
}
