import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { dsColors, dsSpacing, dsRadius } from '@/utils/designSystem';
import { testNetworkConnectivity, NetworkHealthMonitor } from '@/utils/api';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface ConnectionStatusProps {
  style?: any;
  showOnlyWhenOffline?: boolean;
  showLatency?: boolean;
  autoRetry?: boolean;
  retryInterval?: number; // in milliseconds
}

interface ConnectionState {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
  latency: number | null;
  isServerReachable: boolean;
  lastCheck: number;
  error?: string;
}

export function ConnectionStatus({
  style,
  showOnlyWhenOffline = true,
  showLatency = false,
  autoRetry = true,
  retryInterval = 30000 // 30 seconds
}: ConnectionStatusProps) {
  // Add component instance tracking
  const instanceId = useRef(Math.random().toString(36).substr(2, 9)).current;
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: true,
    type: null,
    isInternetReachable: null,
    latency: null,
    isServerReachable: true,
    lastCheck: Date.now()
  });
  const [showStatus, setShowStatus] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const healthMonitor = NetworkHealthMonitor.getInstance();
  const previousShowStatus = useRef(showStatus); // Track previous status
  
  // Keep ref in sync with state
  useEffect(() => {
    previousShowStatus.current = showStatus;
  }, [showStatus]);

  // Component mount/unmount tracking
  useEffect(() => {
    console.log(`🌐 [${instanceId}] ConnectionStatus component mounted`);
    return () => {
      console.log(`🌐 [${instanceId}] ConnectionStatus component unmounting`);
    };
  }, [instanceId]);

  // Check server connectivity
  const checkServerConnectivity = useCallback(async () => {
    try {
      const result = await testNetworkConnectivity();
      return {
        isReachable: result.isConnected,
        latency: result.latency,
        error: result.error
      };
    } catch (error) {
      return {
        isReachable: false,
        latency: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  // Update connection state
  const updateConnectionState = useCallback(async (netInfoState: NetInfoState) => {
    const serverResult = await checkServerConnectivity();
    
    const newState: ConnectionState = {
      isConnected: netInfoState.isConnected || false,
      type: netInfoState.type,
      isInternetReachable: netInfoState.isInternetReachable,
      latency: serverResult.latency,
      isServerReachable: serverResult.isReachable,
      lastCheck: Date.now(),
      error: serverResult.error
    };

    setConnectionState(newState);

    // Determine if we should show the status
    const shouldShow = !showOnlyWhenOffline || 
                      !newState.isConnected || 
                      !newState.isServerReachable ||
                      newState.isInternetReachable === false;
    
    setShowStatus(shouldShow);

    // Only log when status changes significantly
    if (shouldShow !== previousShowStatus.current) {
      console.log(`🌐 [${instanceId}] Connection status changed:`, {
        connected: newState.isConnected,
        internet: newState.isInternetReachable,
        server: newState.isServerReachable,
        type: newState.type,
        latency: newState.latency,
        shouldShow
      });
      previousShowStatus.current = shouldShow; // Update the ref
    }
  }, [checkServerConnectivity, showOnlyWhenOffline, instanceId]); // Removed showStatus dependency

  // Auto-retry mechanism
  const retry = useCallback(async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    console.log('🔄 Retrying connection...');
    
    try {
      // Force a fresh check
      const netInfoState = await NetInfo.fetch();
      await updateConnectionState(netInfoState);
    } catch (error) {
      console.error('❌ Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, updateConnectionState]);

  // Animation for showing/hiding status
  useEffect(() => {
    if (showStatus) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showStatus, slideAnim]);

  // Set up network monitoring
  useEffect(() => {
    console.log(`🌐 [${instanceId}] Setting up connection monitoring...`);
    
    // Initial check
    NetInfo.fetch().then(updateConnectionState);
    
    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log(`🌐 [${instanceId}] NetInfo event received:`, {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable
      });
      updateConnectionState(state);
    });
    
    // Listen for health monitor changes
    const handleHealthChange = (isHealthy: boolean) => {
      if (!isHealthy) {
        // Force a state update to show offline status
        setConnectionState(prev => ({
          ...prev,
          isServerReachable: false,
          error: 'Server unreachable',
          lastCheck: Date.now()
        }));
        setShowStatus(true);
      }
    };
    
    healthMonitor.addHealthListener(handleHealthChange);
    
    // Auto-retry setup - only retry when actually needed
    let retryInterval: NodeJS.Timeout;
    if (autoRetry) {
      retryInterval = setInterval(() => {
        // Only retry if we're actually offline and haven't retried recently
        const timeSinceLastCheck = Date.now() - connectionState.lastCheck;
        if ((!connectionState.isConnected || !connectionState.isServerReachable) && timeSinceLastCheck > 60000) {
          retry();
        }
      }, 60000); // Check every minute instead of every 30 seconds
    }
    
    return () => {
      console.log(`🌐 [${instanceId}] Cleaning up connection monitoring...`);
      unsubscribe();
      healthMonitor.removeHealthListener(handleHealthChange);
      if (retryInterval) {
        clearInterval(retryInterval);
      }
    };
  }, [updateConnectionState, healthMonitor, autoRetry, retry, instanceId]); // Added instanceId

  const getStatusInfo = () => {
    if (!connectionState.isConnected) {
      return {
        icon: 'wifi-outline',
        color: dsColors.status.error,
        message: 'No internet connection',
        detail: 'Check your network settings'
      };
    }
    
    if (connectionState.isInternetReachable === false) {
      return {
        icon: 'globe-outline',
        color: dsColors.status.warning,
        message: 'Limited connectivity',
        detail: 'Connected to network but no internet'
      };
    }
    
    if (!connectionState.isServerReachable) {
      const healthStatus = healthMonitor.getHealthStatus();
      const failureCount = healthStatus.consecutiveFailures;
      const maxFailures = 3;
      
      return {
        icon: 'server-outline',
        color: failureCount >= maxFailures ? dsColors.status.error : dsColors.status.warning,
        message: failureCount >= maxFailures ? 'Server unreachable' : 'Connection unstable',
        detail: failureCount >= maxFailures 
          ? (connectionState.error || 'Cannot connect to restaurant data')
          : `Connection issues detected (${failureCount}/${maxFailures})`
      };
    }
    
    // Show good connection with latency if requested
    if (showLatency && connectionState.latency) {
      const latency = connectionState.latency;
      let latencyColor = dsColors.status.success;
      let latencyStatus = 'Excellent';
      
      if (latency > 2000) {
        latencyColor = dsColors.status.error;
        latencyStatus = 'Poor';
      } else if (latency > 1000) {
        latencyColor = dsColors.status.warning;
        latencyStatus = 'Fair';
      } else if (latency > 500) {
        latencyColor = dsColors.status.info;
        latencyStatus = 'Good';
      }
      
      return {
        icon: 'speedometer',
        color: latencyColor,
        message: `${latencyStatus} connection`,
        detail: `${latency}ms latency`
      };
    }
    
    return {
      icon: 'checkmark-circle',
      color: dsColors.status.success,
      message: 'Connected',
      detail: `via ${connectionState.type || 'unknown'}`
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }]
        },
        style
      ]}
    >
      <View style={[styles.statusBar, { borderLeftColor: statusInfo.color }]}>
        <View style={styles.statusContent}>
          <Ionicons 
            name={statusInfo.icon as any} 
            size={20} 
            color={statusInfo.color} 
          />
          <View style={styles.statusText}>
            <ThemedText style={[styles.statusMessage, { color: statusInfo.color }]}>
              {statusInfo.message}
            </ThemedText>
            <ThemedText style={styles.statusDetail}>
              {statusInfo.detail}
            </ThemedText>
          </View>
        </View>
        
        {/* Manual reset button for testing */}
        {!connectionState.isServerReachable && (
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              healthMonitor.resetHealth();
              setConnectionState(prev => ({
                ...prev,
                isServerReachable: true,
                error: undefined
              }));
              setShowStatus(false);
            }}
          >
            <Ionicons name="refresh" size={16} color={dsColors.neutral.gray600} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * Simple connection indicator dot
 */
interface ConnectionIndicatorProps {
  size?: number;
  style?: any;
}

export function ConnectionIndicator({ size = 8, style }: ConnectionIndicatorProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isServerReachable, setIsServerReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected || false);
    });

    const healthMonitor = NetworkHealthMonitor.getInstance();
    const handleHealthChange = (isHealthy: boolean) => {
      setIsServerReachable(isHealthy);
    };
    
    healthMonitor.addHealthListener(handleHealthChange);
    
    // Initial check
    healthMonitor.checkHealth().then(setIsServerReachable);

    return () => {
      unsubscribe();
      healthMonitor.removeHealthListener(handleHealthChange);
    };
  }, []);

  const getIndicatorColor = () => {
    if (!isConnected) return dsColors.status.error;
    if (!isServerReachable) return dsColors.status.warning;
    return dsColors.status.success;
  };

  return (
    <View
      style={[
        styles.indicator,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getIndicatorColor(),
        },
        style
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  statusBar: {
    backgroundColor: dsColors.neutral.white,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: dsColors.neutral.gray200,
    paddingHorizontal: dsSpacing.md,
    paddingVertical: dsSpacing.sm,
    elevation: 2,
    shadowColor: dsColors.neutral.gray800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: dsSpacing.sm,
    flex: 1,
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusDetail: {
    fontSize: 12,
    color: dsColors.neutral.gray600,
    marginTop: 1,
  },
  retryButton: {
    padding: dsSpacing.sm,
    marginLeft: dsSpacing.sm,
  },
  spinning: {
    // Animation would need to be implemented with Animated API for rotation
  },
  indicator: {
    elevation: 1,
    shadowColor: dsColors.neutral.gray800,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  resetButton: {
    padding: dsSpacing.sm,
    marginLeft: dsSpacing.sm,
  },
});

