import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const loadingStateStyles = {
  shimmerContainer: {
    overflow: 'hidden',
  },
  skeletonBackground: {
    backgroundColor: '#E1E9EE',
  },
  darkSkeletonBackground: {
    backgroundColor: '#2A2A2A',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
  },
  darkShimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3D3D3D',
    opacity: 0.6,
  },
  skeletonAccent: {
    backgroundColor: '#007AFF33', 
  },
  darkSkeletonAccent: {
    backgroundColor: '#66CCFF33',
  },
};

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
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginBottom: hp('1.5%'), 
    color: '#333',
    textAlign: 'center',
    marginTop: hp('1%'), 
  },
  darkHeader: {
    color: '#FFF',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: moderateScale(15),
    padding: moderateScale(13),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(10),
    elevation: 8,
    marginBottom: moderateScale(20),
  },
  darkCard: {
    backgroundColor: '#333',
  },
  date: {
    fontSize: moderateScale(22),
    fontWeight: '600',
    marginBottom: moderateScale(5),
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
    marginBottom: moderateScale(15),
    marginTop: moderateScale(10),
  },
  hijriDate: {
    fontSize: moderateScale(18),
    fontWeight: '500',
    textAlign: 'center',
    color: '#555',
  },
  darkHijriDate: {
    color: '#CCC',
  },
  locationLabel: {
    fontSize: moderateScale(18),
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: moderateScale(5),
  },
  darkLocationLabel: {
    color: '#FFA500',
  },
  prayerContainer: {
    paddingBottom: moderateScale(20),
    alignItems: 'center',
  },
  prayerRow: {
    flexDirection: 'row',
    width: wp('83%'),
    alignSelf: 'center',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: moderateScale(12),
    paddingVertical: moderateScale(10),
    paddingHorizontal: wp('2%'), 
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    position: 'relative',
  },
  upcomingPrayerLight: {
    backgroundColor: '#E0F7FA',
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: moderateScale(10),
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: moderateScale(5),
    elevation: 15,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(18),
  },
  upcomingPrayerDark: {
    backgroundColor: '#333',
    borderColor: '#FFA500',
    borderWidth: 1,
    borderRadius: moderateScale(10),
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: moderateScale(5),
    elevation: 15,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(18),
  },
  prayerIcon: {
    marginRight: moderateScale(10),
  },
  label: {
    fontSize: moderateScale(18),
    color: '#555',
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  darkLabel: {
    color: '#CCC',
  },
  value: {
    fontSize: moderateScale(18),
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
    top: moderateScale(-10),
    right: moderateScale(-10),
    backgroundColor: '#FF4500',
    borderRadius: moderateScale(5),
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(2),
  },
  ribbonText: {
    fontSize: moderateScale(10),
    color: '#FFF',
    fontWeight: 'bold',
  },
  navigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp('12%'),
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#EAEFF2',
    borderTopLeftRadius: moderateScale(25),
    borderTopRightRadius: moderateScale(25),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    paddingBottom: moderateScale(10),
    paddingTop: moderateScale(5),
  },
  darkNavigation: {
    backgroundColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: moderateScale(10),
    padding: moderateScale(20),
    alignItems: 'center',
  },
  darkModalContent: {
    backgroundColor: '#444',
  },
  modalTitle: {
    fontSize: moderateScale(20),
    marginBottom: moderateScale(20),
    color: '#333',
  },
  darkModalTitle: {
    color: '#FFF',
  },
  locationOption: {
    paddingVertical: moderateScale(10),
    width: '100%',
    alignItems: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  locationOptionText: {
    fontSize: moderateScale(18),
    color: '#007AFF',
  },
  darkLocationOptionText: {
    color: '#66CCFF',
  },
  closeButton: {
    marginTop: moderateScale(20),
    backgroundColor: '#007AFF',
    borderRadius: moderateScale(5),
    paddingVertical: moderateScale(5),
    paddingHorizontal: moderateScale(15),
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: moderateScale(16),
  },
  darkCloseButtonText: {
    color: '#FFF',
  },
  infoButton: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
    zIndex: 1,
  },
  quoteModalText: {
    fontSize: moderateScale(16),
    color: '#007AFF',
    textAlign: 'center',
    marginVertical: moderateScale(10),
  },
  darkQuoteModalText: {
    color: '#66CCFF',
  },
  countdownText: {
    textAlign: 'center',
    fontSize: moderateScale(18),
    color: '#007AFF',
    marginVertical: moderateScale(10),
  },
  darkCountdownText: {
    color: '#66CCFF',
  },
  countdownText: {
    textAlign: 'center',
    fontSize: moderateScale(18),
    color: '#007AFF',
    marginVertical: moderateScale(10),
  },
  darkCountdownText: {
    color: '#66CCFF',
  },
  labelText: {
    fontSize: moderateScale(12),
    color: '#555',
    marginTop: moderateScale(15),
  },
  darkLabelText: {
    color: '#CCC',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%', 
    alignSelf: 'center',
    marginBottom: moderateScale(20),
  },
