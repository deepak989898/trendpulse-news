import Link from "next/link";

type Props = {
  category: string;
  title: string;
};

export function Breadcrumbs({ category, title }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-500">
      <ol className="flex flex-wrap items-center gap-2">
        <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
        <li>/</li>
        <li>
          <Link href={`/category/${category.toLowerCase()}`} className="hover:text-blue-600">
            {category}
          </Link>
        </li>
        <li>/</li>
        <li className="line-clamp-1 max-w-[50ch] text-zinc-700 dark:text-zinc-300">{title}</li>
      </ol>
    </nav>
  );
}
