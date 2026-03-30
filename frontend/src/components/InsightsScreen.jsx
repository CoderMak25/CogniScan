import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function InsightsScreen() {
  const donutData = {
    labels: ['Speech', 'Motor', 'Memory', 'Logic'],
    datasets: [
      {
        data: [30, 25, 25, 20],
        backgroundColor: ['#1A73E8', '#34A853', '#FBBC04', '#EA4335'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const importanceData = {
    labels: ['Vocal Jitter', 'Reaction Latency', 'Recall Gap', 'Pattern Speed', 'Tone Variance'],
    datasets: [
      {
        label: 'Feature Importance',
        data: [85, 72, 65, 45, 30],
        backgroundColor: '#1A73E8',
        borderRadius: 6,
      },
    ],
  }

  return (
    <section className="max-w-[900px] mx-auto mt-4 pb-8 fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-textPrimary">ML Model Insights</h1>
        <p className="text-base text-textSecondary mt-1">How CogniScan interprets multimodal cognitive signals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Model Specs */}
        <div className="bg-card rounded-[24px] shadow-card p-8 border-l-4 border-primary">
          <h3 className="text-lg font-semibold text-textPrimary mb-6 flex items-center gap-2">
            <span>🧠</span> Model Architecture
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-textSecondary">Primary Classifier</span>
              <span className="font-semibold px-3 py-1 bg-bg rounded-lg">RandomForest (Hybrid)</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-textSecondary">Feature Extraction</span>
              <span className="font-semibold px-3 py-1 bg-bg rounded-lg">On-Device (TensorFlow.js)</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-textSecondary">Training Dataset</span>
              <span className="font-semibold px-3 py-1 bg-bg rounded-lg">84k anonymized samples</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-textSecondary">Last Calibration</span>
              <span className="font-semibold px-3 py-1 bg-bg rounded-lg text-success">Today, 04:12 AM</span>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-card rounded-[24px] shadow-card p-8">
          <h3 className="text-sm font-semibold text-textSecondary uppercase tracking-widest mb-6 text-center">Score Composition</h3>
          <div className="h-[180px] flex items-center justify-center">
            <Doughnut
              data={donutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } } },
                cutout: '70%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Feature Importance */}
      <div className="bg-card rounded-[24px] shadow-card p-8">
        <h3 className="text-lg font-semibold text-textPrimary mb-8">Live Feature Importance</h3>
        <div className="h-[240px]">
          <Bar
            data={importanceData}
            options={{
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, border: { display: false }, ticks: { display: false } },
                y: { grid: { display: false }, border: { display: false }, ticks: { color: '#5F6368', font: { size: 12, weight: '500' } } },
              },
            }}
          />
        </div>
        <p className="mt-6 text-sm text-textSecondary leading-relaxed bg-bg p-4 rounded-xl border border-[#F1F3F4]">
          <span className="font-bold text-primary mr-2">Note:</span>
          Your weights are dynamically adjusted based on your personal historical variance. If your speech patterns are more consistent than your reaction times, the model prioritizes speech for anomaly detection.
        </p>
      </div>
    </section>
  )
}
