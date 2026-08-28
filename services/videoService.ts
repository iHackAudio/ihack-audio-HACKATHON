
export const createStaticVideo = async (
  imageSrc: string,
  audioBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    let audioContext: AudioContext | null = null;
    let interval: any = null;
    let recorder: MediaRecorder | null = null;

    try {
      // 1. Load Image first to get dimensions
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      // 2. Setup Canvas for YouTube Shorts (9:16)
      const canvas = document.createElement('canvas');
      const targetWidth = 1080;
      const targetHeight = 1920;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context failed");

      // Draw image covering the canvas (aspect fill)
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const drawX = (canvas.width / 2) - (drawW / 2);
      const drawY = (canvas.height / 2) - (drawH / 2);
      
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // 3. Setup Audio
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      await new Promise((res) => (audio.oncanplaythrough = res));
      
      // Use transient context logic to prevent leaks
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioSource = audioContext.createMediaElementSource(audio);
      const audioDestination = audioContext.createMediaStreamDestination();
      audioSource.connect(audioDestination);
      audioSource.connect(audioContext.destination);

      // 4. Capture Streams
      const canvasStream = canvas.captureStream(30); // 30 FPS
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
      ]);

      // 5. Setup Recorder
      const mimeType = 'video/webm;codecs=vp9,opus';
      recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        resolve(videoBlob);
        // CLEANUP: Close context to prevent hallucinations in future renders
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
      };

      // 6. Record
      audio.play();
      recorder.start();

      const duration = audio.duration;
      interval = setInterval(() => {
        const elapsed = audio.currentTime;
        if (onProgress) onProgress((elapsed / duration) * 100);
        
        // Re-draw frame to keep stream active (required for Chrome/Firefox streams)
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        if (audio.ended) {
          clearInterval(interval);
          if (recorder && recorder.state !== 'inactive') recorder.stop();
        }
      }, 100);

    } catch (err) {
      // Emergency Cleanup on Error
      if (interval) clearInterval(interval);
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
      reject(err);
    }
  });
};
