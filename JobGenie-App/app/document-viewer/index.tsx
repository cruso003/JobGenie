// app/document-viewer.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useDocumentsStore } from "@/stores/documents";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

export default function DocumentViewer() {
  const params = useLocalSearchParams();
  const documentId = params.documentId as string;
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { getDocumentById, deleteDocument } = useDocumentsStore();

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    if (!documentId) {
      Alert.alert("Error", "Document ID is required");
      router.back();
      return;
    }

    try {
      setLoading(true);
      const doc = await getDocumentById(documentId);

      if (!doc) {
        Alert.alert("Error", "Document not found");
        router.back();
        return;
      }

      setDocument(doc);
    } catch (error) {
      console.error("Error loading document:", error);
      Alert.alert("Error", "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!document?.content) {
      Alert.alert("Error", "Document content is empty");
      return;
    }

    try {
      setExporting(true);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: document.content,
        base64: false,
      });

      // Get a good filename
      const docType =
        document.document_type === "resume" ? "resume" : "cover-letter";
      const filename = `${docType}-${Date.now()}.pdf`;

      // On iOS, the Print.printToFileAsync already provides the right URI
      // On Android, we need to copy the file to a shareable location
      const pdfUri =
        Platform.OS === "ios"
          ? uri
          : `${FileSystem.documentDirectory}${filename}`;

      if (Platform.OS === "android") {
        await FileSystem.copyAsync({
          from: uri,
          to: pdfUri,
        });
      }

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      Alert.alert("Error", "Failed to export document");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteDocument = () => {
    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDocument(documentId);
              Alert.alert("Success", "Document deleted successfully");
              router.back();
            } catch (error) {
              console.error("Error deleting document:", error);
              Alert.alert("Error", "Failed to delete document");
            }
          },
        },
      ]
    );
  };

  const handleEditDocument = () => {
    router.push({
      pathname: "/resume",
      params: { documentId },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: document?.title || "Document",
          headerBackground: () => (
            <LinearGradient
              colors={isDark ? ["#111827", "#1E3A8A"] : ["#F9FAFB", "#EFF6FF"]}
              className="absolute inset-0"
            />
          ),
          headerBackTitle: "Back",
        }}
      />

      {loading ? (
        <LoadingIndicator />
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={{
            html:
              document?.content ||
              "<html><body><h1>No content</h1></body></html>",
          }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomButton, styles.deleteButton]}
          onPress={handleDeleteDocument}
        >
          <Feather name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomButton, styles.exportButton]}
          onPress={handleExportPdf}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="download" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Export PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  webView: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  bottomButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  exportButton: {
    backgroundColor: "#6366F1",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
});
