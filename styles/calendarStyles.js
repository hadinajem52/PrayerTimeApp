import { StyleSheet, Dimensions } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

const { width } = Dimensions.get('window');
const cellSize = width / 7 - 8;

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
  calendarContainer: {
    padding: 16,
  },
  monthYearHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  darkMonthYearHeader: {
    backgroundColor: '#1E293B',
  },
  monthYearText: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#333',
  },
  darkMonthYearText: {
    color: '#fff',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: cellSize,
    height: cellSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: cellSize / 2,
  },
  dayText: {
    fontSize: moderateScale(16),
    color: '#333',
  },
  darkDayText: {
    color: '#fff',
  },
  todayCell: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: '#059669',
  },
  darkTodayCell: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#D4AF37',
  },
  todayText: {
    color: '#059669',
    fontWeight: 'bold',
  },
  selectedCell: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
  },
  darkSelectedCell: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  selectedDayText: {
    color: '#059669',
    fontWeight: 'bold',
  },
  disabledCell: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#999',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  todayDot: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: '#059669',
  },
  darkTodayDot: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#D4AF37',
  },
  selectedDot: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
  },
  darkSelectedDot: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  disabledDot: {
    backgroundColor: '#ccc',
    opacity: 0.3,
  },
  legendText: {
    fontSize: moderateScale(12),
    color: '#666',
  },
  darkLegendText: {
    color: '#aaa',
  },
});
