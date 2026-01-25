import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const ALBUM_NAME = "FotoBox";

const getExtensionFromDataUri = (dataUri: string): string => {
  const match = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
  if (!match) return "jpg";
  const raw = match[1].toLowerCase();
  if (raw === "jpeg") return "jpg";
  if (raw === "png") return "png";
  if (raw === "webp") return "webp";
  return "jpg";
};

export async function ensureMediaLibraryPermission(): Promise<boolean> {
  const permissions = await MediaLibrary.requestPermissionsAsync();
  if (permissions.status === "granted") return true;
  if (
    "accessPrivileges" in permissions &&
    permissions.accessPrivileges &&
    permissions.accessPrivileges !== "none"
  ) {
    return true;
  }
  return false;
}

/**
 * Saves a base64 image to the FotoBox album in the user's gallery.
 * Creates the album if it doesn't exist.
 */
export async function saveToFotoBoxAlbum(
  base64Uri: string,
  filenamePrefix: string = "product_image",
  options?: { skipPermissionCheck?: boolean },
): Promise<{ success: boolean; error?: string }> {
  try {
    // Request permissions
    if (!options?.skipPermissionCheck) {
      const hasPermission = await ensureMediaLibraryPermission();
      if (!hasPermission) {
        return {
          success: false,
          error: "Permission to access gallery was denied",
        };
      }
    }

    // Write base64 to temporary file
    const extension = getExtensionFromDataUri(base64Uri);
    const filename = `${filenamePrefix}_${Date.now()}.${extension}`;
    const fileUri = FileSystem.documentDirectory + filename;
    const base64Data = base64Uri.split(",")[1];

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // On iOS and Android, add to album (fallback to camera roll if limited)
    if (Platform.OS !== "web") {
      try {
        let album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);

        if (album === null) {
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
        } else {
          await MediaLibrary.createAssetAsync(fileUri, album);
        }
      } catch (albumError) {
        console.warn(
          "[saveToFotoBoxAlbum] Album access unavailable, saving to camera roll instead:",
          albumError,
        );
        await MediaLibrary.createAssetAsync(fileUri);
      }
    }

    // Clean up temporary file
    await FileSystem.deleteAsync(fileUri, { idempotent: true });

    return { success: true };
  } catch (error) {
    console.error("Failed to save image to FotoBox album:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save image",
    };
  }
}

/**
 * Saves a file URI image to the FotoBox album in the user's gallery.
 * Creates the album if it doesn't exist.
 */
export async function saveFileToFotoBoxAlbum(
  fileUri: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      return {
        success: false,
        error: "Permission to access gallery was denied",
      };
    }

    // Create asset from file
    const asset = await MediaLibrary.createAssetAsync(fileUri);

    // On iOS and Android, add to album
    if (Platform.OS !== "web") {
      // Check if album exists
      let album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);

      if (album === null) {
        // Create album with this asset
        album = await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
      } else {
        // Add asset to existing album
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to save image to FotoBox album:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save image",
    };
  }
}
