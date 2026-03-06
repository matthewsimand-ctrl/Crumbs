import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, GripVertical, ListTodo } from 'lucide-react';
import { Recipe } from '../types';

type PlannerColumn = 'toCook' | 'thisWeek' | 'done';
type PlannerView = 'board' | 'calendar';
type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface PlannerItem {
  id: string;
  recipeId: string;
  title: string;
  description: string;
  prepTime: string;
  difficulty: Recipe['difficulty'];
  column: PlannerColumn;
  scheduledDay?: Weekday;
}

const STORAGE_KEY = 'fridgevibe-planner-board';

const columns: Array<{ key: PlannerColumn; label: string; icon: typeof ListTodo }> = [
  { key: 'toCook', label: 'To Cook', icon: ListTodo },
  { key: 'thisWeek', label: 'This Week', icon: CalendarDays },
  { key: 'done', label: 'Done', icon: CheckCircle2 },
];

const weekdays: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface RecipePlannerBoardProps {
  recipes: Recipe[];
}

export function RecipePlannerBoard({ recipes }: RecipePlannerBoardProps) {
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([]);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [view, setView] = useState<PlannerView>('board');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as PlannerItem[];
      setPlannerItems(parsed);
    } catch (error) {
      console.error('Could not load planner board state', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plannerItems));
  }, [plannerItems]);

  useEffect(() => {
    if (recipes.length === 0) return;

    setPlannerItems((prev) => {
      const knownRecipeIds = new Set(prev.map((item) => item.recipeId));
      const nextItems = [...prev];

      recipes.forEach((recipe) => {
        if (knownRecipeIds.has(recipe.id)) return;

        nextItems.push({
          id: `planner-${recipe.id}`,
          recipeId: recipe.id,
          title: recipe.title,
          description: recipe.description,
          prepTime: recipe.prepTime,
          difficulty: recipe.difficulty,
          column: 'toCook',
        });
      });

      return nextItems;
    });
  }, [recipes]);

  const itemsByColumn = useMemo(
    () =>
      columns.reduce<Record<PlannerColumn, PlannerItem[]>>(
        (acc, column) => {
          acc[column.key] = plannerItems.filter((item) => item.column === column.key);
          return acc;
        },
        { toCook: [], thisWeek: [], done: [] },
      ),
    [plannerItems],
  );

  const handleDropToColumn = (column: PlannerColumn) => {
    if (!draggedItemId) return;

    setPlannerItems((prev) =>
      prev.map((item) =>
        item.id === draggedItemId
          ? {
              ...item,
              column,
              scheduledDay: column === 'thisWeek' ? item.scheduledDay : undefined,
            }
          : item,
      ),
    );
    setDraggedItemId(null);
  };

  const handleDropToWeekday = (day: Weekday) => {
    if (!draggedItemId) return;

    setPlannerItems((prev) =>
      prev.map((item) =>
        item.id === draggedItemId
          ? {
              ...item,
              column: 'thisWeek',
              scheduledDay: day,
            }
          : item,
      ),
    );
    setDraggedItemId(null);
  };

  const updateScheduledDay = (itemId: string, day: Weekday | '') => {
    setPlannerItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              scheduledDay: day || undefined,
            }
          : item,
      ),
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-emerald-900">Recipe Planner</h2>
          <p className="text-sm text-slate-500">Drag recipes between columns and schedule your week.</p>
        </div>

        <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setView('board')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'board' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'calendar' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {plannerItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100">
          <p className="text-slate-500">Generate recipes to start planning your cooking schedule.</p>
        </div>
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {columns.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDropToColumn(key)}
              className="bg-white border border-emerald-100 rounded-2xl p-4 min-h-52"
            >
              <h3 className="text-sm font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                <Icon size={16} className="text-emerald-600" />
                {label}
                <span className="ml-auto text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg">
                  {itemsByColumn[key].length}
                </span>
              </h3>

              <div className="space-y-3">
                {itemsByColumn[key].map((item) => (
                  <article
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedItemId(item.id)}
                    onDragEnd={() => setDraggedItemId(null)}
                    className="border border-slate-200 rounded-xl p-3 bg-slate-50 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="text-slate-400 mt-0.5" size={16} />
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm text-slate-900 leading-tight">{item.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">{item.prepTime}</span>
                      <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">{item.difficulty}</span>
                    </div>

                    {item.column === 'thisWeek' && (
                      <select
                        value={item.scheduledDay ?? ''}
                        onChange={(event) => updateScheduledDay(item.id, event.target.value as Weekday | '')}
                        className="mt-3 w-full text-xs rounded-lg border border-slate-200 px-2 py-1.5 bg-white"
                      >
                        <option value="">Unscheduled</option>
                        {weekdays.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {weekdays.map((day) => {
            const dayItems = plannerItems.filter((item) => item.column === 'thisWeek' && item.scheduledDay === day);
            return (
              <div
                key={day}
                className="bg-white border border-emerald-100 rounded-2xl p-4"
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDropToWeekday(day)}
              >
                <h3 className="text-sm font-semibold text-emerald-900 mb-3">{day}</h3>
                <div className="space-y-2 min-h-16">
                  {dayItems.length === 0 ? (
                    <p className="text-xs text-slate-400">Drop a recipe here</p>
                  ) : (
                    dayItems.map((item) => (
                      <article
                        key={item.id}
                        draggable
                        onDragStart={() => setDraggedItemId(item.id)}
                        onDragEnd={() => setDraggedItemId(null)}
                        className="border border-slate-200 rounded-lg p-2 bg-slate-50 cursor-grab"
                      >
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{item.prepTime}</p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDropToColumn('thisWeek')}
            className="bg-white border border-dashed border-slate-300 rounded-2xl p-4"
          >
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Unscheduled This Week</h3>
            <div className="space-y-2">
              {plannerItems
                .filter((item) => item.column === 'thisWeek' && !item.scheduledDay)
                .map((item) => (
                  <article
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedItemId(item.id)}
                    onDragEnd={() => setDraggedItemId(null)}
                    className="border border-slate-200 rounded-lg p-2 bg-slate-50 cursor-grab"
                  >
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">Drag onto a weekday to schedule</p>
                  </article>
                ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
