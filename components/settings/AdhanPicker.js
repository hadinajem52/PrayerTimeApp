import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ADHAN_VOICES, getAdhanVoiceName } from '../../constants/adhanConfig';
import useAdhanPreview from '../../hooks/useAdhanPreview';

/**
 * Modal list of the bundled muezzins. Tapping a row selects it; the play button
 * on each row auditions that voice in the currently selected length without
 * changing the selection.
 */
const AdhanPicker = ({
  visible,
  onClose,
  selectedVoice,
  onSelectVoice,
  useFullVersion,
  translations,
  isDarkMode,
  language,
  styles,
}) => {
  const { play, stop, isPlaying } = useAdhanPreview();
  const isRTL = language === 'ar';

  // Audio must never outlive the sheet.
  useEffect(() => {
    if (!visible) stop();
  }, [visible, stop]);

  const handleClose = () => {
    stop();
    onClose();
  };

  const handleSelect = (voiceId) => {
    onSelectVoice(voiceId);
    handleClose();
  };

  const accent = isDarkMode ? '#D4AF37' : '#059669';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable style={styles.adhanModalOverlay} onPress={handleClose}>
        {/* Swallows taps so pressing inside the sheet doesn't close it. */}
        <Pressable
          style={[styles.adhanModalContent, isDarkMode && styles.darkAdhanModalContent]}
          onPress={() => {}}
        >
          <View style={[styles.adhanModalHeader, isDarkMode && styles.darkAdhanModalHeader]}>
            <Text
              style={[
                styles.adhanModalTitle,
                isDarkMode && styles.darkAdhanModalTitle,
                isRTL && styles.rtlText,
              ]}
            >
              {translations.adhanVoiceSetting}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={22} color={isDarkMode ? '#fff' : '#333'} />
            </TouchableOpacity>
          </View>

          <ScrollView bounces={false}>
            {ADHAN_VOICES.map((voice) => {
              const selected = voice.id === selectedVoice;
              const playing = isPlaying(voice.id, useFullVersion);

              return (
                <TouchableOpacity
                  key={voice.id}
                  style={[
                    styles.adhanOption,
                    isDarkMode && styles.darkAdhanOption,
                    selected && (isDarkMode ? styles.darkSelectedOption : styles.selectedOption),
                    isRTL && styles.adhanOptionRTL,
                  ]}
                  onPress={() => handleSelect(voice.id)}
                  activeOpacity={0.7}
                >
                  <TouchableOpacity
                    style={[styles.adhanPlayButton, playing && { backgroundColor: accent }]}
                    onPress={() => play(voice.id, useFullVersion)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={playing ? translations.pausePreview : translations.playPreview}
                  >
                    <Icon
                      name={playing ? 'pause' : 'play'}
                      size={18}
                      color={playing ? (isDarkMode ? '#222' : '#fff') : accent}
                    />
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.adhanOptionText,
                      isDarkMode && styles.darkAdhanOptionText,
                      selected && (isDarkMode ? styles.darkSelectedLanguageText : styles.selectedLanguageText),
                      isRTL && styles.rtlText,
                    ]}
                    numberOfLines={2}
                  >
                    {getAdhanVoiceName(voice.id, language)}
                  </Text>

                  {selected && <Icon name="checkmark" size={20} color={accent} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text
            style={[styles.description, isDarkMode && styles.darkDescription, isRTL && styles.rtlText]}
          >
            {useFullVersion ? translations.previewFullHint : translations.previewCuttedHint}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AdhanPicker;
