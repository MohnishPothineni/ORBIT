import { DeviceError, type PipecatClientOptions, type RTVIEventCallbacks, type Tracks } from "@pipecat-ai/client-js";

/**
 * A microphone-only media manager for SmallWebRTCTransport that uses plain
 * getUserMedia. The transport's default (DailyMediaManager) wraps daily-js,
 * which loads its call-machine bundle from Daily's CDN — not allowed on an
 * offline, local-only console.
 *
 * Implements the members SmallWebRTCTransport calls on its media manager
 * (checked against @pipecat-ai/small-webrtc-transport 1.11.2).
 */
export class LocalMediaManager {
  private callbacks: RTVIEventCallbacks = {};
  private options: PipecatClientOptions | null = null;
  private micOn = true;
  private stream: MediaStream | null = null;
  private initialized = false;
  private selectedMicInfo: MediaDeviceInfo | Record<string, never> = {};
  private selectedSpeakerInfo: MediaDeviceInfo | Record<string, never> = {};
  private preferredMicId: string | null = null;

  /** Called with the new track whenever the microphone track is replaced. */
  onLocalTrackReplaced: ((track: MediaStreamTrack) => Promise<void> | void) | null = null;

  setUserAudioCallback(): void {
    /* not used: audio goes over WebRTC, not as PCM chunks */
  }

  setClientOptions(options: PipecatClientOptions, override = false): void {
    if (this.options && !override) return;
    this.options = options;
    this.callbacks = options.callbacks ?? {};
    this.micOn = options.enableMic ?? true;
  }

  get supportsScreenShare(): boolean {
    return false;
  }

  get mediaSupport() {
    return { screenShare: false, userVideo: false };
  }

  private async openMic(deviceId: string | null): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) {
      const err = new DeviceError(["mic"], "undefined-mediadevices", "This browser cannot access a microphone.");
      this.callbacks.onDeviceError?.(err);
      throw err;
    }
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      const type =
        name === "NotAllowedError" || name === "SecurityError"
          ? "permissions"
          : name === "NotFoundError"
            ? "not-found"
            : name === "NotReadableError"
              ? "in-use"
              : name === "OverconstrainedError"
                ? "constraints"
                : "unknown";
      const err = new DeviceError(["mic"], type, e instanceof Error ? e.message : "Microphone unavailable");
      this.callbacks.onDeviceError?.(err);
      throw err;
    }
  }

  private async publishDevices(): Promise<void> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.callbacks.onAvailableMicsUpdated?.(devices.filter((d) => d.kind === "audioinput"));
    this.callbacks.onAvailableSpeakersUpdated?.(devices.filter((d) => d.kind === "audiooutput"));
    const track = this.stream?.getAudioTracks()[0];
    const id = track?.getSettings().deviceId;
    const info = devices.find((d) => d.kind === "audioinput" && d.deviceId === id);
    if (info) {
      this.selectedMicInfo = info;
      this.callbacks.onMicUpdated?.(info);
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.stream = await this.openMic(this.preferredMicId);
    const track = this.stream.getAudioTracks()[0];
    if (track) {
      track.enabled = this.micOn;
      this.callbacks.onTrackStarted?.(track, { id: "local", local: true, name: "local" });
    }
    await this.publishDevices();
    this.initialized = true;
  }

  async connect(): Promise<void> {
    if (!this.initialized) await this.initialize();
  }

  async disconnect(): Promise<void> {
    this.stream?.getTracks().forEach((t) => {
      t.stop();
      this.callbacks.onTrackStopped?.(t, { id: "local", local: true, name: "local" });
    });
    this.stream = null;
    this.initialized = false;
  }

  private async listDevices(kind: MediaDeviceKind): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === kind);
  }

  getAllMics(): Promise<MediaDeviceInfo[]> {
    return this.listDevices("audioinput");
  }

  getAllCams(): Promise<MediaDeviceInfo[]> {
    return Promise.resolve([]);
  }

  getAllSpeakers(): Promise<MediaDeviceInfo[]> {
    return this.listDevices("audiooutput");
  }

  async updateMic(micId: string): Promise<void> {
    this.preferredMicId = micId;
    if (!this.initialized) return;
    const next = await this.openMic(micId);
    const track = next.getAudioTracks()[0];
    if (!track) return;
    track.enabled = this.micOn;
    const old = this.stream;
    this.stream = next;
    await this.onLocalTrackReplaced?.(track);
    old?.getTracks().forEach((t) => t.stop());
    this.callbacks.onTrackStarted?.(track, { id: "local", local: true, name: "local" });
    await this.publishDevices();
  }

  updateCam(): void {
    /* microphone only */
  }

  updateSpeaker(speakerId: string): void {
    this.selectedSpeakerInfo = { deviceId: speakerId } as MediaDeviceInfo;
    this.callbacks.onSpeakerUpdated?.(this.selectedSpeakerInfo as MediaDeviceInfo);
  }

  get selectedMic(): MediaDeviceInfo | Record<string, never> {
    return this.selectedMicInfo;
  }

  get selectedCam(): Record<string, never> {
    return {};
  }

  get selectedSpeaker(): MediaDeviceInfo | Record<string, never> {
    return this.selectedSpeakerInfo;
  }

  enableMic(enable: boolean): void {
    this.micOn = enable;
    this.stream?.getAudioTracks().forEach((t) => {
      t.enabled = enable;
    });
  }

  enableCam(): void {
    /* microphone only */
  }

  enableScreenShare(): void {
    throw new Error("Screen sharing is not supported on this console.");
  }

  get isCamEnabled(): boolean {
    return false;
  }

  get isMicEnabled(): boolean {
    return this.micOn;
  }

  get isSharingScreen(): boolean {
    return false;
  }

  tracks(): Tracks {
    return { local: { audio: this.stream?.getAudioTracks()[0] } };
  }
}
