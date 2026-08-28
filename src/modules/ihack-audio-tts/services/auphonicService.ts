
import { AuphonicConfig } from '../types/ihackAudioTypes';

/**
 * Auphonic API Service (v2.8)
 * Streamlined Cloud Mastering via Presets.
 */
export class AuphonicService {
  private baseUrl = 'https://auphonic.com/api';

  /**
   * Orchestrates the 3-step Auphonic workflow: Create -> Upload -> Start.
   */
  async processAudio(
    file: File,
    config: AuphonicConfig,
    onStatusUpdate?: (status: string, progress: number) => void
  ): Promise<Blob> {
    const { apiKey, presetUuid } = config;

    // 1. CREATE PRODUCTION
    onStatusUpdate?.('Initializing Cloud Production...', 5);
    
    const body: any = {
      preset: presetUuid,
      metadata: {
        title: `iHack Neural Master: ${file.name}`
      }
    };

    const createResponse = await fetch(`${this.baseUrl}/productions.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!createResponse.ok) {
      const err = await createResponse.json().catch(() => ({ error_message: 'Handshake failed.' }));
      throw new Error(err.error_message || 'Auphonic initialization error.');
    }

    const { data: { uuid } } = await createResponse.json();

    // 2. UPLOAD FILE
    onStatusUpdate?.('Uploading high-res session...', 15);
    const uploadData = new FormData();
    uploadData.append('input_file', file);

    const uploadResponse = await fetch(`${this.baseUrl}/production/${uuid}/upload.json`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: uploadData
    });

    if (!uploadResponse.ok) throw new Error('Cloud upload failed.');

    // 3. TRIGGER START
    onStatusUpdate?.('Starting Cloud Mastering...', 25);
    await fetch(`${this.baseUrl}/production/${uuid}/start.json`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    return this.pollProductionStatus(uuid, apiKey, onStatusUpdate);
  }

  private async pollProductionStatus(
    uuid: string,
    apiKey: string,
    onStatusUpdate?: (status: string, progress: number) => void
  ): Promise<Blob> {
    let isDone = false;
    let attempts = 0;
    const maxAttempts = 150; 

    while (!isDone && attempts < maxAttempts) {
      const response = await fetch(`${this.baseUrl}/production/${uuid}.json`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Polling connection dropped.');

      const result = await response.json();
      const status = result.data.status_string;
      const progress = result.data.progress || 0;

      onStatusUpdate?.(`Processing: ${status}`, 30 + (progress * 0.65));

      if (status === 'Done') {
        isDone = true;
        const outputUrl = result.data.output_files[0].download_url;
        return this.downloadResult(outputUrl, apiKey, onStatusUpdate);
      } else if (status === 'Error') {
        throw new Error(`Auphonic Error: ${result.data.error_message}`);
      }

      attempts++;
      await new Promise(res => setTimeout(res, 5000)); 
    }

    throw new Error('Mastering session timed out.');
  }

  private async downloadResult(
    url: string,
    apiKey: string,
    onStatusUpdate?: (status: string, progress: number) => void
  ): Promise<Blob> {
    onStatusUpdate?.('Retrieving High-Res Master...', 95);
    const authUrl = `${url}${url.includes('?') ? '&' : '?'}bearer_token=${apiKey}`;
    const response = await fetch(authUrl);
    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
    return await response.blob();
  }
}

export const auphonicService = new AuphonicService();
