// frontend/src/components/layout/DashboardLayout.tsx — REPLACE ENTIRE FILE
import { Outlet } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';
import Navbar from '../dashboard/Navbar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { useUIStore } from '../../store/uiStore';
import { useSocket } from '../../hooks/useSocket';

const DashboardLayout = () => {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  // Establish and maintain socket connection for the entire authenticated session
  useSocket();

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Desktop Sidebar — always visible, fixed left panel ── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r bg-card">
        <Sidebar />
      </aside>

      {/* ── Mobile Sidebar — Sheet drawer, triggered by Navbar hamburger ── */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          {/* Close sidebar on nav item click — good mobile UX */}
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ── Main content area ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
