import SkeletonListItem from './SkeletonListItem'

export default function SkeletonList({ count = 4 }) {
  return (
    <div className="flex flex-col gap-4 px-1">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  )
}
