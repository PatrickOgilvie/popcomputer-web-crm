import { router } from '@inertiajs/react'
import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '~/components/cn'
import { fieldControlClassName } from '~/components/fieldStyles'

/**
 * A search box that filters the list as you type: it asks the page again with
 * `?q=`, keeping the address shareable and the box focused.
 */
export default function SearchField({
  path,
  query,
  label,
  placeholder,
}: {
  readonly path: string
  readonly query: string | null
  readonly label: string
  readonly placeholder: string
}) {
  const [value, setValue] = useState(query ?? '')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function search(next: string, wait: number) {
    setValue(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      router.get(path, next.trim() === '' ? {} : { q: next.trim() }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      })
    }, wait)
  }

  return (
    <form role="search" className="relative w-full sm:max-w-xs" onSubmit={(event) => {
      event.preventDefault()
      search(value, 0)
    }}>
      <label htmlFor="search" className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
      <input
        id="search"
        type="search"
        name="q"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        className={cn(fieldControlClassName, 'h-10 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden')}
        onChange={(event) => search(event.target.value, 250)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value !== '') search('', 0)
        }}
      />
      {value !== '' ? (
        <button
          type="button"
          aria-label="Clear the search"
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-zinc-400 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-orange-600 dark:hover:text-zinc-200"
          onClick={() => search('', 0)}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </form>
  )
}
