export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary">Bantam Shuttle</h1>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
