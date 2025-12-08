import React, { useMemo } from 'react';

/**
 * Composant Heatmap d'activité style GitHub
 * Affiche les révisions des 3 derniers mois
 * @param {Array} dailyStats - Statistiques journalières [{date, reviews_count, ...}]
 */
export function ActivityHeatmap({ dailyStats = [] }) {
  // Générer la grille des 3 derniers mois (90 jours)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 89); // 90 jours au total

    // Créer un map des stats par date
    const statsMap = {};
    dailyStats.forEach(stat => {
      statsMap[stat.date] = stat.reviews_count || 0;
    });

    // Générer tous les jours
    const days = [];
    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      days.push({
        date: dateStr,
        dayOfWeek: date.getDay(),
        count: statsMap[dateStr] || 0
      });
    }

    // Organiser en semaines (du dimanche au samedi)
    const weeks = [];
    let currentWeek = [];
    
    // Ajouter des jours vides au début si nécessaire
    const firstDayOfWeek = days[0].dayOfWeek;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ empty: true });
    }

    days.forEach(day => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Ajouter la dernière semaine si incomplète
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ empty: true });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [dailyStats]);

  // Obtenir la couleur selon l'intensité
  const getColorClass = (count) => {
    if (count === 0) return 'bg-slate-800 border-slate-700';
    if (count <= 2) return 'bg-green-900 border-green-800';
    if (count <= 5) return 'bg-green-700 border-green-600';
    if (count <= 10) return 'bg-green-600 border-green-500';
    return 'bg-green-500 border-green-400';
  };

  // Noms des jours de la semaine
  const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Obtenir les noms des mois pour les labels
  const monthLabels = useMemo(() => {
    if (heatmapData.length === 0) return [];
    
    const labels = [];
    let currentMonth = null;
    
    heatmapData.forEach((week, weekIndex) => {
      const firstDay = week.find(day => !day.empty);
      if (firstDay) {
        const date = new Date(firstDay.date);
        const month = date.getMonth();
        
        if (month !== currentMonth) {
          labels.push({
            weekIndex,
            month: date.toLocaleDateString('fr-FR', { month: 'short' })
          });
          currentMonth = month;
        }
      }
    });
    
    return labels;
  }, [heatmapData]);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        📊 Activité des 3 derniers mois
      </h3>

      {/* Légende */}
      <div className="flex items-center justify-end gap-2 mb-4 text-sm text-slate-400">
        <span>Moins</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700"></div>
          <div className="w-4 h-4 rounded bg-green-900 border border-green-800"></div>
          <div className="w-4 h-4 rounded bg-green-700 border border-green-600"></div>
          <div className="w-4 h-4 rounded bg-green-600 border border-green-500"></div>
          <div className="w-4 h-4 rounded bg-green-500 border border-green-400"></div>
        </div>
        <span>Plus</span>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2 pl-12">
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="text-xs text-slate-400 font-semibold"
                style={{
                  marginLeft: idx === 0 ? 0 : `${(label.weekIndex - (monthLabels[idx - 1]?.weekIndex || 0)) * 16}px`
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Grid container */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              {dayLabels.map((label, idx) => (
                <div
                  key={idx}
                  className="h-3 flex items-center text-xs text-slate-400"
                >
                  {idx % 2 === 1 ? label : ''}
                </div>
              ))}
            </div>

            {/* Weeks grid */}
            <div className="flex gap-1">
              {heatmapData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    if (day.empty) {
                      return (
                        <div
                          key={dayIndex}
                          className="w-3 h-3"
                        />
                      );
                    }

                    const date = new Date(day.date);
                    const formattedDate = date.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <div
                        key={dayIndex}
                        className={`
                          w-3 h-3 rounded
                          border
                          ${getColorClass(day.count)}
                          hover:ring-2 hover:ring-indigo-400
                          transition-all
                          cursor-pointer
                          group
                          relative
                        `}
                        title={`${formattedDate}: ${day.count} révision${day.count > 1 ? 's' : ''}`}
                      >
                        {/* Tooltip on hover */}
                        <div className="
                          absolute
                          bottom-full
                          left-1/2
                          transform
                          -translate-x-1/2
                          mb-2
                          px-3
                          py-2
                          bg-slate-900
                          border
                          border-slate-700
                          rounded-lg
                          text-white
                          text-xs
                          whitespace-nowrap
                          opacity-0
                          group-hover:opacity-100
                          pointer-events-none
                          transition-opacity
                          duration-200
                          z-50
                        ">
                          <div className="font-semibold">{formattedDate}</div>
                          <div className="text-green-400">
                            {day.count} révision{day.count > 1 ? 's' : ''}
                          </div>
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-700"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
        <div>
          Total des révisions: <span className="text-green-400 font-semibold">
            {dailyStats.reduce((sum, stat) => sum + (stat.reviews_count || 0), 0)}
          </span>
        </div>
        <div>
          Jours actifs: <span className="text-indigo-400 font-semibold">
            {dailyStats.filter(stat => stat.reviews_count > 0).length}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
