import { describe, expect, it, vi } from 'vitest';
import {
  getRestAlertCapabilities,
  playRestCompletionSound,
  requestRestNotificationPermission,
  REST_SOUND_TYPES,
  showRestSystemNotification,
} from './restAlerts';

describe('alternativas ao alerta de descanso', () => {
  it('detecta som e notificação sem gerar erro em navegadores incompatíveis', () => {
    expect(getRestAlertCapabilities({ windowObject: {}, notificationObject: null })).toEqual({
      secureContext: true,
      soundSupported: false,
      notificationSupported: false,
      notificationPermission: 'unsupported',
    });
  });

  it('solicita permissão apenas quando a API existe', async () => {
    expect(await requestRestNotificationPermission(null)).toEqual({ enabled: false, permission: 'unsupported' });
    const notificationObject = { permission: 'default', requestPermission: vi.fn(async () => 'granted') };
    await expect(requestRestNotificationPermission(notificationObject)).resolves.toEqual({ enabled: true, permission: 'granted' });
  });

  it('gera o padrão sonoro escolhido com volume limitado', async () => {
    const oscillator = {
      connect: vi.fn(),
      frequency: { setValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
    };
    const gain = {
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    };
    class FakeAudioContext {
      constructor() {
        this.currentTime = 10;
        this.state = 'running';
        this.destination = {};
      }
      createOscillator = vi.fn(() => oscillator);
      createGain = vi.fn(() => gain);
    }

    await expect(playRestCompletionSound({
      type: REST_SOUND_TYPES.single,
      volume: 2,
      windowObject: { AudioContext: FakeAudioContext },
    })).resolves.toEqual({ played: true, reason: 'played' });
    expect(oscillator.start).toHaveBeenCalledWith(10);
    expect(oscillator.stop).toHaveBeenCalledTimes(1);
  });

  it('usa o service worker quando o app está em segundo plano', async () => {
    const showNotification = vi.fn(async () => undefined);
    const result = await showRestSystemNotification({
      timerId: 'timer-1',
      documentObject: { visibilityState: 'hidden' },
      navigatorObject: { serviceWorker: { ready: Promise.resolve({ showNotification }) } },
      notificationObject: { permission: 'granted' },
    });
    expect(result).toEqual({ shown: true, reason: 'service-worker' });
    expect(showNotification).toHaveBeenCalledWith('Descanso concluído', expect.objectContaining({ tag: 'solo-rest-timer-1' }));
  });

  it('não cria notificação do sistema com o app visível ou sem permissão', async () => {
    await expect(showRestSystemNotification({ documentObject: { visibilityState: 'visible' }, notificationObject: { permission: 'granted' } }))
      .resolves.toEqual({ shown: false, reason: 'visible' });
    await expect(showRestSystemNotification({ documentObject: { visibilityState: 'hidden' }, notificationObject: { permission: 'denied' } }))
      .resolves.toEqual({ shown: false, reason: 'permission' });
  });
});
