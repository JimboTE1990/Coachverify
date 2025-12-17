import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

interface ViewsByDay {
  date: string;
  views: number;
}

interface ProfileViewsChartProps {
  viewsByDay: ViewsByDay[];
  totalViews: number;
}

type TimePeriod = '7d' | '14d' | '30d' | '90d' | '1y';

export const ProfileViewsChart: React.FC<ProfileViewsChartProps> = ({ viewsByDay, totalViews }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');

  const periods: { value: TimePeriod; label: string; days: number }[] = [
    { value: '7d', label: '7 Days', days: 7 },
    { value: '14d', label: '14 Days', days: 14 },
    { value: '30d', label: '30 Days', days: 30 },
    { value: '90d', label: '90 Days', days: 90 },
    { value: '1y', label: '1 Year', days: 365 },
  ];

  // Filter data based on selected period
  const getFilteredData = () => {
    const selectedDays = periods.find(p => p.value === selectedPeriod)?.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - selectedDays);

    return viewsByDay
      .filter(item => new Date(item.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const filteredData = getFilteredData();

  // Calculate stats for selected period
  const periodViews = filteredData.reduce((sum, item) => sum + item.views, 0);
  const avgViewsPerDay = filteredData.length > 0 ? Math.round(periodViews / filteredData.length) : 0;
  const maxViews = Math.max(...filteredData.map(d => d.views), 1);

  // Calculate percentage change (comparing first half vs second half of period)
  const midpoint = Math.floor(filteredData.length / 2);
  const firstHalf = filteredData.slice(0, midpoint);
  const secondHalf = filteredData.slice(midpoint);
  const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, d) => sum + d.views, 0) / firstHalf.length : 0;
  const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, d) => sum + d.views, 0) / secondHalf.length : 0;
  const percentageChange = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
      {/* Header with Time Period Selector */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-slate-900">Profile Views</h3>
            <p className="text-sm text-slate-500">Track your profile performance</p>
          </div>
        </div>

        {/* Time Period Dropdown */}
        <div className="relative">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-colors"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="text-sm font-medium text-slate-600 mb-1">Period Views</div>
          <div className="text-3xl font-display font-black text-slate-900">{periodViews.toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="text-sm font-medium text-slate-600 mb-1">Avg per Day</div>
          <div className="text-3xl font-display font-black text-slate-900">{avgViewsPerDay}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <div className="text-sm font-medium text-slate-600 mb-1 flex items-center">
            Trend
            <TrendingUp className={`h-3 w-3 ml-1 ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div className={`text-3xl font-display font-black ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
          <span>Date</span>
          <span>Views</span>
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No views recorded yet</p>
            <p className="text-sm">Check back once your profile gets some traffic!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {filteredData.map((item, index) => {
              const barWidth = (item.views / maxViews) * 100;
              const isToday = new Date(item.date).toDateString() === new Date().toDateString();

              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span className={`font-medium ${isToday ? 'text-brand-600 font-bold' : ''}`}>
                      {formatDate(item.date)}
                      {isToday && <span className="ml-1 text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">Today</span>}
                    </span>
                    <span className="font-bold text-slate-700">{item.views}</span>
                  </div>
                  <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-r from-brand-500 to-brand-600'
                          : 'bg-gradient-to-r from-blue-400 to-blue-500 group-hover:from-blue-500 group-hover:to-blue-600'
                      }`}
                      style={{ width: `${Math.max(barWidth, 2)}%` }}
                    >
                      {item.views > 0 && (
                        <div className="absolute inset-0 flex items-center justify-end pr-2">
                          <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.views} view{item.views !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center">
        Showing data for the last {periods.find(p => p.value === selectedPeriod)?.label.toLowerCase()} • Total lifetime views: <span className="font-bold text-slate-700">{totalViews.toLocaleString()}</span>
      </div>
    </div>
  );
};
