import { StatusBar } from "expo-status-bar";
import {
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState<boolean>(true);

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
    await FileSystem.copyAsync({ from: uri, to: dest });

    setImages([...images, dest]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer}>
        <Button title="Photo library" onPress={() => selectImage(true)} />
        <Button title="Capture image" onPress={() => selectImage(false)} />
      </View>

      <ScrollView>
        {images.map((img) => (
          <Image
            key={img}
            source={{ uri: img }}
            style={{ width: 300, height: 300 }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 55,
  },
});
