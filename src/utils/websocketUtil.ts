import { useWebSocket } from '@vueuse/core';
import { getWebsocketServerUrl } from '@/utils/common/tool';

const socketMap = new Map(); // from device id to socket
const wsUrl = `${getWebsocketServerUrl()}/telemetry/datas/current/keys/ws`;

export interface ICardView {
  // 定义 ICardView 接口
  data?: {
    dataSource?: {
      deviceSource?: {
        deviceId?: string;
        metricsId?: string;
        metricsType?: string;
      }[];
    };
    type?: string;
  };
}

export interface ICardRender {
  getCardComponent: (cardView: ICardView) => {
    getComponent: () => {
      updateData?: (deviceId: string, metricsId: string, data: any) => void;
    };
  };
}

export function useWebsocketUtil(layout: Ref<ICardView[]>, cr: Ref<ICardRender | undefined>, token: string | string[]) {
  const setComponentsValue = (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    const cardViews = layout.value.filter(
      item =>
        item.data?.dataSource?.deviceSource?.[0]?.deviceId === deviceId &&
        item.data?.dataSource?.deviceSource?.[0]?.metricsId === metricsId
    );
    for (const cardView of cardViews) {
      const cardComponent = cr.value?.getCardComponent(cardView)?.getComponent();
      cardComponent?.updateData && cardComponent?.updateData(deviceId, metricsId, data);
    }
  };

  const updateComponentsData = async () => {
    const deviceMetricsIds = layout.value
      .filter(
        item =>
          item.data?.dataSource?.deviceSource &&
          item.data?.dataSource?.deviceSource[0]?.deviceId &&
          item.data?.dataSource?.deviceSource[0]?.metricsId &&
          item.data?.dataSource?.deviceSource[0]?.metricsType === 'telemetry' &&
          item.data?.type === 'chart'
      )
      .map(
        item =>
          `${item.data?.dataSource?.deviceSource?.[0]?.deviceId}|${item.data?.dataSource?.deviceSource?.[0]?.metricsId}`
      );
    const set = new Set(deviceMetricsIds);
    const uniqueDeviceMetricsIds = [...set];

    for (const [deviceMetricsId, socket] of socketMap.entries()) {
      if (!uniqueDeviceMetricsIds.includes(deviceMetricsId)) {
        console.log('close socket', deviceMetricsId);
        socket.close();
        socketMap.delete(deviceMetricsId);
      }
    }

    for (const deviceMetricsId of uniqueDeviceMetricsIds) {
      const [deviceId, metricsId] = deviceMetricsId.split('|');
      if (!socketMap.has(deviceMetricsId)) {
        console.log('create socket', deviceMetricsId);
        const { ws, send } = useWebSocket(wsUrl, {
          heartbeat: {
            message: 'ping',
            interval: 8000,
            pongTimeout: 3000
          },
          onMessage(_websocket: WebSocket, event: MessageEvent) {
            if (event.data && event.data !== 'pong') {
              const data = JSON.parse(event.data);
              setComponentsValue(deviceId, metricsId, data);
            }
          },
          onConnected() {
            const dataw = {
              device_id: deviceId,
              keys: [metricsId],
              token
            };
            send(JSON.stringify(dataw));
          }
        });
        socketMap.set(deviceMetricsId, ws.value);
      }
    }
  };

  return {
    updateComponentsData
  };
}