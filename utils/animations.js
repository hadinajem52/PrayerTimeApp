import { Animated, Easing } from 'react-native';

export const Animations = {
  // Spring configuration for natural, bouncy transitions
  spring: {
    standard: {
      friction: 8,
      tension: 40,
      useNativeDriver: true
    },
    gentle: {
      friction: 10,
      tension: 20,
      useNativeDriver: true
    },
    responsive: {
      toValue: 0, 
      friction: 7,
      tension: 70,
      useNativeDriver: true
    },
    bounce: {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }
  },
  
  timing: {
    instant: {
      duration: 80,
      easing: Easing.linear,
      useNativeDriver: true
    },
    fast: {
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    },
    medium: {
      duration: 350,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true
    },
    slow: {
      duration: 500,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
      useNativeDriver: true
    },
    pulse: {
      toValue: 1.1,
      duration: 200,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true
    }
  }
};

export const AnimationUtils = {
  pulse: (animatedValue, enabled = true) => {
    if (!enabled) {
      animatedValue.setValue(1);
      return;
    }
    
    Animated.sequence([
      Animated.timing(animatedValue, Animations.timing.pulse),
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true
      })
    ]).start();
  },
  
  bounce: (animatedValue, enabled = true) => {
    if (!enabled) {
      animatedValue.setValue(1);
      return;
    }
    
    animatedValue.setValue(0.8);
    Animated.spring(animatedValue, Animations.spring.bounce).start();
  },
  
  // Fades an element in
  fadeIn: (animatedValue, duration = 300, toValue = 1, callback, enabled = true) => {
    if (!enabled) {
      animatedValue.setValue(toValue);
      if (callback) callback({ finished: true });
      return;
    }
    
    Animated.timing(animatedValue, {
      toValue,
      duration,
      useNativeDriver: true,
      easing: Easing.ease
    }).start(callback);
  },
  
  // Fades an element out
  fadeOut: (animatedValue, duration = 300, toValue = 0, callback, enabled = true) => {
    if (!enabled) {
      animatedValue.setValue(toValue);
      if (callback) callback({ finished: true });
      return;
    }
    
    Animated.timing(animatedValue, {
      toValue,
      duration, 
      useNativeDriver: true,
      easing: Easing.ease
    }).start(callback);
  },
  
  // Add a specific function for day switching
  switchDay: (animatedValue, toValue = 1, callback, enabled = true) => {
    if (!enabled) {
      animatedValue.setValue(toValue);
      if (callback) callback({ finished: true });
      return;
    }
    
    Animated.timing(animatedValue, {
      toValue,
      duration: 80,
      useNativeDriver: true,
      easing: Easing.linear
    }).start(callback);
  }
};
