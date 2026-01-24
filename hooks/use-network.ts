import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
  isWifi: boolean;
  isCellular: boolean;
}

/**
 * Hook for monitoring network connectivity
 *
 * @example
 * const { isConnected, isInternetReachable, isWifi } = useNetwork();
 *
 * if (!isConnected) {
 *   return <OfflineBanner />;
 * }
 */
export function useNetwork() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: NetInfoStateType.unknown,
    isWifi: false,
    isCellular: false,
  });

  useEffect(() => {
    // Initial fetch
    NetInfo.fetch().then((state) => {
      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === NetInfoStateType.wifi,
        isCellular: state.type === NetInfoStateType.cellular,
      });
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === NetInfoStateType.wifi,
        isCellular: state.type === NetInfoStateType.cellular,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Manually check network status
   */
  const refresh = useCallback(async (): Promise<NetworkState> => {
    const state = await NetInfo.fetch();
    const newState: NetworkState = {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isWifi: state.type === NetInfoStateType.wifi,
      isCellular: state.type === NetInfoStateType.cellular,
    };
    setNetworkState(newState);
    return newState;
  }, []);

  return {
    ...networkState,
    refresh,
  };
}
