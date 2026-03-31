import { Outlet } from 'react-router';
import TitleBar from './TitleBar';

export default function AppLayout() {
  return (
    <div className="h-screen flex flex-col">
      <TitleBar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
