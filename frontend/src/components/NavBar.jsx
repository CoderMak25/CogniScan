import { NavLink } from 'react-router-dom'
import { useCognitive } from '../context/CognitiveContext.jsx'

export default function NavBar() {
  const { setIsDrawerOpen } = useCognitive()

  const links = [
    { to: '/tasks', label: 'Tasks' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/speech', label: 'Speech Analysis' },
    { to: '/insights', label: 'ML Insights' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 h-[80px] bg-white/70 backdrop-blur-xl z-50 border-b border-[#F1F3F4]/50 shadow-sm transition-all duration-300">
      <div className="max-w-[1200px] mx-auto h-full flex items-center justify-between px-8">
        <NavLink to="/" className="text-2xl font-black tracking-tighter text-textPrimary select-none group">
          Cogni<span className="text-primary group-hover:text-[#155DB1] transition-colors">Scan</span>
        </NavLink>
        
        <div className="hidden lg:flex gap-10 text-[12px] font-bold uppercase tracking-[0.2em] relative left-[-20px]">
          {links.map((link) => (
            <NavLink 
              key={link.to} 
              to={link.to}
              className={({ isActive }) => 
                `relative py-2 transition-all duration-300 hover:text-primary ${
                  isActive ? 'text-primary' : 'text-textSecondary opacity-60 hover:opacity-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-primary rounded-full slide-up shadow-[0_0_8px_rgba(26,115,232,0.4)]"></span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-bg border border-[#F1F3F4] hover:border-primary hover:text-primary btn-hover text-sm font-bold text-textSecondary shadow-sm group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-alert animate-pulse"></span>
            Monitor Caregiver
          </button>
        </div>
      </div>
    </nav>
  )
}
