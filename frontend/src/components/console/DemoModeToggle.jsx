import React from 'react';
import useAgentStore from '../../store/useAgentStore';
import { Switch } from '@headlessui/react';

/**
 * Toggle to switch between live NIM inference and deterministic seeded responses for the demo.
 */
const DemoModeToggle = () => {
  const { demoMode, setDemoMode } = useAgentStore();

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs ${demoMode ? 'text-shade-accent' : 'text-gray-500'}`}>
        DEMO MODE
      </span>
      <Switch
        checked={demoMode}
        onChange={setDemoMode}
        className={`${
          demoMode ? 'bg-shade-accent' : 'bg-gray-600'
        } relative inline-flex h-4 w-8 items-center rounded-full transition-colors`}
      >
        <span
          className={`${
            demoMode ? 'translate-x-5 bg-shade-dark' : 'translate-x-1 bg-white'
          } inline-block h-2 w-2 transform rounded-full transition-transform`}
        />
      </Switch>
    </div>
  );
};

export default DemoModeToggle;
