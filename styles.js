import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#EAEFF2',
    },
    darkContainer: {
      backgroundColor: '#222',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#EAEFF2',
    },
    header: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 10,
      color: '#333',
      textAlign: 'center',
      marginTop: 20,
    },
    darkHeader: {
      color: '#FFF',
    },
    card: {
      backgroundColor: '#FFF',
      borderRadius: 15,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
      marginBottom: 20,
    },
    darkCard: {
      backgroundColor: '#333',
    },
    date: {
      fontSize: 22,
      fontWeight: '600',
      marginBottom: 5,
      textAlign: 'center',
      color: '#007AFF',
    },
    darkDate: {
      color: '#66CCFF',
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    hijriDate: {
      fontSize: 18,
      fontWeight: '500',
      textAlign: 'center',
      color: '#555',
    },
    darkHijriDate: {
      color: '#CCC',
    },
    locationLabel: {
      fontSize: 18,
      fontWeight: '500',
      color: '#007AFF',
      marginLeft: 5,
    },
    darkLocationLabel: {
      color: '#FFA500',
    },
    prayerContainer: {
      paddingBottom: 20,
      alignItems: 'center',
    },
    prayerRow: {
      flexDirection: 'row',
      width: '90%',
      alignSelf: 'center',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginVertical: 12,
      paddingVertical: 10,
      paddingHorizontal: 5,
      borderBottomColor: '#eee',
      borderBottomWidth: 1,
      position: 'relative',
    },
    upcomingPrayerLight: {
      backgroundColor: '#E0F7FA',
      borderColor: '#007AFF',
      borderWidth: 2,
      borderRadius: 10,
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 5,
      elevation: 5,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    upcomingPrayerDark: {
      backgroundColor: '#333',
      borderColor: '#FFA500',
      borderWidth: 2,
      borderRadius: 10,
      shadowColor: '#FFA500',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 5,
      elevation: 5,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    prayerIcon: {
      marginRight: 10,
    },
    label: {
      fontSize: 18,
      color: '#555',
      fontWeight: '500',
      flex: 1,
      textAlign: 'center',
    },
    darkLabel: {
      color: '#CCC',
    },
    value: {
      fontSize: 18,
      color: '#000',
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
    },
    darkValue: {
      color: '#FFF',
    },
    ribbon: {
      position: 'absolute',
      top: -10,
      right: -10,
      backgroundColor: '#FF4500',
      borderRadius: 5,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    ribbonText: {
      fontSize: 10,
      color: '#FFF',
      fontWeight: 'bold',
    },
    navigation: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 30,
      alignItems: 'center',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '80%',
      backgroundColor: '#FFF',
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
    },
    darkModalContent: {
      backgroundColor: '#444',
    },
    modalTitle: {
      fontSize: 20,
      marginBottom: 20,
      color: '#333',
    },
    darkModalTitle: {
      color: '#FFF',
    },
    locationOption: {
      paddingVertical: 10,
      width: '100%',
      alignItems: 'center',
      borderBottomColor: '#ccc',
      borderBottomWidth: 1,
    },
    locationOptionText: {
      fontSize: 18,
      color: '#007AFF',
    },
    darkLocationOptionText: {
      color: '#66CCFF',
    },
    closeButton: {
      marginTop: 20,
      backgroundColor: '#007AFF',
      borderRadius: 5,
      paddingVertical: 5,
      paddingHorizontal: 15,
    },
    closeButtonText: {
      color: '#FFF',
      fontSize: 16,
    },
    darkCloseButtonText: {
      color: '#FFF',
    },
    infoButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 1,
    },
    quoteModalText: {
      fontSize: 16,
      color: '#007AFF',
      textAlign: 'center',
      marginVertical: 10,
    },
    darkQuoteModalText: {
      color: '#66CCFF',
    },
  });
  