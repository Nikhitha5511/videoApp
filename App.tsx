import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Button,
  Share,
  View
} from 'react-native';
import ImagePickerScreen from './android/app/components/ImagePickerScreen';
import VideoProcessingUtils from './android/app/components/VideoProcessingUtils';
import Video from 'react-native-video';
import { ImagePath } from './android/app/components/types';

type ImageSelectionHandler = (images: string[]) => void;

interface VideoProcessingOptions {
  zoomEffect?: boolean;
  fadeEffect?: boolean;
}


const App: React.FC = () => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [processingVideo, setProcessingVideo] = useState<boolean>(false);
  const [finalVideoUri, setFinalVideoUri] = useState<string | null>(null);

  const handleImagesSelected = (images: string[]) => {
    setSelectedImages(images);
  };

  const createVideoSequence = async () => {
    if (selectedImages.length < 2) {
      Alert.alert('Select at least 2 images');
      return;
    }

    setProcessingVideo(true);
    try {
      const imagePathArray: ImagePath[] = selectedImages.map(uri => ({ uri }));

      const videoPath = await VideoProcessingUtils.createVideoFromImages(imagePathArray, {
        scale: { width: 1280, height: 720 },
        zoomEffect: true,
        fadeEffect: true,
        frameDuration: 3
      });
      const musicPath = require('./assets/background_music.mp3');

      const finalVideo = await VideoProcessingUtils.addBackgroundMusic(
        videoPath,
        musicPath,
        { volume: 0.3 }
      );

      setFinalVideoUri(finalVideo);
      Alert.alert('Success', 'Video created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create video');
    } finally {
      setProcessingVideo(false);
    }
  };

  const shareVideo = async () => {
    if (!finalVideoUri) return;

    try {
      await Share.share({
        title: 'Check out my photo sequence video!',
        url: finalVideoUri,
      });
    } catch (error: any) {
      Alert.alert('Sharing failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImagePickerScreen onImagesSelected={handleImagesSelected} />

      {selectedImages.length > 1 && (
        <Button title="Create Video" onPress={createVideoSequence} />
      )}

      {processingVideo && <ActivityIndicator size="large" />}

      {finalVideoUri && (
        <>
          <Video
            source={{ uri: finalVideoUri }}
            style={styles.video}
            controls={true}
            resizeMode="contain"
          />
          <Button title="Share Video" onPress={shareVideo} />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  video: {
    width: '100%',
    height: 300,
    marginTop: 20,
  }
});

export default App;