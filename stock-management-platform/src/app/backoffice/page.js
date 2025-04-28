// Componente da página principal do Backoffice
export default function BackofficePage() {
    return (
      <div className="pt-0 p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold font-mono">Dashboard</h2>
        </div>
        
        <div className="bg-black p-8 rounded-lg shadow w-full max-w-2xl mx-auto">
          <p className="text-lg mb-4 font-mono">Welcome to Inventory Manager Dashboard.</p>
          <p className="text-lg font-mono">Select "Stock" from the side bar to manage your products.</p>
        </div>
      </div>
    )
  }