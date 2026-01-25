// lib/soundSystem.ts

export class SoundSystem {
  private audioContext: AudioContext | null = null;
  private elevenLabsApiKey: string | undefined;
  private soundsEnabled: boolean = true;

  constructor(apiKey?: string) {
    this.elevenLabsApiKey = apiKey;
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Check if user has enabled sounds (localStorage)
      this.soundsEnabled = localStorage.getItem('arise_sounds') !== 'false';
    }
  }

  toggleSounds() {
    this.soundsEnabled = !this.soundsEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('arise_sounds', String(this.soundsEnabled));
    }
    return this.soundsEnabled;
  }

  // Play simple sound effects (fast, free)
  async playSound(type: 'xp_gain' | 'xp_loss' | 'level_up' | 'achievement') {
    if (!this.soundsEnabled) return;

    const sounds = {
      xp_gain: '/sounds/coin.mp3',
      xp_loss: '/sounds/hit.mp3',
      level_up: '/sounds/fanfare.mp3',
      achievement: '/sounds/success.mp3'
    };

    try {
      const audio = new Audio(sounds[type]);
      // Boost volume for fanfare to make it more celebratory
      audio.volume = type === 'level_up' ? 0.8 : 0.5;
      await audio.play();
    } catch (error) {
      console.log('Sound playback failed (user may need to interact first):', error);
    }
  }

  // Use ElevenLabs for voice announcements (special moments only)
  async playVoiceAnnouncement(text: string, voiceId: string = 'pNInz6obpgDQGcFmaJgB') {
    if (!this.soundsEnabled || !this.elevenLabsApiKey) {
      // Fallback to regular sound
      await this.playSound('level_up');
      return;
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) throw new Error('ElevenLabs API error');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.volume = 0.7;
      await audio.play();
      
      // Cleanup
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error('Voice announcement failed:', error);
      // Fallback to simple sound
      await this.playSound('level_up');
    }
  }

  // Smart announcements based on stat changes
  async announceStatChange(stat: string, change: number, newLevel?: number, oldLevel?: number) {
    if (!this.soundsEnabled) return;

    // Level up! (Use voice for this special moment)
    if (newLevel && oldLevel && newLevel > oldLevel) {
      await this.playSound('level_up');
      await this.playVoiceAnnouncement(
        `Congratulations! You've reached ${stat} level ${newLevel}! Keep up the great work!`
      );
      return;
    }

    // Big XP gain (20+) - Use voice
    if (change >= 20) {
      await this.playSound('xp_gain');
      await this.playVoiceAnnouncement(`Awesome! Plus ${change} ${stat} XP!`);
      return;
    }

    // Medium XP gain (10-19) - Just sound + beep
    if (change >= 10) {
      await this.playSound('xp_gain');
      this.playBeep(523.25, 150, 'success'); // C5 note
      return;
    }

    // Small XP gain (1-9) - Just sound
    if (change > 0) {
      await this.playSound('xp_gain');
      return;
    }

    // XP loss - Sad sound
    if (change < 0) {
      await this.playSound('xp_loss');
      this.playBeep(329.63, 200, 'error'); // E4 note (lower, sadder)
      return;
    }
  }

  // Synthesize beep/tone (no API needed, instant feedback)
  playBeep(frequency: number = 440, duration: number = 200, type: 'success' | 'error' = 'success') {
    if (!this.soundsEnabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  // Play achievement sound with celebration
  async playAchievement(achievementName: string) {
    if (!this.soundsEnabled) return;
    
    await this.playSound('achievement');
    this.playBeep(659.25, 100, 'success'); // E5
    setTimeout(() => this.playBeep(783.99, 100, 'success'), 100); // G5
    setTimeout(() => this.playBeep(1046.50, 150, 'success'), 200); // C6
    
    if (this.elevenLabsApiKey) {
      await this.playVoiceAnnouncement(`Achievement unlocked: ${achievementName}!`);
    }
  }
}

// Singleton instance
let soundSystemInstance: SoundSystem | null = null;

export const getSoundSystem = () => {
  if (!soundSystemInstance && typeof window !== 'undefined') {
    soundSystemInstance = new SoundSystem(process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY);
  }
  return soundSystemInstance;
};