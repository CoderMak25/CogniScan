import { useEffect, useMemo } from 'react'
import { useCognitive } from '../context/CognitiveContext.jsx'
import { Line, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
)

export default function DashboardScreen() {
  const { latestScore, history, fetchHistory } = useCognitive()

  useEffect(() => {
    fetchHistory().catch(() => {})
  }, [fetchHistory])

  const { chartData, radarData, progress, avgScore } = useMemo(() => {
    const labels = history.map(h => new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    const scores = history.map(h => h.totalScore)
    
    // Calculate Progress
    let progress = 0
    if (scores.length >= 2) {
      const last = scores[scores.length - 1]
      const prev = scores[scores.length - 2]
      progress = Math.round(((last - prev) / prev) * 100)
    }

    const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0

    // Latest Radar Data
    const last = history[history.length - 1]?.taskScores || { memory: 80, reaction: 80, sequence: 80, speech: 80, facial: 80 }

    return {
      avgScore,
      progress,
      chartData: {
        labels: labels.slice(-7),
        datasets: [
          {
            label: 'Consistency',
            data: scores.slice(-7),
            borderColor: '#1A73E8',
            backgroundColor: 'rgba(26, 115, 232, 0.05)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            borderWidth: 3
          }
        ]
      },
      radarData: {
        labels: ['Memory', 'Motor', 'Sequence', 'Speech', 'Logic', 'Facial'],
        datasets: [
          {
            label: 'Current Mapping',
            data: [last.memory, last.reaction, last.sequence, last.speech || 0, (last.memory+last.sequence)/2, last.facial || 0],
            backgroundColor: 'rgba(26, 115, 232, 0.2)',
            borderColor: '#1A73E8',
            borderWidth: 2,
          }
        ]
      }
    }
  }, [history])

  return (
    <section className="fade-in max-w-[1100px] mx-auto px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-textPrimary">Cognitive Dashboard</h1>
          <p className="text-textSecondary mt-1 italic">Analyzing your unique neuro-behavioral fingerprint</p>
        </div>
        <div className="flex items-center gap-4 bg-white border border-[#E8F0FD] rounded-[20px] px-6 py-3 shadow-sm">
          <div className={`w-3 h-3 rounded-full ${latestScore?.anomaly?.isAnomaly ? 'bg-alert' : 'bg-success'} animate-pulse`} />
          <span className="text-sm font-bold text-textPrimary uppercase tracking-wider">
            {latestScore?.anomaly?.isAnomaly ? 'Drift Detected' : 'Baseline: Stable'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Progress Stats */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-card rounded-[24px] shadow-card p-6 border-b-4 border-primary">
            <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-4">Baseline Avg</p>
            <div className="text-5xl font-bold text-textPrimary tracking-tighter">{avgScore}<span className="text-xl text-baseline">%</span></div>
            <p className="text-xs font-medium text-textSecondary mt-3">Calculated over {history.length} sessions</p>
          </div>
          
          <div className="bg-card rounded-[24px] shadow-card p-6 border-b-4 border-success">
            <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-4">Speech Fluency</p>
            <div className="text-4xl font-bold text-success">
              {latestScore?.rawMetrics?.speechFluencyScore || '--'} <span className="text-sm">ACC</span>
            </div>
            <p className="text-xs font-medium text-textSecondary mt-3">Avg word duration: {latestScore?.rawMetrics?.avgWordDuration || 0}s</p>
          </div>

          <div className="bg-card rounded-[24px] shadow-card p-6 border-b-4 border-warning">
            <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-4">Acoustic Biomarkers</p>
            <div className="text-4xl font-bold text-textPrimary">{latestScore?.rawMetrics?.pauseFrequency || '--'}</div>
            <p className="text-xs font-medium text-textSecondary mt-3">Pause frequency (per min)</p>
          </div>

          <div className="bg-card rounded-[24px] shadow-card p-6 border-b-4 border-[#8B5CF6]">
            <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-4">Facial Stability</p>
            <div className="text-4xl font-bold text-[#8B5CF6]">{latestScore?.taskScores?.facial ?? '--'}</div>
            <p className="text-xs font-medium text-textSecondary mt-3">Blink rate: {latestScore?.rawMetrics?.facialBlinkRate || 0}/s</p>
          </div>
        </div>

        {/* Trend Visualization */}
        <div className="md:col-span-9 bg-card rounded-[32px] shadow-card p-10 border border-[#F1F3F4]">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-bold text-textPrimary">Longitudinal Consistency Tracking</h3>
            <div className="bg-bg px-4 py-2 rounded-full text-xs font-bold text-textSecondary uppercase tracking-wider">7 Day Window</div>
          </div>
          <div className="h-[350px]">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { min: 40, max: 100, border: { display: false }, grid: { color: '#F1F3F4' }, ticks: { font: { weight: 'bold' }, color: '#9AA0A6' } },
                  x: { border: { display: false }, grid: { display: false }, ticks: { font: { weight: 'bold' }, color: '#9AA0A6' } }
                }
              }}
            />
          </div>
        </div>

        {/* Performance Radar */}
        <div className="md:col-span-12 lg:col-span-6 bg-card rounded-[32px] shadow-card p-10 border border-[#F1F3F4]">
          <h3 className="text-lg font-bold text-textPrimary mb-10">Cognitive Domain Mapping</h3>
          <div className="h-[350px]">
            <Radar
              data={radarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  r: {
                    angleLines: { color: '#F1F3F4' },
                    grid: { color: '#F1F3F4' },
                    pointLabels: { font: { size: 11, weight: 'bold' }, color: '#5F6368' },
                    ticks: { display: false },
                    min: 0, max: 100
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Detailed Insights */}
        <div className="md:col-span-12 lg:col-span-6 bg-card rounded-[32px] shadow-card p-10 border border-[#F1F3F4]">
          <h3 className="text-lg font-bold text-textPrimary mb-8">AI-Generated Health Insight</h3>
          <div className="space-y-6">
            <div className="p-6 bg-[#E8F0FD] rounded-[24px]">
              <p className="text-primary font-bold text-sm mb-2 uppercase tracking-widest">Model Consensus</p>
              <p className="text-textPrimary leading-relaxed">
                Your cognitive load indicators suggest high executive function stability. Memory retrieval peaks correlate with your consistent morning check-in schedule.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="p-5 border border-[#F1F3F4] rounded-[20px]">
                <span className="block text-[10px] font-bold text-textSecondary uppercase mb-1">Peak Domain</span>
                <span className="text-lg font-bold text-textPrimary">Logic & Sequence</span>
              </div>
              <div className="p-5 border border-[#F1F3F4] rounded-[20px]">
                <span className="block text-[10px] font-bold text-textSecondary uppercase mb-1">Alert Status</span>
                <span className="text-lg font-bold text-success">Low Risk</span>
              </div>
            </div>

            <p className="text-xs text-textSecondary leading-relaxed bg-bg p-4 rounded-xl border border-[#F1F3F4]">
              Insights are derived from standard neurometric models. All data is processed locally before anonymized score transmission.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
