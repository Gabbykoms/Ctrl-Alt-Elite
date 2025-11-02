import { Menu, X } from 'lucide-react'

interface HeaderProps {
  onMenuToggle: (open: boolean) => void
  isMenuOpen: boolean
}

export default function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 bg-primary text-white h-16 flex items-center justify-between px-4 z-50 shadow-md">
      <h1 className="text-xl font-bold">Bantam Shuttle</h1>
      <button
        onClick={() => onMenuToggle(!isMenuOpen)}
        className="p-2 hover:bg-opacity-90"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </header>
  )
}
