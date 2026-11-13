import type { GestureResult, GestureType, NormalizedPoint } from '../types/airwrite';
import { distance2D } from '../utils/coordinates';

// MediaPipe 21 Hand Landmark Indices
const WRIST = 0;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_PIP = 14;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_TIP = 20;

export class GestureDetector {
  private stableGesture: GestureType = 'NO_HAND';
  private candidateGesture: GestureType = 'NO_HAND';
  private candidateFrames = 0;

  reset(): void {
    this.stableGesture = 'NO_HAND';
    this.candidateGesture = 'NO_HAND';
    this.candidateFrames = 0;
  }

  private getPalmScale(hand: NormalizedPoint[]): number {
    const wristToMiddleMcp = distance2D(hand[WRIST], hand[MIDDLE_MCP]);
    const indexToPinkyMcp = distance2D(hand[INDEX_MCP], hand[PINKY_MCP]);
    return Math.max((wristToMiddleMcp + indexToPinkyMcp) * 0.5, 0.04);
  }

  private isFingerExtended(
    hand: NormalizedPoint[],
    mcpIdx: number,
    pipIdx: number,
    tipIdx: number,
    palmScale: number
  ): boolean {
    const wrist = hand[WRIST];
    const mcp = hand[mcpIdx];
    const pip = hand[pipIdx];
    const tip = hand[tipIdx];

    const tipToWrist = distance2D(tip, wrist);
    const pipToWrist = distance2D(pip, wrist);
    const tipToMcp = distance2D(tip, mcp);

    return tipToWrist > pipToWrist * 1.1 && tipToMcp > palmScale * 0.52;
  }

  private isFingerFolded(
    hand: NormalizedPoint[],
    mcpIdx: number,
    pipIdx: number,
    tipIdx: number,
    palmScale: number
  ): boolean {
    const wrist = hand[WRIST];
    const mcp = hand[mcpIdx];
    const pip = hand[pipIdx];
    const tip = hand[tipIdx];

    const tipToWrist = distance2D(tip, wrist);
    const pipToWrist = distance2D(pip, wrist);
    const tipToMcp = distance2D(tip, mcp);

    return tipToWrist < pipToWrist * 1.07 || tipToMcp < palmScale * 0.46;
  }

  private selectPrimaryHand(hands: NormalizedPoint[][]): NormalizedPoint[] | null {
    if (!hands || hands.length === 0) {
      return null;
    }
    if (hands.length === 1) {
      return hands[0];
    }

    let bestHand = hands[0];
    let bestScale = this.getPalmScale(hands[0]);
    for (let i = 1; i < hands.length; i++) {
      const scale = this.getPalmScale(hands[i]);
      if (scale > bestScale) {
        bestScale = scale;
        bestHand = hands[i];
      }
    }
    return bestHand;
  }

  detect(hands: NormalizedPoint[][]): GestureResult {
    const handCount = hands.length;
    const hand = this.selectPrimaryHand(hands);

    if (!hand || hand.length < 21) {
      this.stableGesture = 'NO_HAND';
      this.candidateGesture = 'NO_HAND';
      this.candidateFrames = 0;

      return {
        gesture: 'NO_HAND',
        rawGesture: 'NO_HAND',
        confidence: 0,
        indexTip: null,
        handCount: 0,
      };
    }

    const palmScale = this.getPalmScale(hand);
    const indexTip = hand[INDEX_TIP];

    const indexExtended = this.isFingerExtended(hand, INDEX_MCP, INDEX_PIP, INDEX_TIP, palmScale);
    const middleExtended = this.isFingerExtended(hand, MIDDLE_MCP, MIDDLE_PIP, MIDDLE_TIP, palmScale);
    const ringExtended = this.isFingerExtended(hand, RING_MCP, RING_PIP, RING_TIP, palmScale);
    const pinkyExtended = this.isFingerExtended(hand, PINKY_MCP, PINKY_PIP, PINKY_TIP, palmScale);

    const indexFolded = this.isFingerFolded(hand, INDEX_MCP, INDEX_PIP, INDEX_TIP, palmScale);
    const middleFolded = this.isFingerFolded(hand, MIDDLE_MCP, MIDDLE_PIP, MIDDLE_TIP, palmScale);
    const ringFolded = this.isFingerFolded(hand, RING_MCP, RING_PIP, RING_TIP, palmScale);
    const pinkyFolded = this.isFingerFolded(hand, PINKY_MCP, PINKY_PIP, PINKY_TIP, palmScale);

    const otherExtendedCount =
      (middleExtended ? 1 : 0) +
      (ringExtended ? 1 : 0) +
      (pinkyExtended ? 1 : 0);

    let rawGesture: GestureType = 'OPEN_PALM';
    let confidence = 0.8;

    if (indexFolded && middleFolded && ringFolded && pinkyFolded) {
      rawGesture = 'CLOSED_FIST';
      confidence = 0.92;
    } else if (
      indexExtended &&
      (this.stableGesture === 'INDEX_DRAW'
        ? !middleExtended && !ringExtended
        : middleFolded && ringFolded && pinkyFolded)
    ) {
      // Index finger raised alone -> active drawing / erasing
      rawGesture = 'INDEX_DRAW';
      confidence = 0.94;
    } else if (indexExtended && otherExtendedCount >= 1) {
      // Two or more fingers / open palm -> lift pen and move cursor without drawing
      rawGesture = 'OPEN_PALM';
      confidence = 0.9;
    } else {
      rawGesture = 'OPEN_PALM';
      confidence = 0.72;
    }

    // Temporal debouncing (2 frames) to avoid stray dots or flicker
    if (rawGesture === this.stableGesture) {
      this.candidateGesture = rawGesture;
      this.candidateFrames = 0;
    } else {
      if (rawGesture === this.candidateGesture) {
        this.candidateFrames += 1;
      } else {
        this.candidateGesture = rawGesture;
        this.candidateFrames = 1;
      }

      if (this.candidateFrames >= 2) {
        this.stableGesture = rawGesture;
        this.candidateFrames = 0;
      }
    }

    return {
      gesture: this.stableGesture,
      rawGesture,
      confidence,
      indexTip,
      handCount,
    };
  }
}
