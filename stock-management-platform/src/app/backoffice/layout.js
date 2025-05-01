export const metadata = { // Define metadados da página, como o título que será exibido no navegador
    title: 'Backoffice - Inventory Management', // Define o título da aba da página
}

// Componente principal de layout para o Backoffice
export default function BackofficeLayout({ children }) {
return (
    <div className="flex min-h-screen bg-gray-130">
        {/* Sidebar */}
        <div className="w-64 bg-gray shadow-md">
            <div className="p-4 border-b">
                <h1 className="text-l font-bold font-mono">Inventory Management</h1>
            </div>

        <nav className="p-2">
            <ul className="space-y-1">
                <li>
                    <a
                        href="/backoffice"
                        className="block px-4 py-2 rounded hover:bg-gray-700 font-mono"
                    >
                        Dashboard
                    </a>
                </li>
                <li>
                    <a
                        href="/backoffice/stock"
                        className="block px-4 py-2 rounded hover:bg-gray-700 font-mono"
                    >
                        Stock
                    </a>
                    <a
                        href="/backoffice/requests"
                        className="block px-4 py-2 rounded hover:bg-gray-700 font-mono"
                    >
                        Requests
                    </a>
                    <a
                        href="/backoffice/history"
                        className="block px-4 py-2 rounded hover:bg-gray-700 font-mono"
                    >
                        History
                    </a>
                    <a
                        href="/backoffice/finances"
                        className="block px-4 py-2 rounded hover:bg-gray-700 font-mono"
                    >
                        Finances
                    </a>
                    <a
                        href="/backoffice/event"
                        className="block px-4 py-2 rounded hover:bg-gray-700 font-mono"
                    >
                        Event
                    </a>
                </li>
            </ul>
        </nav>
    </div>

    {/* Main content */}
    <div className="flex-1 p-6">
        {children}
    </div>
    </div>
)
}