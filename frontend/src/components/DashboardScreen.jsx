import { useEffect, useMemo, useState } from 'react'
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
  const { latestScore, history, fetchHistory, mockDiagnosticData } = useCognitive()
  const [chartView, setChartView] = useState('temporal')

  useEffect(() => {
    fetchHistory().catch(() => {})
  }, [fetchHistory])

  const { chartData, chartOptions, radarData, progress, avgScore, insight, peakDomain, alertStatus } = useMemo(() => {
    const last7 = history.slice(-7).filter(h => h.totalScore > 0)
    const labels = last7.map((h, i) => {
      const date = new Date(h.timestamp)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      // If multiple sessions on same day, Add time
      const isSameDayAsPrev = i > 0 && new Date(last7[i-1].timestamp).toLocaleDateString() === date.toLocaleDateString()
      const isSameDayAsNext = i < last7.length - 1 && new Date(last7[i+1].timestamp).toLocaleDateString() === date.toLocaleDateString()
      
      if (isSameDayAsPrev || isSameDayAsNext) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      }
      return dateStr
    })
    const scores = last7.map(h => h.totalScore)

    // Domain breakdowns for Spectral view
    const memoryScores = last7.map(h => h.taskScores.memory)
    const reactionScores = last7.map(h => h.taskScores.reaction)
    const sequenceScores = last7.map(h => h.taskScores.sequence)
    const speechScores = last7.map(h => h.taskScores.speech || 0)

    // Calculate Progress
    let progress = 0
    if (scores.length >= 2) {
      const lastVal = scores[scores.length - 1]
      const prevVal = scores[scores.length - 2]
      progress = Math.round(((lastVal - prevVal) / prevVal) * 100)
    }

    const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0

    // Latest Radar Data
    const last = history[history.length - 1]?.taskScores || { memory: 80, reaction: 80, sequence: 80, speech: 80 }
    
    // Average Radar Data (Baseline)
    const baselineRadar = history.length > 0 ? {
      memory: Math.round(history.reduce((a,h)=>a+h.taskScores.memory,0)/history.length),
      reaction: Math.round(history.reduce((a,h)=>a+h.taskScores.reaction,0)/history.length),
      sequence: Math.round(history.reduce((a,h)=>a+h.taskScores.sequence,0)/history.length),
      speech: Math.round(history.reduce((a,h)=>a+(h.taskScores.speech||0),0)/history.length),
    } : last

    // Dynamic Insight Logic
    let insight = "Insufficient data for detailed clinical analysis. Please complete more sessions."
    let peakDomain = "Detecting..."
    let alertStatus = "Baseline Stable"

    if (history.length > 0) {
      const latest = history[history.length - 1]
      const isAnomaly = latest.anomaly?.isAnomaly || false
      
      const domainScores = [
        { name: 'Memory', val: last.memory },
        { name: 'Motor', val: last.reaction },
        { name: 'Sequence', val: last.sequence },
        { name: 'Speech', val: last.speech || 0 }
      ]
      peakDomain = domainScores.sort((a,b) => b.val - a.val)[0].name
      
      if (isAnomaly) {
        alertStatus = "Drift Detected"
        insight = `Model detected a significant variance (${latest.anomaly.zScore}σ) from your baseline. Consider reviewing activity logs or recent sleep patterns.`
      } else if (progress > 5) {
        insight = `Cognitive performance shows a strong upward trend (${progress}%). Executive function and motor coordination are peaking.`
      } else if (progress < -10) {
        insight = `Modest decrease in consistency detected. Morning speech fluency is slightly below your 7-day rolling average.`
      } else {
        insight = `Your cognitive fingerprint remains highly stable. Peak performance noted in ${peakDomain} retrieval and pattern matching.`
      }
    }

    return {
      avgScore,
      progress,
      insight,
      peakDomain,
      alertStatus,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0 // Instantly draw the chart, CSS handles the sweep reveal
        },
        animations: {
          radius: {
            duration: 1500,
            easing: 'easeInOutSine',
            loop: true,
            from: 4,
            to: 6
          }
        },
        plugins: { 
          legend: { 
            display: chartView === 'spectral',
            position: 'bottom',
            labels: { boxWidth: 8, usePointStyle: true, padding: 20, font: { size: 10, weight: '900' } }
          } 
        },
        scales: {
          y: { min: 30, max: 100, border: { display: false }, grid: { color: '#F8F9FA' }, ticks: { font: { size: 10, weight: '900' }, color: '#BDC1C6', padding: 10 } },
          x: { border: { display: false }, grid: { display: false }, ticks: { font: { size: 10, weight: '900' }, color: '#BDC1C6', padding: 10 } }
        }
      },
      chartData: {
        labels,
        datasets: chartView === 'temporal' ? [
          {
            label: 'Consistency',
            data: scores,
            borderColor: '#1A73E8',
            backgroundColor: 'rgba(26, 115, 232, 0.05)',
            fill: true,
            tension: 0.5, // Curvy string look
            pointRadius: 4,
            borderWidth: 4, // Thicker string
            pointBackgroundColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 8
          }
        ] : [
          { label: 'Memory', data: memoryScores, borderColor: '#1A73E8', tension: 0.5, borderWidth: 3, pointRadius: 2, fill: false },
          { label: 'Motor', data: reactionScores, borderColor: '#34A853', tension: 0.5, borderWidth: 3, pointRadius: 2, fill: false },
          { label: 'Sequence', data: sequenceScores, borderColor: '#FBBC04', tension: 0.5, borderWidth: 3, pointRadius: 2, fill: false },
          { label: 'Speech', data: speechScores, borderColor: '#EA4335', tension: 0.5, borderWidth: 3, pointRadius: 2, fill: false },
        ]
      },
      radarData: {
        labels: ['Memory', 'Motor', 'Sequence', 'Speech', 'Focus'],
        datasets: [
          {
            label: 'Current Mapping',
            data: [last.memory, last.reaction, last.sequence, last.speech || 0, Math.round((last.memory + last.sequence)/2)],
            backgroundColor: 'rgba(26, 115, 232, 0.2)',
            borderColor: '#1A73E8',
            borderWidth: 2,
          },
          {
            label: 'Baseline Average',
            data: [baselineRadar.memory, baselineRadar.reaction, baselineRadar.sequence, baselineRadar.speech, Math.round((baselineRadar.memory + baselineRadar.sequence)/2)],
            backgroundColor: 'rgba(52, 168, 83, 0.1)',
            borderColor: '#34A853',
            borderWidth: 1,
            borderDash: [5, 5],
          }
        ]
      }
    }
  }, [history, chartView])

  return (
    <section className="fade-in max-w-[1200px] mx-auto px-6 md:px-0 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-textPrimary uppercase leading-none">Neuro Dashboard</h1>
          <p className="text-textSecondary mt-4 text-base font-medium opacity-70">Predictive analysis of your neuro-behavioral fingerprint</p>
        </div>
        <div className="flex items-center gap-6 bg-white/50 backdrop-blur-md border border-[#F1F3F4] rounded-full px-6 py-3 shadow-sm">
          <div className={`w-3 h-3 rounded-full ${latestScore?.anomaly?.isAnomaly ? 'bg-alert' : 'bg-success'} animate-pulse`} />
          <span className="text-xs font-black text-textPrimary uppercase tracking-widest">
            {latestScore?.anomaly?.isAnomaly ? 'Critical Drift' : 'Clinical Baseline Stable'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Progress Stats - Bento Layout */}
        <div className="md:col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-[#1A73E8] rounded-[40px] shadow-lg p-10 text-white flex flex-col justify-between h-[320px]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-4 text-[#E8F0FD]">Aggregate Baseline</p>
              <div className="flex items-baseline gap-1">
                <span className="text-8xl font-black tracking-tighter leading-none">{avgScore}</span>
                <span className="text-3xl font-bold text-[#E8F0FD]">%</span>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full">
              <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${avgScore}%` }} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-white whitespace-nowrap">{history.length} SESSIONS</span>
            </div>
          </div>
          
          <div className="space-y-4 mb-16">
            {/* Speech Box */}
            <div className="bg-white rounded-[40px] shadow-sm border border-[#D1E3FF] p-6 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[11px] font-black text-[#80868b] uppercase tracking-[0.2em] mb-1">Speech</p>
                <div className="text-3xl font-black text-textPrimary tracking-tight">
                  {latestScore?.rawMetrics?.speechFluencyScore || '40'} <span className="text-xs font-bold text-[#80868b] lowercase ml-1">Fluency Task</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-[#F8F9FA] rounded-[24px] flex items-center justify-center shadow-sm text-2xl">🎙️</div>
            </div>

            {/* Stroop Box */}
            <div className="bg-white rounded-[40px] shadow-sm border border-[#D1E3FF] p-6 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[11px] font-black text-[#80868b] uppercase tracking-[0.2em] mb-1">Stroop</p>
                <div className="text-3xl font-black text-textPrimary tracking-tight">
                  {latestScore?.taskScores?.stroop || mockDiagnosticData.stroop.score} <span className="text-xs font-bold text-[#80868b] lowercase ml-1">Mock Baseline</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-[#F8F9FA] rounded-[24px] flex items-center justify-center shadow-sm text-2xl">🎯</div>
            </div>

            {/* Working Memory Box */}
            <div className="bg-white rounded-[40px] shadow-sm border border-[#D1E3FF] p-6 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[11px] font-black text-[#80868b] uppercase tracking-[0.2em] mb-1">Working Memory</p>
                <div className="text-3xl font-black text-textPrimary tracking-tight">
                  {latestScore?.taskScores?.numberSpan || mockDiagnosticData.numberSpan.score} <span className="text-xs font-bold text-[#80868b] lowercase ml-1">Mock Baseline</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-[#F8F9FA] rounded-[24px] flex items-center justify-center shadow-sm text-2xl">🔢</div>
            </div>

            {/* Acoustic Drifts Box */}
            <div className="bg-white rounded-[40px] shadow-sm border border-[#D1E3FF] p-6 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[11px] font-black text-[#80868b] uppercase tracking-[0.2em] mb-1 font-bold">Acoustic Drifts</p>
                <div className="text-3xl font-black text-textPrimary tracking-tight">
                  {latestScore?.rawMetrics?.pauseFrequency || '0'} <span className="text-xs font-bold text-[#80868b] lowercase ml-1">p/m</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-[#F8F9FA] rounded-[24px] flex items-center justify-center shadow-sm text-2xl">🔊</div>
            </div>
          </div>
        </div>

        {/* Global Trend - The Hero Chart */}
        <div className="md:col-span-12 lg:col-span-8 bg-card rounded-[40px] shadow-card p-10 md:p-12 border border-[#F1F3F4] flex flex-col group">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
            <div>
              <h3 className="text-xl font-black text-textPrimary uppercase tracking-tighter">Consistency Dynamics</h3>
              <p className="text-sm text-textSecondary font-medium">Cross-domain temporal variance (7 sessions)</p>
            </div>
            <div className="flex gap-2 p-1 bg-bg rounded-[16px]">
              <button 
                onClick={() => setChartView('temporal')}
                className={`px-5 py-2 rounded-[12px] text-[11px] font-black uppercase tracking-widest transition-all ${
                  chartView === 'temporal' ? 'bg-white shadow-sm text-primary' : 'text-textSecondary opacity-50 hover:opacity-100'
                }`}
              >
                Temporal
              </button>
              <button 
                onClick={() => setChartView('spectral')}
                className={`px-5 py-2 rounded-[12px] text-[11px] font-black uppercase tracking-widest transition-all ${
                  chartView === 'spectral' ? 'bg-white shadow-sm text-primary' : 'text-textSecondary opacity-50 hover:opacity-100'
                }`}
              >
                Spectral
              </button>
            </div>
          </div>
          <style>{`
            @keyframes sweepReveal {
              0% { clip-path: inset(0 100% 0 0); }
              100% { clip-path: inset(0 0 0 0); }
            }
            .chart-sweep {
              animation: sweepReveal 3s ease-in-out forwards;
            }
          `}</style>
          <div key={chartView} className="flex-1 h-full min-h-[350px] w-full relative chart-sweep">
            <Line
              data={chartData}
              options={chartOptions}
            />
          </div>
        </div>

        {/* Domain Mapping - Radar */}
        <div className="md:col-span-12 lg:col-span-7 bg-card rounded-[40px] shadow-card p-12 border border-[#F1F3F4] relative overflow-hidden group">
          <div className="absolute right-10 top-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
          <h3 className="text-xl font-black text-textPrimary uppercase tracking-tighter mb-12">Functional Cartography</h3>
          <div className="h-[400px]">
            <Radar
              data={radarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 10, weight: 'bold' }, padding: 20 } } },
                scales: {
                  r: {
                    angleLines: { color: '#F1F3F4' },
                    grid: { color: '#F1F3F4' },
                    pointLabels: { font: { size: 11, weight: '900' }, color: '#5F6368', padding: 15 },
                    ticks: { display: false },
                    min: 0, max: 100
                  }
                }
              }}
            />
          </div>
        </div>

        {/* AI Insight - The Final Card */}
        <div className="md:col-span-12 lg:col-span-5 bg-card rounded-[40px] shadow-card p-12 border border-[#F1F3F4] flex flex-col bg-[radial-gradient(at_top_right,#E8F0FD_0%,transparent_50%)]">
          <h3 className="text-xl font-black text-textPrimary uppercase tracking-tighter mb-8 italic">Cognitive Summary</h3>
          <div className="flex-1 flex flex-col">
            <div className="bg-white/60 backdrop-blur-sm border border-[#E8F0FD] p-8 rounded-[32px] mb-8 shadow-sm">
              <span className="inline-block px-3 py-1 bg-primary text-[10px] font-black text-white rounded-full mb-6 uppercase tracking-widest">Model Consensus</span>
              <p className="text-lg font-bold text-textPrimary leading-relaxed tracking-tight italic">
                "{insight}"
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-auto">
              <div className="p-6 bg-bg rounded-[24px] border border-[#F1F3F4] group hover:border-primary transition-all">
                <span className="block text-[10px] font-black text-textSecondary uppercase mb-2">Dominant</span>
                <span className="text-xl font-black text-primary uppercase">{peakDomain}</span>
              </div>
              <div className="p-6 bg-bg rounded-[24px] border border-[#F1F3F4] group hover:border-[#F1F3F4] transition-all">
                <span className="block text-[10px] font-black text-textSecondary uppercase mb-2">Risk Factor</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-black ${latestScore?.anomaly?.isAnomaly ? 'text-alert' : 'text-success'}`}>
                    {latestScore?.anomaly?.isAnomaly ? 'HIGH' : 'LOW'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
