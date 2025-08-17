import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { dsColors, dsSpacing, dsRadius } from '@/utils/designSystem';
import { PerformanceTelemetry, NetworkHealthMonitor } from '@/utils/network-resilience';
import { CacheControls } from '@/utils/api-cache';

interface PerformanceDashboardProps {
  visible: boolean;
  onClose: () => void;
}

interface PerformanceMetrics {
  latencyBuckets: Record<string, number>;
  errorRates: Record<string, number>;
  cacheStats: Record<string, { size: number; maxSize: number }>;
  networkHealth: { isHealthy: boolean; lastCheck: number };
  totalRequests: number;
  avgLatency: number;
}

export function PerformanceDashboard({ visible, onClose }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadMetrics = async () => {
    try {
      const telemetryMetrics = PerformanceTelemetry.getMetrics();
      const latencyBuckets = PerformanceTelemetry.getLatencyBuckets();
      const errorRates = PerformanceTelemetry.getErrorRates();
      const cacheStats = CacheControls.getStats();
      const healthMonitor = NetworkHealthMonitor.getInstance();
      const networkHealth = healthMonitor.getHealthStatus();

      const totalRequests = telemetryMetrics.length;
      const avgLatency = totalRequests > 0 
        ? telemetryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
        : 0;

      setMetrics({
        latencyBuckets,
        errorRates,
        cacheStats,
        networkHealth,
        totalRequests,
        avgLatency
      });
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      loadMetrics();
      
      if (autoRefresh) {
        const interval = setInterval(loadMetrics, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
      }
    }
  }, [visible, autoRefresh]);

  const getLatencyColor = (bucket: string) => {
    switch (bucket) {
      case 'fast-0-2s': return dsColors.status.success;
      case 'good-2-5s': return dsColors.status.info;
      case 'slow-5-10s': return dsColors.status.warning;
      case 'very-slow-10s+': return dsColors.status.error;
      default: return dsColors.neutral.gray400;
    }
  };

  const getLatencyLabel = (bucket: string) => {
    switch (bucket) {
      case 'fast-0-2s': return 'Fast (0-2s)';
      case 'good-2-5s': return 'Good (2-5s)';
      case 'slow-5-10s': return 'Slow (5-10s)';
      case 'very-slow-10s+': return 'Very Slow (10s+)';
      default: return bucket;
    }
  };

  const getCacheUsagePercentage = (size: number, maxSize: number) => {
    return maxSize > 0 ? (size / maxSize) * 100 : 0;
  };

  const clearAllCaches = () => {
    CacheControls.clearAll();
    loadMetrics();
  };

  const logPerformanceSummary = () => {
    PerformanceTelemetry.logPerformanceSummary();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={dsColors.neutral.gray600} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Performance Dashboard</ThemedText>
          <TouchableOpacity 
            onPress={() => setAutoRefresh(!autoRefresh)}
            style={styles.refreshButton}
          >
            <Ionicons 
              name={autoRefresh ? "pause" : "play"} 
              size={20} 
              color={autoRefresh ? dsColors.status.warning : dsColors.status.success} 
            />
          </TouchableOpacity>
        </View>

        {metrics ? (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Overview Stats */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Overview</ThemedText>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <ThemedText style={styles.statValue}>{metrics.totalRequests}</ThemedText>
                  <ThemedText style={styles.statLabel}>Total Requests</ThemedText>
                </View>
                <View style={styles.statCard}>
                  <ThemedText style={styles.statValue}>{metrics.avgLatency.toFixed(0)}ms</ThemedText>
                  <ThemedText style={styles.statLabel}>Avg Latency</ThemedText>
                </View>
                <View style={styles.statCard}>
                  <ThemedText style={[
                    styles.statValue,
                    { color: metrics.errorRates.errorRate < 5 ? dsColors.status.success : dsColors.status.error }
                  ]}>
                    {metrics.errorRates.errorRate.toFixed(1)}%
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Error Rate</ThemedText>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statusIndicator}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: metrics.networkHealth.isHealthy ? dsColors.status.success : dsColors.status.error }
                    ]} />
                    <ThemedText style={styles.statValue}>
                      {metrics.networkHealth.isHealthy ? 'Healthy' : 'Unhealthy'}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.statLabel}>Network Status</ThemedText>
                </View>
              </View>
            </View>

            {/* Latency Distribution */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Response Time Distribution</ThemedText>
              {Object.entries(metrics.latencyBuckets).map(([bucket, count]) => {
                const percentage = metrics.totalRequests > 0 ? (count / metrics.totalRequests) * 100 : 0;
                return (
                  <View key={bucket} style={styles.metricRow}>
                    <View style={styles.metricLabel}>
                      <View style={[styles.colorIndicator, { backgroundColor: getLatencyColor(bucket) }]} />
                      <ThemedText style={styles.metricText}>{getLatencyLabel(bucket)}</ThemedText>
                    </View>
                    <View style={styles.metricValue}>
                      <ThemedText style={styles.metricCount}>{count}</ThemedText>
                      <ThemedText style={styles.metricPercentage}>({percentage.toFixed(1)}%)</ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Error Breakdown */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Error Analysis</ThemedText>
              <View style={styles.errorGrid}>
                <View style={styles.errorCard}>
                  <ThemedText style={[styles.errorValue, { color: dsColors.status.error }]}>
                    {metrics.errorRates.networkErrors.toFixed(1)}%
                  </ThemedText>
                  <ThemedText style={styles.errorLabel}>Network</ThemedText>
                </View>
                <View style={styles.errorCard}>
                  <ThemedText style={[styles.errorValue, { color: dsColors.status.warning }]}>
                    {metrics.errorRates.serverErrors.toFixed(1)}%
                  </ThemedText>
                  <ThemedText style={styles.errorLabel}>Server</ThemedText>
                </View>
                <View style={styles.errorCard}>
                  <ThemedText style={[styles.errorValue, { color: dsColors.status.info }]}>
                    {metrics.errorRates.clientErrors.toFixed(1)}%
                  </ThemedText>
                  <ThemedText style={styles.errorLabel}>Client</ThemedText>
                </View>
              </View>
            </View>

            {/* Cache Performance */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Cache Performance</ThemedText>
              {Object.entries(metrics.cacheStats).map(([cacheType, stats]) => {
                const usage = getCacheUsagePercentage(stats.size, stats.maxSize);
                const usageColor = usage > 80 ? dsColors.status.warning : 
                                 usage > 50 ? dsColors.status.info : dsColors.status.success;
                
                return (
                  <View key={cacheType} style={styles.cacheRow}>
                    <View style={styles.cacheInfo}>
                      <ThemedText style={styles.cacheType}>{cacheType}</ThemedText>
                      <ThemedText style={styles.cacheUsage}>
                        {stats.size}/{stats.maxSize} ({usage.toFixed(0)}%)
                      </ThemedText>
                    </View>
                    <View style={styles.cacheBar}>
                      <View 
                        style={[
                          styles.cacheBarFill,
                          { 
                            width: `${usage}%`,
                            backgroundColor: usageColor
                          }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Actions</ThemedText>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={loadMetrics}>
                  <Ionicons name="refresh" size={18} color={dsColors.primary.main} />
                  <ThemedText style={styles.actionButtonText}>Refresh</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={clearAllCaches}>
                  <Ionicons name="trash" size={18} color={dsColors.status.warning} />
                  <ThemedText style={[styles.actionButtonText, { color: dsColors.status.warning }]}>
                    Clear Cache
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={logPerformanceSummary}>
                  <Ionicons name="analytics" size={18} color={dsColors.status.info} />
                  <ThemedText style={[styles.actionButtonText, { color: dsColors.status.info }]}>
                    Log Summary
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.loading}>
            <ThemedText>Loading performance metrics...</ThemedText>
          </View>
        )}
      </View>
    </Modal>
  );
}

/**
 * Quick performance indicator for header/status bar
 */
export function PerformanceIndicator() {
  const [health, setHealth] = useState<{ isHealthy: boolean; avgLatency: number }>({
    isHealthy: true,
    avgLatency: 0
  });

  useEffect(() => {
    const updateHealth = () => {
      const metrics = PerformanceTelemetry.getMetrics();
      const healthMonitor = NetworkHealthMonitor.getInstance();
      const networkHealth = healthMonitor.getHealthStatus();
      
      const avgLatency = metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length 
        : 0;
      
      setHealth({
        isHealthy: networkHealth.isHealthy,
        avgLatency
      });
    };

    updateHealth();
    const interval = setInterval(updateHealth, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!health.isHealthy) return dsColors.status.error;
    if (health.avgLatency > 2000) return dsColors.status.warning;
    if (health.avgLatency > 1000) return dsColors.status.info;
    return dsColors.status.success;
  };

  return (
    <View style={styles.indicator}>
      <View style={[styles.indicatorDot, { backgroundColor: getStatusColor() }]} />
      <ThemedText style={styles.indicatorText}>
        {health.avgLatency > 0 ? `${health.avgLatency.toFixed(0)}ms` : '--'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dsColors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dsSpacing.md,
    paddingVertical: dsSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: dsColors.neutral.gray200,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: dsColors.neutral.gray800,
  },
  content: {
    flex: 1,
    padding: dsSpacing.md,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: dsSpacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: dsColors.neutral.gray700,
    marginBottom: dsSpacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dsSpacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: dsSpacing.md,
    backgroundColor: dsColors.neutral.gray50,
    borderRadius: dsRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: dsColors.neutral.gray800,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: dsColors.neutral.gray600,
    textAlign: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: dsSpacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dsSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: dsColors.neutral.gray100,
  },
  metricLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: dsSpacing.sm,
  },
  metricText: {
    fontSize: 14,
    color: dsColors.neutral.gray700,
  },
  metricValue: {
    alignItems: 'flex-end',
  },
  metricCount: {
    fontSize: 16,
    fontWeight: '600',
    color: dsColors.neutral.gray800,
  },
  metricPercentage: {
    fontSize: 12,
    color: dsColors.neutral.gray500,
  },
  errorGrid: {
    flexDirection: 'row',
    gap: dsSpacing.sm,
  },
  errorCard: {
    flex: 1,
    padding: dsSpacing.md,
    backgroundColor: dsColors.neutral.gray50,
    borderRadius: dsRadius.md,
    alignItems: 'center',
  },
  errorValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorLabel: {
    fontSize: 12,
    color: dsColors.neutral.gray600,
  },
  cacheRow: {
    marginBottom: dsSpacing.md,
  },
  cacheInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dsSpacing.xs,
  },
  cacheType: {
    fontSize: 14,
    fontWeight: '500',
    color: dsColors.neutral.gray700,
  },
  cacheUsage: {
    fontSize: 12,
    color: dsColors.neutral.gray500,
  },
  cacheBar: {
    height: 6,
    backgroundColor: dsColors.neutral.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  cacheBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: dsSpacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: dsSpacing.sm,
    paddingHorizontal: dsSpacing.md,
    backgroundColor: dsColors.neutral.gray50,
    borderRadius: dsRadius.md,
    borderWidth: 1,
    borderColor: dsColors.neutral.gray200,
  },
  actionButtonText: {
    marginLeft: dsSpacing.xs,
    fontSize: 14,
    fontWeight: '500',
    color: dsColors.primary.main,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: dsSpacing.xs,
  },
  indicatorText: {
    fontSize: 10,
    color: dsColors.neutral.gray600,
  },
});

