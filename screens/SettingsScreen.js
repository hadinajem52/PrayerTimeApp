// Import the animation settings hook
import { useAnimationSettings } from '../context/AnimationSettingsContext';

// Existing imports...

const SettingsScreen = ({ navigation }) => {
  // Add animation settings to existing settings
  const { animationsEnabled, toggleAnimations } = useAnimationSettings();
  
  // ...existing code...

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* ...existing settings options... */}
        
        {/* Performance Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Enable Animations</Text>
            <Switch
              value={animationsEnabled}
              onValueChange={toggleAnimations}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={animationsEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Turn off animations to improve performance on older devices.
          </Text>
        </View>
        
        {/* ...other settings sections... */}
      </ScrollView>
    </SafeAreaView>
  );
};

// ...existing styles and export...
