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
    <nav className="fixed top-0 left-0 right-0 h-[72px] bg-card/80 backdrop-blur-md z-50 border-b border-[#F1F3F4]">
      <div className="max-w-[1100px] mx-auto h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <NavLink to="/" className="text-2xl font-bold tracking-tighter text-textPrimary select-none">
            Cogni<span className="text-primary">Scan</span>
          </NavLink>
          
          <div className="hidden md:flex gap-8 text-[14px]">
            {links.map((link) => (
              <NavLink 
                key={link.to} 
                to={link.to}
                className={({ isActive }) => 
                  `relative py-1 transition-colors hover:text-primary ${
                    isActive ? 'text-primary font-medium' : 'text-textSecondary font-normal'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary rounded-full fade-in"></span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-baseline hover:border-primary hover:text-primary transition-all text-sm font-medium text-textSecondary"
          >
            <span className="w-2 h-2 rounded-full bg-alert"></span>
            Caregiver
          </button>
        </div>
      </div>
    </nav>
  )
}
