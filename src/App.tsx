import { useState } from 'react';
import type { ScreenId } from './types';
import { StoreProvider } from './store';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar, BottomNav, MobileHeader, DesktopHeader } from './components/Navigation';
import { GreetingHeader } from './components/GreetingHeader';
import { Dashboard } from './components/Dashboard';
import { PeriodScreen } from './screens/PeriodScreen';
import { MedsScreen } from './screens/MedsScreen';
import { MealsScreen } from './screens/MealsScreen';
import { WaterScreen } from './screens/WaterScreen';
import { FitnessScreen } from './screens/FitnessScreen';
import { SleepScreen } from './screens/SleepScreen';
import { PeriodLogModal } from './components/PeriodLogModal';

function App() {
  const [screen, setScreen] = useState<ScreenId>('dashboard');

  return (
    <ThemeProvider>
      <StoreProvider>
        <div className="min-h-screen bg-cream-50 dark:bg-night-900 text-plum-700 dark:text-night-text flex transition-colors duration-200">
          <Sidebar active={screen} onChange={setScreen} />

          <div className="flex-1 flex flex-col min-w-0">
            <MobileHeader />
            <DesktopHeader currentScreen={screen} />

            <main className="flex-1 px-5 md:px-8 py-6 pb-24 md:pb-8 max-w-5xl w-full mx-auto">
              <div key={screen} className="tab-slide-down">
                {screen === 'dashboard' && (
                  <div className="tab-stagger space-y-4 md:space-y-5">
                    <GreetingHeader onNavigate={setScreen} />
                    <Dashboard onNavigate={setScreen} />
                  </div>
                )}
                {screen === 'period' && <PeriodScreen />}
                {screen === 'meds' && <MedsScreen />}
                {screen === 'water' && <WaterScreen />}
                {screen === 'fitness' && <FitnessScreen />}
                {screen === 'meals' && <MealsScreen />}
                {screen === 'sleep' && <SleepScreen />}
              </div>
            </main>

            <BottomNav active={screen} onChange={setScreen} />
          </div>

          <PeriodLogModal />
        </div>
      </StoreProvider>
    </ThemeProvider>
  );
}

export default App;
