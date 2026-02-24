import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#333',
  },
  darkHeaderTitle: {
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  mainTitle: {
    marginTop: 12,
    marginBottom: 4,
    marginHorizontal: 16,
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
    textTransform: 'none',
  },
  darkMainTitle: {
    color: '#D4AF37',
  },
  rtlTitle: {
    textAlign: 'right',
    marginLeft: 16,
    marginRight: 16,
  },
  darkSection: {
    backgroundColor: '#0F172A',
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    color: '#333',
  },
  darkSectionTitle: {
    color: '#fff',
    borderBottomColor: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  darkSettingItem: {
    borderTopColor: '#333',
  },
  settingLabel: {
    fontSize: moderateScale(16),
    color: '#333',
  },
  darkSettingLabel: {
    color: '#fff',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  darkLanguageOption: {
    borderTopColor: '#333',
  },
  selectedOption: {
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
  },
  darkSelectedOption: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  languageText: {
    fontSize: moderateScale(16),
    color: '#333',
  },
  darkLanguageText: {
    color: '#fff',
  },
  selectedLanguageText: {
    fontWeight: '600',
    color: '#059669',
  },
  darkSelectedLanguageText: {
    color: '#D4AF37',
  },
  adjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  darkAdjustButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  offsetValue: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    paddingHorizontal: 10,
    width: 120,
    textAlign: 'center',
    color: '#333',
    alignSelf: 'center',
  },
  darkOffsetValue: {
    color: '#fff',
  },
  description: {
    fontSize: moderateScale(13),
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
    fontStyle: 'italic',
  },
  darkDescription: {
    color: '#aaa',
  },
  updateButton: {
    backgroundColor: '#059669',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkUpdateButton: {
    backgroundColor: '#D4AF37',
  },
  disabledButton: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: moderateScale(14),
  },
  darkUpdateButtonText: {
    color: '#222',
  },
  disclaimer: {
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: moderateScale(14),
    color: '#666',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkDisclaimer: {
    color: '#aaa',
    borderBottomColor: '#333',
  },
  rtlText: {
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  darkRateButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  rateButtonText: {
    marginLeft: 8,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#059669',
  },
  darkRateButtonText: {
    color: '#D4AF37',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  darkTestButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  testButtonText: {
    marginLeft: 8,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#4CAF50',
  },
  darkTestButtonText: {
    color: '#66BB6A',
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  darkPermissionButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  permissionButtonText: {
    marginLeft: 8,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#059669',
  },
  darkPermissionButtonText: {
    color: '#D4AF37',
  },
  permissionStatus: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    marginTop: 4,
  },
  grantedStatus: {
    color: '#4CAF50',
  },
  disabledStatus: {
    color: '#888',
  },
  appVersionText: {
    fontSize: moderateScale(12),
    color: '#888',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  darkAppVersionText: {
    color: '#aaa',
  },
});
