// components/CustomAlert.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';

const CustomAlert = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  cancelText,
  confirmText,
  isDarkMode,
}) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.alertContainer, 
          isDarkMode && styles.darkAlertContainer
        ]}>
          <View style={styles.iconContainer}>
            <Icon 
              name="alert-circle" 
              size={40} 
              color={isDarkMode ? "#FFA500" : "#007AFF"} 
            />
          </View>
          
          <Text style={[
            styles.title, 
            isDarkMode && styles.darkTitle
          ]}>
            {title}
          </Text>
          
          <Text style={[
            styles.message, 
            isDarkMode && styles.darkMessage
          ]}>
            {message}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, isDarkMode && styles.darkCancelButton]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, styles.cancelText]}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, isDarkMode && styles.darkConfirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.buttonText}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: moderateScale(20),
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  darkAlertContainer: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
  },
  iconContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#222',
  },
  darkTitle: {
    color: '#FFF',
  },
  message: {
    fontSize: moderateScale(14),
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
    lineHeight: 20,
  },
  darkMessage: {
    color: '#CCC',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#EEE',
  },
  darkCancelButton: {
    backgroundColor: '#444',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  darkConfirmButton: {
    backgroundColor: '#FFA500',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: moderateScale(14),
    color: 'white',
  },
  cancelText: {
    color: '#555',
  },
});

export default CustomAlert;