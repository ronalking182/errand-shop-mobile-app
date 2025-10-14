import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../theme/ThemeProvider";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAgree: () => void;
  hasCartItems: boolean;
};

export default function CustomRequestConfirmationModal({ 
  visible, 
  onClose, 
  onAgree, 
  hasCartItems 
}: Props) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="time-outline" size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Custom Request Notice</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.message, { color: colors.text }]}>
              This is a custom request and may take more time than usual orders to process.
            </Text>
            
            {hasCartItems && (
              <View style={[styles.warningBox, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
                <Ionicons name="warning-outline" size={16} color="#EF4444" />
                <Text style={[styles.warningText, { color: "#DC2626" }]}>
                  You have items in your cart. Your custom request must be confirmed to finalize your cart price.
                </Text>
              </View>
            )}

            <View style={[styles.infoBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>What happens next:</Text>
              <View style={styles.stepsList}>
                <View style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: "#EF4444" }]}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.sub }]}>Request added to cart with "Submitted" status</Text>
                </View>
                <View style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: "#EF4444" }]}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.sub }]}>Admin reviews and provides quote</Text>
                </View>
                <View style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: "#EF4444" }]}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.sub }]}>You can accept or decline the quote</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable 
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]} 
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
            <Pressable 
              style={[styles.button, styles.agreeButton, { backgroundColor: "#EF4444" }]} 
              onPress={onAgree}
            >
              <Text style={styles.agreeButtonText}>I Agree</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  content: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  stepsList: {
    gap: 12,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },
  stepNumberText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  stepText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  agreeButton: {
    // backgroundColor set via props
  },
  agreeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});