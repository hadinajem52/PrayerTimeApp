import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

export default StyleSheet.create({
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
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: moderateScale(10),
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: moderateScale(5),
    elevation: 15,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(18),
  },
  upcomingPrayerDark: {
    backgroundColor: '#1E293B',
    borderColor: '#D4AF37',
    borderWidth: 1,
    borderRadius: moderateScale(10),
    shadowColor: '#D4AF37',
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
});
