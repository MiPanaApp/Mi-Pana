import SkeletonCard from './SkeletonCard'

export default function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
