// GPU Hardware Acceleration Manager (NVIDIA NVENC / CUDA)
import { execSync, spawn } from 'child_process';
import fs from 'fs';

export class GpuManager {
  constructor() {
    this.gpuInfo = this.detectGpu();
  }

  detectGpu() {
    try {
      const output = execSync(
        'nvidia-smi --query-gpu=name,memory.total,memory.used,driver_version --format=csv,noheader,nounits',
        { encoding: 'utf-8', timeout: 6000 }
      ).trim();

      if (output) {
        const [name, memTotal, memUsed, driver] = output.split(',').map(s => s.trim());
        return {
          available: true,
          type: 'NVIDIA',
          name: name || 'NVIDIA GPU',
          memoryTotalMB: parseInt(memTotal) || 4096,
          memoryUsedMB: parseInt(memUsed) || 0,
          driverVersion: driver || 'Unknown',
          encoder: 'h264_nvenc',
          description: `${name} (NVENC Hardware Accelerated)`
        };
      }
    } catch (e) {}

    return {
      available: false,
      type: 'CPU',
      name: 'CPU Software Fallback',
      memoryTotalMB: 0,
      memoryUsedMB: 0,
      driverVersion: 'N/A',
      encoder: 'libx264',
      description: 'CPU Software Encoder'
    };
  }

  getLiveStats() {
    try {
      if (!this.gpuInfo.available) return this.gpuInfo;
      const output = execSync(
        'nvidia-smi --query-gpu=memory.used,temperature.gpu,utilization.gpu --format=csv,noheader,nounits',
        { encoding: 'utf-8', timeout: 1500 }
      ).trim();
      const [memUsed, temp, util] = output.split(',').map(s => s.trim());
      return {
        ...this.gpuInfo,
        memoryUsedMB: parseInt(memUsed) || 0,
        temperatureC: parseInt(temp) || 0,
        utilizationPercent: parseInt(util) || 0
      };
    } catch (e) {
      return this.gpuInfo;
    }
  }

  // Optimize and transcode video using NVIDIA NVENC hardware acceleration
  async transcodeWithGpu(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      console.log(`[GpuManager] ⚡ Processing video on ${this.gpuInfo.name} using ${this.gpuInfo.encoder}...`);

      const useNvenc = this.gpuInfo.available && this.gpuInfo.encoder === 'h264_nvenc';

      // High-performance NVENC encoding parameters
      const nvencArgs = [
        '-i', inputPath,
        '-c:v', 'h264_nvenc',
        '-preset', 'p6', // High quality preset
        '-tune', 'hq',
        '-cq:v', '19', // High visual clarity
        '-b:v', '6M',
        '-maxrate:v', '10M',
        '-bufsize:v', '12M',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '48000',
        '-movflags', '+faststart', // For instant Instagram playback
        '-y', outputPath
      ];

      const ffmpeg = spawn('ffmpeg', useNvenc ? nvencArgs : [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '19',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        '-y', outputPath
      ]);

      let stderr = '';
      ffmpeg.stderr.on('data', d => { stderr += d.toString(); });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`[GpuManager] ✅ Video transcode finished on ${useNvenc ? 'GPU (NVIDIA NVENC)' : 'CPU'}!`);
          try {
            if (fs.existsSync(inputPath) && inputPath !== outputPath) {
              fs.unlinkSync(inputPath);
            }
          } catch (e) {}
          resolve({
            ok: true,
            gpuAccelerated: useNvenc,
            encoder: useNvenc ? 'h264_nvenc (NVIDIA RTX)' : 'libx264 (CPU)',
            outputPath
          });
        } else {
          console.warn(`[GpuManager] GPU transcode exited with code ${code}, falling back:`, stderr.slice(-300));
          // Fallback to CPU libx264 if NVENC had an issue
          const fallbackArgs = [
            '-i', inputPath,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '20',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            '-y', outputPath
          ];
          const fallback = spawn('ffmpeg', fallbackArgs);
          fallback.on('close', (fCode) => {
            try {
              if (fs.existsSync(inputPath) && inputPath !== outputPath) {
                fs.unlinkSync(inputPath);
              }
            } catch (e) {}
            if (fCode === 0) {
              resolve({
                ok: true,
                gpuAccelerated: false,
                encoder: 'libx264 (CPU fallback)',
                outputPath
              });
            } else {
              reject(new Error(`Video encoding failed with code ${fCode}`));
            }
          });
        }
      });
    });
  }
}

export const gpuManager = new GpuManager();
