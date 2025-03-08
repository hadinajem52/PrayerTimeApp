import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const ForcedUpdateDialog = ({ visible, title, message, onUpdate }) => {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (visible) {
          return true;
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [visible])
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Ionicons name="alert-circle" size={50} color="#FF6B6B" style={styles.icon} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.updateButton} onPress={onUpdate}>
            <Text style={styles.updateButtonText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const OptionalUpdateDialog = ({ visible, title, message, onUpdate, onLater }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onLater}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Ionicons name="information-circle" size={50} color="#4ECDC4" style={styles.icon} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.laterButton} onPress={onLater}>
              <Text style={styles.laterButtonText}>Later</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.updateButton} onPress={onUpdate}>
              <Text style={styles.updateButtonText}>Update</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: moderateScale(10),
    padding: moderateScale(20),
    width: '85%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  icon: {
    marginBottom: moderateScale(15),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginBottom: moderateScale(10),
    textAlign: 'center',
  },
  message: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: moderateScale(20),
    color: '#555',
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(5),
    minWidth: moderateScale(120),
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  laterButton: {
    backgroundColor: '#E7E7E7',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(5),
    minWidth: moderateScale(120),
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  laterButtonText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  }
});