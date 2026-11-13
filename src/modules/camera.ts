import type { CameraDeviceInfo } from '../types/airwrite';
import { checkBrowserSupport, mapCameraError } from '../utils/helpers';

export interface StartCameraOptions {
  deviceId?: string;
  idealWidth?: number;
  idealHeight?: number;
  onTrackEnded?: () => void;
}

export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private onTrackEndedCallback: (() => void) | null = null;

  async listVideoDevices(): Promise<CameraDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
    } catch {
      return [];
    }
  }

  async start(
    videoElement: HTMLVideoElement,
    options: StartCameraOptions = {}
  ): Promise<{ width: number; height: number; devices: CameraDeviceInfo[] }> {
    const support = checkBrowserSupport();
    if (!support.supported) {
      throw new Error(support.reason || 'Browser does not support camera access.');
    }

    // Stop any existing stream before opening a new one
    this.stop();

    const availableDevices = await this.listVideoDevices();
    if (availableDevices.length === 0) {
      // Note: some browsers expose empty list only when truly no camera hardware exists
      const allDevices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      if (allDevices.length > 0 && !allDevices.some((d) => d.kind === 'videoinput')) {
        throw new Error(
          'No webcam was detected. Connect a camera and ensure it is enabled in your operating system.'
        );
      }
    }

    const {
      deviceId,
      idealWidth = 1280,
      idealHeight = 720,
      onTrackEnded,
    } = options;

    this.onTrackEndedCallback = onTrackEnded ?? null;

    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: idealWidth },
      height: { ideal: idealHeight },
      frameRate: { ideal: 30, max: 60 },
      ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }),
    };

    let mediaStream: MediaStream;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
    } catch (error) {
      // Fallback to unconstrained video if requested resolution or deviceId is unsupported
      if (
        error instanceof DOMException &&
        (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError')
      ) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: deviceId ? { deviceId: { ideal: deviceId } } : true,
            audio: false,
          });
        } catch (fallbackError) {
          throw new Error(mapCameraError(fallbackError));
        }
      } else {
        throw new Error(mapCameraError(error));
      }
    }

    this.stream = mediaStream;
    this.videoElement = videoElement;

    const tracks = mediaStream.getVideoTracks();
    if (tracks.length === 0) {
      this.stop();
      throw new Error('Camera opened without an active video track.');
    }

    tracks.forEach((track) => {
      track.addEventListener('ended', this.handleTrackEnded);
    });

    videoElement.srcObject = mediaStream;
    videoElement.playsInline = true;
    videoElement.muted = true;

    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error('Camera stream timed out before video frames became ready.'));
      }, 10000);

      const onLoadedMetadata = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error('Failed to load video stream metadata from camera.'));
      };

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.removeEventListener('error', onError);
      };

      if (videoElement.readyState >= 1) {
        cleanup();
        resolve();
      } else {
        videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.addEventListener('error', onError);
      }
    });

    try {
      await videoElement.play();
    } catch (playErr) {
      this.stop();
      throw new Error(mapCameraError(playErr));
    }

    if (videoElement.videoWidth <= 0 || videoElement.videoHeight <= 0) {
      this.stop();
      throw new Error('Camera returned an invalid video resolution (0×0).');
    }

    const updatedDevices = await this.listVideoDevices();

    return {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
      devices: updatedDevices,
    };
  }

  private handleTrackEnded = () => {
    this.stop();
    this.onTrackEndedCallback?.();
  };

  isActive(): boolean {
    return Boolean(
      this.stream &&
        this.stream.getVideoTracks().some((track) => track.readyState === 'live')
    );
  }

  stop(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.removeEventListener('ended', this.handleTrackEnded);
        try {
          track.stop();
        } catch {
          // Ignore track stop errors during cleanup
        }
      }
      this.stream = null;
    }

    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.srcObject = null;
      } catch {
        // Ignore cleanup errors
      }
      this.videoElement = null;
    }
  }
}
