// public/worklets/audio-processor.js
class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.bufferSize = options.processorOptions.bufferSize || 2048;
    this.sampleRate = options.processorOptions.sampleRate || sampleRate;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    if (!input || !input.length) return true;
    const channel = input[0];

    // Calculate audio level for visualization
    let sum = 0;
    for (let i = 0; i < channel.length; i++) {
      sum += Math.abs(channel[i]);
    }
    const level = Math.min((sum / channel.length) * 100, 100);

    // Fill the buffer
    for (let i = 0; i < channel.length; i++) {
      if (this.bufferIndex < this.bufferSize) {
        this.buffer[this.bufferIndex++] = channel[i];
      }
    }

    // If buffer is full, send it
    if (this.bufferIndex >= this.bufferSize) {
      // Convert to 16-bit PCM
      const pcmData = new Int16Array(this.bufferSize);
      for (let i = 0; i < this.bufferSize; i++) {
        // Convert float32 (-1.0 to 1.0) to int16 (-32768 to 32767)
        pcmData[i] = Math.max(Math.min(Math.floor(this.buffer[i] * 32767), 32767), -32768);
      }

      // Send the buffer
      this.port.postMessage({
        pcmData: pcmData.buffer,
        level: level,
      }, [pcmData.buffer]);

      // Reset buffer
      this.buffer = new Float32Array(this.bufferSize);
      this.bufferIndex = 0;
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
