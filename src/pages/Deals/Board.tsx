import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Head, Link, router } from '@inertiajs/react'
import { href } from '@popcomputer/web/paths'
import type { PagePropsFor, WebPage } from '@popcomputer/web/react'
import { Building2, CalendarClock, GripVertical, KanbanSquare, Plus, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { buttonClassName } from '~/components/button'
import { cn } from '~/components/cn'
import { daysUntil, describeDue, formatCompactMoney, formatMoney } from '~/components/crm-format'
import EmptyState from '~/components/EmptyState'
import Layout from '~/components/Layout'
import PageHeader from '~/components/PageHeader'
import { isClosedStage, openStages, stages, stageStyles, type Stage } from '~/components/stages'
import UnderTheHood, { Guarantee } from '~/components/UnderTheHood'
import { paths } from '~/paths'

type Card = PagePropsFor<'Deals/Board'>['deals'][number]
type Columns = Readonly<Record<Stage, ReadonlyArray<Card>>>

function byStage(deals: ReadonlyArray<Card>): Columns {
  const columns: Record<Stage, Array<Card>> = {
    lead: [],
    qualified: [],
    proposal: [],
    negotiation: [],
    won: [],
    lost: [],
  }
  // The server sends them in each column's order.
  for (const deal of deals) columns[deal.stage].push(deal)
  return columns
}

const isStage = (id: UniqueIdentifier): id is Stage => stages.includes(id as Stage)

function stageOf(columns: Columns, id: UniqueIdentifier): Stage | undefined {
  if (isStage(id)) return id
  return stages.find((stage) => columns[stage].some((card) => card.id === id))
}

const sum = (cards: ReadonlyArray<Card>) => cards.reduce((total, card) => total + card.value, 0)

/** A deal as the board shows it, in its column or under the pointer. */
function DealCardView({
  card,
  handle,
  lifted = false,
}: {
  readonly card: Card
  readonly handle?: ReactNode
  readonly lifted?: boolean
}) {
  const closed = isClosedStage(card.stage)
  const days = card.expectedCloseOn === null ? undefined : daysUntil(card.expectedCloseOn)

  return (
    <article
      className={cn(
        'relative flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-xs transition-[border-color,box-shadow] hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
        lifted && 'rotate-[1.5deg] cursor-grabbing border-zinc-300 shadow-xl ring-1 ring-zinc-950/5 dark:border-zinc-700',
        card.stage === 'won' && 'border-l-2 border-l-emerald-500 dark:border-l-emerald-500',
        card.stage === 'lost' && 'opacity-75'
      )}
    >
      <div className="flex items-start gap-1">
        <Link
          href={href(paths.deal, { deal: card.id })}
          draggable={false}
          className="min-w-0 flex-1 text-sm/5 font-medium text-pretty break-words after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-orange-600"
        >
          {card.title}
        </Link>
        {handle}
      </div>
      {card.companyName !== null || card.contactName !== null ? (
        <div className="flex min-w-0 flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          {card.companyName !== null ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <Building2 className="size-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
              <span className="truncate">{card.companyName}</span>
            </span>
          ) : null}
          {card.contactName !== null ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <User className="size-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
              <span className="truncate">{card.contactName}</span>
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">{formatMoney(card.value)}</span>
        {card.expectedCloseOn !== null && !closed ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs tabular-nums',
              days !== undefined && days < 0 ? 'font-medium text-red-700 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'
            )}
            title="Expected to close"
          >
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {describeDue(card.expectedCloseOn)}
          </span>
        ) : null}
      </div>
    </article>
  )
}

function SortableCard({ card }: { readonly card: Card }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      // The whole card drags with a mouse or a long press; the handle is the
      // keyboard's way in, so the title stays a plain link.
      {...listeners}
      className={cn('touch-manipulation', isDragging && 'opacity-40')}
    >
      <DealCardView
        card={card}
        handle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            aria-label={`Move ${card.title}`}
            className="relative -mt-0.5 -mr-1.5 flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-orange-600 active:cursor-grabbing dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        }
      />
    </li>
  )
}

