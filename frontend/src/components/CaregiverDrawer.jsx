import { useCognitive } from '../context/CognitiveContext.jsx'

export default function CaregiverDrawer() {
  const { alertEnabled, setAlertEnabled, isDrawerOpen, setIsDrawerOpen } = useCognitive()

  if (!isDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-[100] fade-in">
      <div
        className="absolute inset-0 bg-textPrimary/20 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      ></div>
      
      <aside className="absolute top-0 right-0 h-full w-full sm:w-[480px] bg-card shadow-2xl flex flex-col slide-up duration-300">
        <div className="p-8 border-b border-[#F1F3F4] flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight text-textPrimary">Caregiver Portal</h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="bg-[#E8F0FD] p-6 rounded-[20px] mb-8">
            <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Setup Alerts</h4>
            <p className="text-[13px] text-textSecondary leading-relaxed">
              Enable smart notifications to stay informed if significant drifts from baseline are detected via our multimodal models.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-[#F1F3F4] rounded-[16px]">
              <div className="flex flex-col">
                <span className="font-semibold text-textPrimary text-sm">Critical Drift Alerts</span>
                <span className="text-xs text-textSecondary">Notify when baseline drops {'>'} 15%</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={alertEnabled}
                  onChange={(e) => setAlertEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-baseline rounded-full peer peer-focus:ring-4 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <div className="p-4 border border-[#F1F3F4] rounded-[16px] opacity-60">
              <span className="font-semibold text-textPrimary text-sm block mb-1">Threshold Setting</span>
              <div className="w-full bg-bg h-2 rounded-full mt-4">
                <div className="bg-primary h-full rounded-full w-[60%]"></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-textSecondary uppercase">
                <span>Safe</span>
                <span>Calibrating</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-bg">
          <button className="w-full bg-primary text-white py-4 rounded-[16px] font-semibold hover:bg-[#155DB1] transition-all shadow-lg shadow-primary/20">
            Save Sync Settings
          </button>
        </div>
      </aside>
    </div>
  )
}
