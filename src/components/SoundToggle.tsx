'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getSoundSystem } from '@/lib/soundSystem';

export default function SoundToggle() {
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [soundSystem, setSoundSystem] = useState<any>(null);

  useEffect(() => {
    const system = getSoundSystem();
    setSoundSystem(system);
    if (system && typeof window !== 'undefined') {
      setSoundsEnabled(localStorage.getItem('arise_sounds') !== 'false');
    }
  }, []);

  const toggleSounds = () => {
    if (soundSystem) {
      const newState = soundSystem.toggleSounds();
      setSoundsEnabled(newState);
      
      // Play a quick test sound if enabling
      if (newState) {
        soundSystem.playBeep(440, 100, 'success');
      }
    }
  };

  return (
    <button
      onClick={toggleSounds}
      className="fixed bottom-6 right-6 bg-black/80 hover:bg-black text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
      title={soundsEnabled ? 'Mute sounds' : 'Enable sounds'}
    >
      {soundsEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
    </button>
  );
}