endIconContainer: {
  shadowColor: "#007AFF",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.9,
  shadowRadius: 15,
  borderRadius: 15,
  padding: 7,
  backgroundColor: 'rgba(0, 122, 255, 0.1)',
  marginLeft: 8,
},
darkEndIconContainer: {
  shadowColor: "#FFA500",
  backgroundColor: 'rgba(255, 165, 0, 0.1)',
},  
  todayCardGlow: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.5,
    elevation: 40,
  },
  darkTodayCardGlow: {
    shadowColor: '#FFA500',
  },
  animatedPrayerRow: {
    backfaceVisibility: 'hidden',
  },
  notificationToggleContainer: {
    padding: 5,
  },
  animatedButton: {
    overflow: 'visible',
  },
  animatedQuote: {
    transform: [{ scale: 1 }],
  },
  navIconContainer: {
    padding: 8,
  },
  animatedModalContent: {
    backfaceVisibility: 'hidden',
  },
  activeHighlight: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  darkActiveHighlight: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  upcomingTransition: {
    transitionProperty: 'all',
    transitionDuration: '300ms',
  },
  enhancedModalContent: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden'
  },
  darkEnhancedModalContent: {
    backgroundColor: '#333333',
    borderColor: '#444',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  enhancedModalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    color: '#007AFF',
  },
  darkEnhancedModalTitle: {
    color: '#66CCFF',
    borderBottomColor: '#444',
  },
  roundedCloseButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkRoundedCloseButton: {
    backgroundColor: '#66CCFF',
  },
  locationListContainer: {
    maxHeight: '80%',
    paddingVertical: moderateScale(5),
  },
  enhancedLocationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  darkEnhancedLocationOption: {
    borderBottomColor: '#444',
  },
  selectedLocationOption: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  darkSelectedLocationOption: {
    backgroundColor: 'rgba(255, 165, 0, 0.08)',
  },
  locationIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(15),
  },
  lightLocationIconContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  darkLocationIconContainer: {
    backgroundColor: 'rgba(102, 204, 255, 0.1)',
  },
  selectedLocationIconContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  enhancedLocationText: {
    fontSize: moderateScale(18),
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  darkEnhancedLocationText: {
    color: '#DDD',
  },
  selectedLocationText: {
    fontWeight: '600',
    color: '#007AFF',
  },
  darkSelectedLocationText: {
    color: '#FFA500',
  },
  selectedCheckmark: {
    marginLeft: moderateScale(10),
  },
  quoteContainer: {
    padding: moderateScale(15),
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  quoteIcon: {
    marginBottom: moderateScale(15),
  },
  enhancedQuoteText: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    textAlign: 'center',
    color: '#222',
    fontStyle: 'italic',
    paddingHorizontal: moderateScale(10),
  },
  darkEnhancedQuoteText: {
    color: '#EEE',
  },
  quoteActionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(15),
    alignSelf: 'center',
    minWidth: moderateScale(120),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  darkQuoteActionButton: {
    backgroundColor: '#66CCFF',
  },
  quoteActionButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: moderateScale(16),
  },
  darkQuoteActionButtonText: {
    color: 'white',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center', 
    width: moderateScale(70),
    height: moderateScale(65),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(5),
  },
  navItemActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: moderateScale(20),
  },
  darkNavItemActive: {
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
  },
  navIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(4),
    width: '100%',
  },
  navIcon: {
    alignSelf: 'center',
    marginBottom: moderateScale(4),
  },
  navLabel: {
    fontSize: moderateScale(11),
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
    width: '100%',
  },
  navLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  darkNavLabel: {
    color: '#AAA',
  },
  darkNavLabelActive: {
    color: '#FFA500',
  },
  
  // Alarm Permission Modal Styles
  modalContainer: {
    width: '80%',
    maxWidth: moderateScale(320),
    backgroundColor: '#FFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  darkModalContainer: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: moderateScale(18),
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    width: '100%',
  },
  darkModalHeader: {
    borderBottomColor: '#444',
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#e1e1e1ff',
    textAlign: 'center',
    marginTop: moderateScale(12),
    lineHeight: moderateScale(24),
  },
  modalMessage: {
    fontSize: moderateScale(14),
    color: '#e1e1e1ff',
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(22),
    paddingHorizontal: moderateScale(8),
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  darkCancelButton: {
    backgroundColor: '#555',
    borderColor: '#666',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.25,
  },
  darkConfirmButton: {
    backgroundColor: '#FFA500',
    shadowColor: '#FFA500',
  },
  cancelButtonText: {
    color: '#6C757D',
    fontSize: moderateScale(14),
    fontWeight: '600',
    textAlign: 'center',
  },
  darkCancelText: {
    color: '#CCC',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
    textAlign: 'center',
  },
  
  ...loadingStateStyles,
});