function Column({ stage, cards }: { readonly stage: Stage; readonly cards: ReadonlyArray<Card> }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const style = stageStyles[stage]
  const titleId = `stage-${stage}-title`

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'flex w-[17.5rem] shrink-0 flex-col rounded-xl border border-transparent bg-zinc-100 transition-colors dark:bg-zinc-900/70',
        isOver && 'border-zinc-300 bg-zinc-200/70 dark:border-zinc-700 dark:bg-zinc-800/70'
      )}
    >
      <header className="flex items-start justify-between gap-2 px-3 pt-3 pb-1">
        <div className="min-w-0">
          <h2 id={titleId} className="flex items-center gap-2 text-sm font-semibold">
            <span className={cn('size-2 rounded-full', style.dot)} aria-hidden="true" />
            {style.label}
            <span className="rounded-full bg-white px-1.5 text-xs font-medium text-zinc-600 tabular-nums dark:bg-zinc-800 dark:text-zinc-300">
              {cards.length}
            </span>
          </h2>
          {isClosedStage(stage) ? (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Last 30 days</p>
          ) : null}
        </div>
        <span className="text-sm font-medium text-zinc-600 tabular-nums dark:text-zinc-400" title={formatMoney(sum(cards))}>
          {formatCompactMoney(sum(cards))}
        </span>
      </header>
      <SortableContext id={stage} items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} aria-labelledby={titleId} className="flex min-h-28 flex-1 flex-col gap-2 p-2">
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} />
          ))}
          {cards.length === 0 ? (
            <li
              className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              aria-hidden="true"
            >
              Drop a deal here
            </li>
          ) : null}
        </ul>
      </SortableContext>
      {!isClosedStage(stage) ? (
        <div className="px-2 pb-2">
          <Link
            href={href(paths.newDeal, {}, { stage })}
            className="flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-sm text-zinc-600 hover:bg-white hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-orange-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add deal<span className="sr-only"> to {style.label}</span>
          </Link>
        </div>
      ) : null}
    </section>
  )
}

