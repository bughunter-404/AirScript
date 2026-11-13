export interface BrowserSupportResult {
  supported: boolean;
  reason?: string;
}

export function checkBrowserSupport(): BrowserSupportResult {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Browser window is unavailable.' };
  }

  if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return {
      supported: false,
      reason: 'Camera access requires a secure HTTPS connection (or localhost).',
    };
  }

  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    return {
      supported: false,
      reason: 'This browser does not support WebRTC camera access (getUserMedia). Please use modern Chrome, Edge, or Firefox.',
    };
  }

  if (typeof WebAssembly === 'undefined') {
    return {
      supported: false,
      reason: 'WebAssembly is required for local hand tracking, but is disabled or unsupported in this browser.',
    };
  }

  const testCanvas = document.createElement('canvas');
  if (!testCanvas.getContext('2d')) {
    return {
      supported: false,
      reason: 'HTML5 2D Canvas is unavailable in this browser.',
    };
  }

  return { supported: true };
}

export function mapCameraError(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Camera permission was denied. Allow camera access in your browser site settings and click Start Camera again.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No webcam was detected. Connect a camera and ensure it is enabled in your operating system.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Your camera is currently in use by another application (such as Zoom, Teams, or another browser tab). Close the other app and try again.';
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        return 'The selected camera does not support the requested resolution. Try switching cameras or retrying.';
      case 'AbortError':
        return 'Camera initialization was interrupted before streaming could begin.';
      case 'SecurityError':
        return 'Camera access is blocked by browser security policy or an insecure origin.';
      default:
        return `Unable to start camera (${error.name}). Check your device permissions and try again.`;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An unexpected error occurred while accessing your camera.';
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  return target.isContentEditable;
}

export function generateExportFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `airscript-${datePart}-${timePart}.png`;
}

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
