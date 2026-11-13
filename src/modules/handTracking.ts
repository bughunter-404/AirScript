import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { DelegateMode, HandTrackingFrame, NormalizedPoint } from '../types/airwrite';

const CDN_WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm';
const CDN_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

export class HandTracker {
  private landmarker: HandLandmarker | null = null;
  private activeDelegate: 'GPU' | 'CPU' = 'CPU';
  private lastTimestampMs = 0;
  private lastInferenceAtMs = 0;
  private fpsSamples: number[] = [];
  private isInitializing = false;

  getActiveDelegate(): 'GPU' | 'CPU' {
    return this.activeDelegate;
  }

  isReady(): boolean {
    return this.landmarker !== null;
  }

  async initialize(delegateMode: DelegateMode = 'AUTO'): Promise<'GPU' | 'CPU'> {
    if (this.isInitializing) {
      return this.activeDelegate;
    }
    this.isInitializing = true;

    try {
      this.dispose();

      const localWasmUrl = new URL('mediapipe/wasm', document.baseURI).href.replace(/\/$/, '');
      const localModelUrl = new URL('mediapipe/models/hand_landmarker.task', document.baseURI).href;

      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks(localWasmUrl);
      } catch {
        // Fallback to CDN WASM if local files fail to resolve
        vision = await FilesetResolver.forVisionTasks(CDN_WASM_URL);
      }

      const delegatesToTry: Array<'GPU' | 'CPU'> =
        delegateMode === 'CPU'
          ? ['CPU']
          : delegateMode === 'GPU'
          ? ['GPU', 'CPU']
          : ['GPU', 'CPU'];

      const modelSources = [localModelUrl, CDN_MODEL_URL];

      let lastError: unknown = null;

      for (const delegate of delegatesToTry) {
        for (const modelAssetPath of modelSources) {
          try {
            this.landmarker = await HandLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath,
                delegate,
              },
              runningMode: 'VIDEO',
              numHands: 2,
              minHandDetectionConfidence: 0.55,
              minHandPresenceConfidence: 0.55,
              minTrackingConfidence: 0.55,
            });
            this.activeDelegate = delegate;
            this.lastTimestampMs = 0;
            this.lastInferenceAtMs = 0;
            this.fpsSamples = [];
            return delegate;
          } catch (err) {
            lastError = err;
          }
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error('Unable to initialize MediaPipe Hand Landmarker.');
    } finally {
      this.isInitializing = false;
    }
  }

  processFrame(
    video: HTMLVideoElement,
    nowMs: number,
    targetFps = 30
  ): HandTrackingFrame | null {
    if (!this.landmarker) {
      return null;
    }

    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const minIntervalMs = targetFps > 0 ? 1000 / targetFps : 0;
    if (this.lastInferenceAtMs > 0 && nowMs - this.lastInferenceAtMs < minIntervalMs) {
      return null;
    }

    // MediaPipe VIDEO mode requires strictly monotonically increasing integer/float timestamps
    const safeTimestamp = Math.max(Math.round(nowMs), this.lastTimestampMs + 1);
    this.lastTimestampMs = safeTimestamp;

    const startPerf = performance.now();
    let result: HandLandmarkerResult;
    try {
      result = this.landmarker.detectForVideo(video, safeTimestamp);
    } catch {
      return null;
    }
    const inferenceTimeMs = performance.now() - startPerf;

    if (this.lastInferenceAtMs > 0) {
      const dt = nowMs - this.lastInferenceAtMs;
      if (dt > 0) {
        const currentFps = 1000 / dt;
        this.fpsSamples.push(currentFps);
        if (this.fpsSamples.length > 15) {
          this.fpsSamples.shift();
        }
      }
    }
    this.lastInferenceAtMs = nowMs;

    const avgFps =
      this.fpsSamples.length > 0
        ? Math.round(
            this.fpsSamples.reduce((acc, v) => acc + v, 0) / this.fpsSamples.length
          )
        : 0;

    const landmarks: NormalizedPoint[][] = (result.landmarks || []).map((hand) =>
      hand.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z }))
    );

    const handedness: string[] = (result.handedness || []).map(
      (cats) => cats[0]?.categoryName || 'Unknown'
    );

    return {
      landmarks,
      handedness,
      inferenceTimeMs,
      fps: avgFps,
    };
  }

  dispose(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {
        // Ignore disposal errors
      }
      this.landmarker = null;
    }
    this.lastTimestampMs = 0;
    this.lastInferenceAtMs = 0;
    this.fpsSamples = [];
  }
}
