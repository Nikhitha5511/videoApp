import React from 'react';
import RNFS from 'react-native-fs';
import { FFmpegKit, ReturnCode as FFmpegReturnCode } from 'ffmpeg-kit-react-native';
import { Platform } from 'react-native';
import FastImage from 'react-native-fast-image';

interface ImagePath {
  uri: string;
}

interface ImageProcessingOptions {
  scale?: { width: number; height: number };
  zoomEffect?: boolean;
  fadeEffect?: boolean;
  frameDuration?: number;
}

const VideoProcessingUtils = {
  async getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      (FastImage as any).getSize(
        imagePath, 
        (width: number, height: number) => resolve({ width, height }),
        (error: Error) => reject(error)
      );
    });
  },

  async createVideoFromImages(
    imagePaths: { uri: string }[], 
    options: ImageProcessingOptions = {}
  ): Promise<string> {
    try {
      const outputPath = Platform.select({
        android: `${RNFS.ExternalDirectoryPath}/photo_sequence.mp4`,
        ios: `${RNFS.DocumentDirectoryPath}/photo_sequence.mp4`
      })!;

      const imageListPath = Platform.select({
        android: `${RNFS.ExternalDirectoryPath}/image_list.txt`,
        ios: `${RNFS.DocumentDirectoryPath}/image_list.txt`
      })!;

      await RNFS.writeFile(
        imageListPath, 
        imagePaths.map(path => `file '${path.uri}'`).join('\n')
      );

      const firstImageDimensions = await this.getImageDimensions(imagePaths[0].uri);
      const scale = options.scale || {
        width: 1280,
        height: Math.round((1280 / firstImageDimensions.width) * firstImageDimensions.height)
      };

      const frameDuration = options.frameDuration || 3;
      const zoomEffect = options.zoomEffect !== false;
      const fadeEffect = options.fadeEffect !== false;

      const ffmpegCommand = [
        '-f', 'concat',
        '-safe', '0',
        '-i', imageListPath,
        '-vf', [
          `scale=${scale.width}:${scale.height}:force_original_aspect_ratio=decrease`,
          `pad=${scale.width}:${scale.height}:(ow-iw)/2:(oh-ih)/2`,
          zoomEffect ? 'zoompan=z=\'min(zoom+0.05,1.5)\':d=50' : '',
          fadeEffect ? 'fade=t=in:st=0:d=1,fade=t=out:st=49:d=1' : ''
        ].filter(Boolean).join(','),
        '-r', `1/${frameDuration}`,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        outputPath
      ];

      const session = await FFmpegKit.execute(ffmpegCommand.join(' '));
      const returnCode = await session.getReturnCode();

      const logs = await session.getLogs();
      console.log('FFmpeg Logs:', logs);

      if (FFmpegReturnCode.isValueSuccess(returnCode)) {
        return outputPath;
      } else {
        const failedLogs = await session.getFailStackTrace();
        console.error('Video creation failed:', failedLogs);
        throw new Error('Video creation failed');
      }
    } catch (error) {
      console.error('Video processing error:', error);
      throw error;
    }
  },

  async addBackgroundMusic(
    videoPath: string, 
    musicPath: string,
    options: { volume?: number } = {}
  ): Promise<string> {
    try {
      const outputPath = Platform.select({
        android: `${RNFS.ExternalDirectoryPath}/final_video.mp4`,
        ios: `${RNFS.DocumentDirectoryPath}/final_video.mp4`
      })!;
      
      const musicVolume = options.volume || 0.5;

      const ffmpegCommand = [
        '-i', videoPath,
        '-i', musicPath,
        '-filter_complex', `[0:a][1:a]amix=inputs=2:duration=first:weights=1 ${musicVolume}[a]`,
        '-map', '0:v',
        '-map', '[a]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        outputPath
      ];

      const session = await FFmpegKit.execute(ffmpegCommand.join(' '));
      const returnCode = await session.getReturnCode();

      if (FFmpegReturnCode.isValueSuccess(returnCode)) {
        return outputPath;
      } else {
        const failedLogs = await session.getFailStackTrace();
        console.error('Music addition failed:', failedLogs);
        throw new Error('Music addition failed');
      }
    } catch (error) {
      console.error('Music processing error:', error);
      throw error;
    }
  }
};

export default VideoProcessingUtils;