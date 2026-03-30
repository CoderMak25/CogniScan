import { Link } from 'react-router-dom'

export default function LandingHero() {
  return (
    <section className="fade-in pt-12 pb-20">
      <div className="text-center mb-16">
        <div className="bg-[#E8F0FD] text-primary text-xs font-semibold rounded-full px-4 py-1.5 inline-flex items-center gap-2 mb-8 uppercase tracking-wider">
          Early Awareness · Non-Clinical Tool
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-textPrimary max-w-[850px] mx-auto leading-[1.1] mb-6">
          Detect Cognitive Shifts <span className="text-primary italic">Before</span> They Surface
        </h1>
        <p className="text-xl text-textSecondary max-w-[650px] mx-auto font-normal leading-relaxed mb-10">
          CogniScan leverages everyday digital interactions to build a neuro-behavioral baseline, alerting you to subtle variations.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/tasks"
            className="w-full sm:w-auto bg-primary text-white rounded-[16px] px-10 py-5 font-semibold hover:bg-[#155DB1] transition-all shadow-lg shadow-primary/25 active:scale-95"
          >
            Begin Today&apos;s Baseline Check
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto bg-white text-textPrimary border border-[#F1F3F4] rounded-[16px] px-10 py-5 font-semibold hover:border-primary transition-all active:scale-95 shadow-sm"
          >
            Review Sample Metrics
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: 'Multimodal Feedback',
            desc: 'Combines speech analytics with motor and memory tasks.',
            icon: '📊',
          },
          {
            title: 'Encryption First',
            desc: 'All raw audio is processed on-device. We only store anonymized scores.',
            icon: '🔒',
          },
          {
            title: 'Caregiver Alerts',
            desc: 'Configurable notifications for family members if scores drift.',
            icon: '👨‍👩-👧',
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="bg-card p-10 rounded-[24px] shadow-card border border-[#F1F3F4] hover:border-primary/20 transition-all group"
          >
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
            <h3 className="text-lg font-bold text-textPrimary mb-3">{feature.title}</h3>
            <p className="text-sm text-textSecondary leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