/** The pipeline as a board: drag a deal between stages, or up and down its column. */
const Board: WebPage<'Deals/Board'> = ({ deals }) => {
  const [columns, setColumns] = useState<Columns>(() => byStage(deals))
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const startedIn = useRef<{ stage: Stage; index: number } | null>(null)

  // Each save answers with the board as the server has it.
  useEffect(() => setColumns(byStage(deals)), [deals])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const cardById = (id: UniqueIdentifier) => deals.find((deal) => deal.id === id)
  const titleOf = (id: UniqueIdentifier) => cardById(id)?.title ?? 'The deal'
  const activeCard = activeId === null ? undefined : cardById(activeId)

  function describeTarget(id: UniqueIdentifier): string {
    const stage = stageOf(columns, id)
    if (stage === undefined) return 'nothing'
    const column = columns[stage]
    const index = column.findIndex((card) => card.id === activeId)
    return `${stageStyles[stage].label}, position ${index === -1 ? column.length + 1 : index + 1} of ${Math.max(column.length, 1)}`
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}, in ${describeTarget(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over === null ? `${titleOf(active.id)} is no longer over a stage.` : `${titleOf(active.id)} is in ${describeTarget(active.id)}.`,
    onDragEnd: ({ active, over }) =>
      over === null ? `${titleOf(active.id)} was put back.` : `${titleOf(active.id)} was dropped in ${describeTarget(active.id)}.`,
    onDragCancel: ({ active }) => `Moving ${titleOf(active.id)} was cancelled. It's back where it was.`,
  }

  function handleDragStart({ active }: DragStartEvent) {
    const stage = stageOf(columns, active.id)
    setActiveId(active.id)
    startedIn.current = stage === undefined ? null : { stage, index: columns[stage].findIndex((card) => card.id === active.id) }
  }

  // Crossing into another column moves the card there as it goes, so the
  // column opens a gap under the pointer.
  function handleDragOver({ active, over }: DragOverEvent) {
    if (over === null) return
    const from = stageOf(columns, active.id)
    const to = stageOf(columns, over.id)
    if (from === undefined || to === undefined || from === to) return

    setColumns((current) => {
      const card = current[from].find((candidate) => candidate.id === active.id)
      if (card === undefined) return current
      const target = current[to]
      const overIndex = target.findIndex((candidate) => candidate.id === over.id)
      const translated = active.rect.current.translated
      const below = translated !== null && translated.top > over.rect.top + over.rect.height / 2
      const index = overIndex === -1 ? target.length : overIndex + (below ? 1 : 0)

      return {
        ...current,
        [from]: current[from].filter((candidate) => candidate.id !== active.id),
        [to]: [...target.slice(0, index), { ...card, stage: to }, ...target.slice(index)],
      }
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    const stage = stageOf(columns, active.id)
    const started = startedIn.current
    startedIn.current = null
    if (over === null || stage === undefined) {
      setColumns(byStage(deals))
      return
    }

    let column = columns[stage]
    const from = column.findIndex((card) => card.id === active.id)
    const to = column.findIndex((card) => card.id === over.id)
    if (to !== -1 && to !== from) column = arrayMove([...column], from, to)
    setColumns({ ...columns, [stage]: column })

    const index = column.findIndex((card) => card.id === active.id)
    if (started !== null && started.stage === stage && started.index === index) return

    router.patch(
      href(paths.dealStage, { deal: String(active.id) }),
      { stage, beforeId: column[index + 1]?.id ?? null },
      { preserveScroll: true, preserveState: true, onError: () => setColumns(byStage(deals)) }
    )
  }

  const open = openStages.flatMap((stage) => columns[stage])
  const weighted = openStages.reduce((total, stage) => total + sum(columns[stage]) * stageStyles[stage].probability, 0)

  return (
    <>
      <Head title="Pipeline" />
      <Layout width="full">
        <PageHeader
          title="Pipeline"
          meta={
            deals.length > 0 ? (
              <>
                <span className="tabular-nums">
                  {open.length} open {open.length === 1 ? 'deal' : 'deals'} · {formatMoney(sum(open))}
                </span>
                <span className="tabular-nums" title="Each stage's total times its chance of closing">
                  {formatMoney(Math.round(weighted))} weighted
                </span>
                <span className="hidden text-zinc-500 lg:inline dark:text-zinc-500">Drag a card to move it.</span>
              </>
            ) : undefined
          }
          actions={
            <Link href={paths.newDeal} className={buttonClassName()}>
              <Plus aria-hidden="true" />
              New deal
            </Link>
          }
        />

        {deals.length === 0 ? (
          <EmptyState
            icon={KanbanSquare}
            title="Start your pipeline"
            description="Add a deal, then drag it from lead to won as it moves along."
            action={
              <Link href={paths.newDeal} className={buttonClassName()}>
                Add a deal
              </Link>
            }
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            accessibility={{
              announcements,
              screenReaderInstructions: {
                draggable:
                  'To move a deal, press Space or Enter on its handle. Use the arrow keys to move it up and down, or to another stage, then press Space or Enter to drop it, or Escape to cancel.',
              },
            }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
              setActiveId(null)
              startedIn.current = null
              setColumns(byStage(deals))
            }}
          >
            <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              <div className="flex w-max items-stretch gap-3">
                {stages.map((stage) => (
                  <Column key={stage} stage={stage} cards={columns[stage]} />
                ))}
              </div>
            </div>
            <DragOverlay>{activeCard ? <DealCardView card={activeCard} lifted /> : null}</DragOverlay>
          </DndContext>
        )}

        <UnderTheHood route="PATCH /deals/{deal}/stage" action="moveDeal">
          <Guarantee>
            The card names its deal in the path, <code>bound('deal')</code>: another member’s deal is a 404.
          </Guarantee>
          <Guarantee>
            The column is numbered again in one <code>dbBatch</code>, so a move lands whole or not at all.
          </Guarantee>
          <Guarantee>
            A <code>CHECK</code> keeps <code>closed_at</code> set exactly while a deal is won or lost.
          </Guarantee>
        </UnderTheHood>
      </Layout>
    </>
  )
}

export default Board
