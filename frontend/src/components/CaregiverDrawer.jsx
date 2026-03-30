import { useCognitive } from '../context/CognitiveContext.jsx'

export default function CaregiverDrawer() {
  const { alertEnabled, setAlertEnabled, isDrawerOpen, setIsDrawerOpen } = useCognitive()

  if (!isDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-[100] fade-in">
      <div
        className="absolute inset-0 bg-textPrimary/40 backdrop-blur-md transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      ></div>
      
      <aside className="absolute top-0 right-0 h-full w-full sm:w-[520px] bg-white shadow-2xl flex flex-col slide-up duration-500 rounded-l-[40px] overflow-hidden">
        <div className="p-10 border-b border-[#F1F3F4]/50 flex justify-between items-center bg-gradient-to-r from-white to-[#F8F9FA]">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-textPrimary uppercase">Caregiver Portal</h2>
            <p className="text-xs text-textSecondary font-bold uppercase tracking-widest mt-1 opacity-60">Baseline Monitoring & Alerts</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-bg border border-[#F1F3F4] hover:border-primary hover:text-primary transition-all text-xl font-bold active:scale-90"
          >
            ✕
          </button>
        </div>
        
        <div className="p-10 flex-1 overflow-y-auto space-y-10">
          <div className="bg-primary/5 border border-primary/10 p-8 rounded-[32px] relative overflow-hidden group">
            <div className="absolute -right-5 -top-5 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Model Configuration</h4>
            <h3 className="text-xl font-bold text-textPrimary mb-4">Neural Drift Detection</h3>
            <p className="text-[13px] text-textSecondary leading-relaxed font-medium">
              Our clinical-grade models monitor for subtle neuro-behavioral drifts. If performance falls outside your 30-day baseline sigma range, an alert will be dispatched.
            </p>
          </div>

          <div className="space-y-8">
            <div className="p-8 bg-card rounded-[32px] border border-[#F1F3F4] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <span className="font-black text-textPrimary text-sm uppercase tracking-tight">Real-time Notifications</span>
                  <span className="text-xs text-textSecondary font-medium">Push & Email alerts for caretakers</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={alertEnabled}
                    onChange={(e) => setAlertEnabled(e.target.checked)}
                  />
                  <div className="w-14 h-8 bg-baseline rounded-full peer peer-focus:ring-4 peer-focus:ring-primary/10 peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md"></div>
                </label>
              </div>
              
              <div className={`transition-all duration-500 overflow-hidden ${alertEnabled ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 bg-success/5 rounded-[24px] border border-success/10 border-dashed">
                  <p className="text-[11px] font-bold text-success uppercase leading-tight">
                    Alerts Active: Monitoring for 15% variance from mean consistency.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-bg rounded-[32px] border border-[#F1F3F4] opacity-80 group">
              <div className="flex justify-between items-center mb-6">
                <span className="font-black text-textPrimary text-sm uppercase tracking-tight">Sensitivity Threshold</span>
                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full italic">PRESET: Clinical</span>
              </div>
              <div className="w-full bg-white h-3 rounded-full overflow-hidden p-1 border border-[#F1F3F4]">
                <div className="bg-primary h-full rounded-full w-[72%] shadow-[0_0_8px_rgba(26,115,232,0.5)]"></div>
              </div>
              <div className="flex justify-between mt-4 text-[9px] font-black text-textSecondary uppercase tracking-[0.1em]">
                <span>Low Sensitivity</span>
                <span>Highly Responsive</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 bg-white border-t border-[#F1F3F4]/50">
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.15em] hover:bg-[#155DB1] btn-hover shadow-xl shadow-primary/30"
          >
            Update Configuration
          </button>
        </div>
      </aside>
    </div>
  )
}
