import { useState, useEffect } from 'react';
import { TabNavigation } from './components/TabNavigation';
import { Dashboard } from './components/screens/Dashboard';
import { Requests } from './components/screens/Requests';
import { Devices } from './components/screens/Devices';
import { Crew } from './components/screens/Crew';
import { More } from './components/screens/More';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');

  // Initialize theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const renderActiveScreen = () => {
    const commonProps = {
      className: "flex-1 overflow-auto px-4 pt-6"
    };

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard {...commonProps} />;
      case 'requests':
        return <Requests {...commonProps} />;
      case 'devices':
        return <Devices {...commonProps} />;
      case 'crew':
        return <Crew {...commonProps} />;
      case 'more':
        return <More {...commonProps} />;
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Status Bar Simulation */}
      <div className="h-11 bg-background flex items-center justify-center">
        <div className="w-full max-w-sm flex items-center justify-between px-6 text-sm">
          <div className="flex items-center space-x-1">
            <span className="font-medium">9:41</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-4 h-2.5 border border-foreground/30 rounded-sm">
                <div className="w-3 h-1.5 bg-foreground rounded-sm m-0.5"></div>
              </div>
              <div className="w-1 h-2.5 bg-foreground rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* App Header */}
      <div className="bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="font-bold text-accent-foreground text-sm">O</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">OBEDIO</h1>
              <p className="text-xs text-muted-foreground">Admin Control</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Maria Santos</p>
            <p className="text-xs text-muted-foreground">On Duty • 2h 15m left</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderActiveScreen()}

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notificationCount={4}
      />

      {/* Safe Area Bottom */}
      <div className="h-8 bg-background"></div>
    </div>
  );
}