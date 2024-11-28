import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface ImagePickerScreenProps {
  onImagesSelected: (images: string[]) => void;
  maxImages?: number;
}

const ImagePickerScreen: React.FC<ImagePickerScreenProps> = ({ 
  onImagesSelected, 
  maxImages = 12 
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const requestGalleryPermission = async (): Promise<boolean> => {
    try {
      const result = await request(
        Platform.OS === 'ios' 
          ? PERMISSIONS.IOS.PHOTO_LIBRARY 
          : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      );
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const pickImages = async () => {
    if (selectedImages.length >= maxImages) {
      Alert.alert('Limit Reached', `Maximum ${maxImages} images allowed`);
      return;
    }

    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot access gallery');
      return;
    }

    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: maxImages - selectedImages.length,
        quality: 0.7
      });

      if (result.assets) {
        const newImages = result.assets
          .map(asset => asset.uri)
          .filter((uri): uri is string => uri !== undefined);

        const updatedImages = [...selectedImages, ...newImages].slice(0, maxImages);
        
        setSelectedImages(updatedImages);
        onImagesSelected(updatedImages);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (uri: string) => {
    const updatedImages = selectedImages.filter(image => image !== uri);
    setSelectedImages(updatedImages);
    onImagesSelected(updatedImages);
  };

  const renderImageItem = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.image} />
      <TouchableOpacity onPress={() => removeImage(item)}>
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.pickButton} 
        onPress={pickImages}
        disabled={selectedImages.length >= maxImages}
      >
        <Text style={styles.pickButtonText}>
          {selectedImages.length < maxImages 
            ? 'Select Images' 
            : 'Max Images Selected'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={selectedImages}
        renderItem={renderImageItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  pickButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  pickButtonText: {
    color: 'white',
    fontSize: 16,
  },
  imageContainer: {
    marginRight: 10,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeText: {
    color: 'red',
    marginTop: 5,
  }
});

export default ImagePickerScreen;