import { AWSCredentials, useAuthStore } from '../stores/store-auth';
import { getApiSignedTokenRequest } from '../utils/api.utils';
import { ref, Ref } from 'vue';

const authStore = useAuthStore();

export // Define the type for the WebSocket message
interface WebSocketOutMessage {
  action: string;
  data: {
    prompt: string;
  };
}

export class WebSocketClient {
  private socket!: WebSocket; // The WebSocket instance
  public currentState: Ref<string>; // Reactive state of the WebSocket connection
  public datas: Ref<string> = ref(''); // Reactive state of the WebSocket connection
  public error_message: Ref<string> = ref(''); // Error received from the WebSocket connection messages

  constructor() {
    // Initialize currentState as 'CLOSED'
    this.currentState = ref('CLOSED');
  }

  /**
   * Initiates the WebSocket connection asynchronously.
   *
   * This method fetches AWS credentials, signs the API request, and creates the WebSocket connection.
   * It updates `currentState` to track the status of the connection.
   */
  public async connect(): Promise<void> {
    try {
      // Step 1: Fetch AWS credentials
      const awsCredentials = (await authStore.getAWSCredentials(false, false)) as AWSCredentials;

      // Step 2: Get the signed query for WebSocket URL
      const signedQuery = await getApiSignedTokenRequest('GET', '/dev', awsCredentials, '', true, {
        host: 'g7fi8sjqt9.execute-api.eu-west-3.amazonaws.com',
        region: 'eu-west-3',
        protocol: 'wss',
      });

      // Step 3: Create WebSocket connection using the signed URL
      this.socket = new WebSocket(signedQuery.baseURL + signedQuery.url);

      // Step 4: Set up WebSocket event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection failed', error);
      this.datas.value = this.datas.value + '<br>' + error + '<br>';
      this.currentState.value = 'ERROR';
    }
  }

  /**
   * Sets up event listeners for the WebSocket instance to track its state.
   */
  private setupEventListeners(): void {
    // When the connection is successfully opened
    this.socket.onopen = () => {
      this.currentState.value = 'OPEN';
      this.datas.value =
        this.datas.value + '<br>' + 'WebSocket connection established' + '<br><br>';
    };

    // When a message is received from the server
    this.socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        this.error_message.value = data.error;
      } else {
        if (data.message != 'Fin de la transmission !') {
          if (data.message == '<i>Creating stream response : Done</i>\n') {
            this.datas.value = '<br>';
          } else {
            this.datas.value = this.datas.value + data.message.replace('\n', '<br>');
          }
        } else {
          this.datas.value = this.datas.value + '<br>';
        }
      }
    };

    // When an error occurs in the WebSocket connection
    this.socket.onerror = (event: Event) => {
      console.error('WebSocket encountered an error', event);
      this.currentState.value = 'ERROR';
      this.datas.value = this.datas.value + '<br>' + 'WebSocket encountered an error';
    };

    // When the connection is closed
    this.socket.onclose = () => {
      this.currentState.value = 'CLOSED';
      console.log('WebSocket connection closed');
      this.datas.value = this.datas.value + '<br>' + 'WebSocket connection closed';
    };
  }

  /**
   * Sends a message through the WebSocket if the connection is open.
   * @param message - The message to be sent to the server.
   */

  public sendMessage(message: WebSocketOutMessage): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.datas.value = '';
      this.socket.send(JSON.stringify(message));
      console.log('Message sent:', message);
    } else {
      console.error('Cannot send message, WebSocket is not open');
      this.datas.value = '{"message": "Cannot send message, WebSocket is not open"}';
    }
  }

  /**
   * Closes the WebSocket connection if it is open.
   */
  public closeConnection(): void {
    if (
      this.socket.readyState === WebSocket.OPEN ||
      this.socket.readyState === WebSocket.CONNECTING
    ) {
      this.socket.close();
    }
  }
}
