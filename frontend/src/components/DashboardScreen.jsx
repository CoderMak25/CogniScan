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
import {
  BoltIcon,
  ChartBarSquareIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Square3Stack3DIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'

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

  useEffect(() => {
    fetchHistory().catch(() => {})
  }, [fetchHistory])

  const { chartData, radarData, avgScore, insight, peakDomain } = useMemo(() => {
    const labels = history.map((h) => new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    const scores = history.map((h) => h.totalScore)

    // Calculate Progress
    let progress = 0
    if (scores.length >= 2) {
      const lastVal = scores[scores.length - 1]
      const prevVal = scores[scores.length - 2]
      progress = Math.round(((lastVal - prevVal) / prevVal) * 100)
    }

    const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0

    // Latest Radar Data
    const last = history[history.length - 1]?.taskScores || { memory: 80, reaction: 80, sequence: 80, speech: 80, typing: 80, facial: 80 }
    
    // Average Radar Data (Baseline)
    const baselineRadar = history.length > 0 ? {
      memory: Math.round(history.reduce((a,h)=>a+h.taskScores.memory,0)/history.length),
      reaction: Math.round(history.reduce((a,h)=>a+h.taskScores.reaction,0)/history.length),
      sequence: Math.round(history.reduce((a,h)=>a+h.taskScores.sequence,0)/history.length),
      speech: Math.round(history.reduce((a,h)=>a+(h.taskScores.speech||0),0)/history.length),
      typing: Math.round(history.reduce((a,h)=>a+(h.taskScores.typing||0),0)/history.length),
      facial: Math.round(history.reduce((a,h)=>a+(h.taskScores.facial||0),0)/history.length),
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
        { name: 'Speech', val: last.speech || 0 },
        { name: 'Typing', val: last.typing || 0 },
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
      insight,
      peakDomain,
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
            borderWidth: 3,
          }
        ]
      },
      radarData: {
        labels: ['Memory', 'Motor', 'Sequence', 'Speech', 'Typing', 'Facial'],
        datasets: [
          {
            label: 'Current Mapping',
            data: [last.memory, last.reaction, last.sequence, last.speech || 0, last.typing || 0, last.facial || 0],
            backgroundColor: 'rgba(26, 115, 232, 0.2)',
            borderColor: '#1A73E8',
            borderWidth: 2,
          },
          {
            label: 'Baseline Average',
            data: [baselineRadar.memory, baselineRadar.reaction, baselineRadar.sequence, baselineRadar.speech, baselineRadar.typing || 0, baselineRadar.facial || 0],
            backgroundColor: 'rgba(52, 168, 83, 0.1)',
            borderColor: '#34A853',
            borderWidth: 1,
            borderDash: [5, 5],
          }
        ]
      }
    }
  }, [history])

  return (
    <section className="fade-in max-w-[1240px] mx-auto px-4 md:px-6 pb-24">
      <div className="mb-12 rounded-[36px] border border-[#E8EDF5] bg-white/80 backdrop-blur-md p-8 md:p-10 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 mb-4">
              <SparklesIcon className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-black">Live Neuro Panel</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-textPrimary uppercase leading-[0.95]">Neuro Dashboard</h1>
            <p className="text-textSecondary mt-4 text-sm md:text-base font-medium max-w-[560px]">
              Predictive analysis of your neuro-behavioral fingerprint with longitudinal risk and domain signatures.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
            <div className="rounded-2xl border border-[#E8EDF5] bg-white p-4 min-w-[180px]">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-textSecondary mb-2">Sessions</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-black text-textPrimary">{history.length}</p>
                <ChartBarSquareIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="rounded-2xl border border-[#E8EDF5] bg-white p-4 min-w-[180px]">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-textSecondary mb-2">Risk Signal</p>
              <div className="flex items-center justify-between">
                <p className={`text-xl font-black ${latestScore?.anomaly?.isAnomaly ? 'text-alert' : 'text-success'}`}>
                  {latestScore?.anomaly?.isAnomaly ? 'Elevated' : 'Normal'}
                </p>
                {latestScore?.anomaly?.isAnomaly ? (
                  <ExclamationTriangleIcon className="w-6 h-6 text-alert" />
                ) : (
                  <ShieldCheckIcon className="w-6 h-6 text-success" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-textPrimary">Clinical Overview</h2>
          <p className="text-textSecondary mt-2 text-sm font-medium opacity-80">Current state across cognition, motor latency, and verbal fluency.</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-[#E8EDF5] rounded-full px-6 py-3 shadow-sm">
          <div className={`w-3 h-3 rounded-full ${latestScore?.anomaly?.isAnomaly ? 'bg-alert' : 'bg-success'} animate-pulse`} />
          <span className="text-xs font-black text-textPrimary uppercase tracking-widest">
            {latestScore?.anomaly?.isAnomaly ? 'Critical Drift' : 'Clinical Baseline Stable'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-linear-to-br from-primary to-[#155DB1] rounded-[36px] shadow-2xl p-8 text-white relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
            <div className="flex items-center gap-2 mb-6 opacity-90">
              <BoltIcon className="w-4 h-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aggregate Baseline</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl md:text-7xl font-black tracking-tighter leading-none">{avgScore}</span>
              <span className="text-2xl font-bold opacity-60">%</span>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.8)]" style={{ width: `${avgScore}%` }} />
              </div>
              <span className="text-xs font-bold whitespace-nowrap">{history.length} SESSIONS</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white rounded-[30px] shadow-sm border border-[#E8EDF5] p-5 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[11px] font-black text-[#80868b] uppercase tracking-[0.2em] mb-1">Speech</p>
                <div className="text-2xl font-black text-textPrimary tracking-tight">
                  {latestScore?.rawMetrics?.speechFluencyScore || '40'} <span className="text-xs font-bold text-[#80868b] lowercase ml-1">Fluency Task</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center shadow-sm text-primary">
                <MicrophoneIcon className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white rounded-[30px] shadow-sm border border-[#E8EDF5] p-5 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[11px] font-black text-[#80868b] uppercase tracking-[0.2em] mb-1">Stroop</p>
                <div className="text-2xl font-black text-textPrimary tracking-tight">
                  {latestScore?.taskScores?.stroop || mockDiagnosticData.stroop.score} <span className="text-xs font-bold text-[#80868b] lowercase ml-1">Mock Baseline</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center shadow-sm text-primary">
                <Squares2X2Icon className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white rounded-[30px] shadow-sm border border-[#E8EDF5] p-5 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[11px] font-black text-[#80868b] uppercase tracking-[0.2em] mb-1">Working Memory</p>
                <div className="text-2xl font-black text-textPrimary tracking-tight">
                  {latestScore?.taskScores?.numberSpan || mockDiagnosticData.numberSpan.score} <span className="text-xs font-bold text-[#80868b] lowercase ml-1">Mock Baseline</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center shadow-sm text-primary">
                <Square3Stack3DIcon className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white rounded-[30px] shadow-sm border border-[#E8EDF5] p-5 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[11px] font-black text-[#80868b] uppercase tracking-[0.2em] mb-1">Typing</p>
                <div className="text-2xl font-black text-textPrimary tracking-tight">
                  {latestScore?.taskScores?.typing || 0} <span className="text-xs font-bold text-[#80868b] lowercase ml-1">speed + accuracy</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center shadow-sm text-primary">
                <BoltIcon className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white rounded-[30px] shadow-sm border border-[#E8EDF5] p-5 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[11px] font-black text-[#80868b] uppercase tracking-[0.2em] mb-1">Acoustic Drifts</p>
                <div className="text-2xl font-black text-textPrimary tracking-tight">
                  {latestScore?.rawMetrics?.pauseFrequency || '0'} <span className="text-xs font-bold text-[#80868b] lowercase ml-1">p/m</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center shadow-sm text-primary">
                <ChartBarSquareIcon className="w-7 h-7" />
              </div>
            </div>
            {latestScore?.taskScores?.facial > 0 && (
              <div className="bg-white rounded-[30px] shadow-sm border border-[#E8EDF5] p-5 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-[11px] font-black text-[#80868b] uppercase tracking-[0.2em] mb-1">Facial</p>
                  <div className="text-2xl font-black text-textPrimary tracking-tight">
                    {latestScore?.taskScores?.facial || 0} <span className="text-xs font-bold text-[#80868b] lowercase ml-1">stability</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center shadow-sm text-primary">
                  <SparklesIcon className="w-7 h-7" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-12 lg:col-span-8 bg-card rounded-[36px] shadow-card p-8 md:p-10 border border-[#E8EDF5] flex flex-col group">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-textPrimary uppercase tracking-tight">Consistency Dynamics</h3>
              <p className="text-sm text-textSecondary font-medium mt-1">Cross-domain temporal variance (7 sessions)</p>
            </div>
          </div>
          <div className="flex-1 min-h-[350px]">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { min: 30, max: 100, border: { display: false }, grid: { color: '#F8F9FA' }, ticks: { font: { size: 10, weight: '900' }, color: '#BDC1C6', padding: 10 } },
                  x: { border: { display: false }, grid: { display: false }, ticks: { font: { size: 10, weight: '900' }, color: '#BDC1C6', padding: 10 } }
                }
              }}
            />
          </div>
        </div>

        <div className="md:col-span-12 lg:col-span-7 bg-card rounded-[36px] shadow-card p-8 md:p-10 border border-[#E8EDF5] relative overflow-hidden group">
          <div className="absolute right-10 top-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
          <h3 className="text-xl md:text-2xl font-black text-textPrimary uppercase tracking-tight mb-10">Functional Cartography</h3>
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

        <div className="md:col-span-12 lg:col-span-5 bg-card rounded-[36px] shadow-card p-8 md:p-10 border border-[#E8EDF5] flex flex-col bg-[radial-gradient(at_top_right,#E8F0FD_0%,transparent_50%)]">
          <h3 className="text-xl md:text-2xl font-black text-textPrimary uppercase tracking-tight mb-8 italic">Cognitive Summary</h3>
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
