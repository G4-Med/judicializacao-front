import { Outlet } from 'react-router-dom';

export function MainLayout() {
  return (
    <div className="min-h-screen">
      <header className="p-3 border-bottom-1 surface-border">
        <h2 className="m-0">G4Med • Judicialização</h2>
      </header>

      <div className="flex">
        <aside
          className="p-3 border-right-1 surface-border"
          style={{ width: '260px', minHeight: 'calc(100vh - 61px)' }}
        >
          <p className="font-bold">Menu</p>
        </aside>

        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}