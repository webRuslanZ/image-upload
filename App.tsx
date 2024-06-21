import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

//Каталог документов в файлах телефона. (Обычно она используется для хранения пользовательских файлов приложения)
const imgDir = FileSystem.documentDirectory + "images/";

const ensureDirExists = async () => {
  //Проверяем есть ли созданная директория по пути imgDir (file:///data/user/0/host.exp.exponent/files/images/)
  const dirInfo = await FileSystem.getInfoAsync(imgDir);

  if (!dirInfo.exists) {
    //Если не существует, создаем папку и все промежуточные
    await FileSystem.makeDirectoryAsync(imgDir, { intermediates: true });
  }
};

export default function App() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    await ensureDirExists();
    const files = await FileSystem.readDirectoryAsync(imgDir);
    if (files.length > 0) {
      setImages(files.map((f) => imgDir + f));
    }
  };

  const selectImage = async (useLibrary: boolean) => {
    let result;

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    };

    if (useLibrary) {
      result = await ImagePicker.launchImageLibraryAsync(options);
    } else {
      //Запрашиваем разрешение на использование камеры (на андроиде спрашивает по умолчанию)
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync(options);
    }

    if (!result.canceled) {
      saveImage(result.assets[0].uri);
    }
  };

  const saveImage = async (uri: string) => {
    await ensureDirExists();
    const fileName = new Date().getTime() + ".jpg";
    const dest = imgDir + fileName;
    //копируем в файловую систему фото из кэша в dest
    await FileSystem.copyAsync({ from: uri, to: dest });

    setImages([...images, dest]);
  };

  const deleteImage = async (uri: string) => {
    await FileSystem.deleteAsync(uri);
    setImages(images.filter((i) => i !== uri));
  };

  const uploadImage = async (uri: string) => {
    setLoading(true);

    await FileSystem.uploadAsync("http://google.com", uri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: "file",
    });

    setLoading(false);
  };

  const renderItem = ({ item }: { item: string }) => {
    const fileName = item.split("/").pop();

    return (
      <View
        style={{
          flexDirection: "row",
          margin: 1,
          alignItems: "center",
          gap: 5,
        }}
      >
        <Image width={80} height={80} source={{ uri: item }} />
        <Text style={{ flex: 1 }}>{fileName}</Text>
        <Ionicons.Button
          name="cloud-upload"
          onPress={() => uploadImage(item)}
        />
        <Ionicons.Button name="trash" onPress={() => deleteImage(item)} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer}>
        <Button title="Photo library" onPress={() => selectImage(true)} />
        <Button title="Capture image" onPress={() => selectImage(false)} />
      </View>

      <Text style={{ textAlign: "center" }}>Моя галлерея</Text>
      <FlatList data={images} renderItem={renderItem} />

      {loading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <ActivityIndicator color="#fff" animating size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
    backgroundColor: "#fff",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 10,
  },
});
