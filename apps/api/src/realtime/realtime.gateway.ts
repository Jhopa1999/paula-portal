import { Logger, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { AuthenticatedUser, RealtimeEvent } from '@paula/contracts';
import { TokenService } from '../auth/token.service';
import { RealtimeDispatcher } from './realtime.dispatcher';

/**
 * Gateway WebSocket. Autentica en el handshake (token en auth o query),
 * une al socket a rooms por usuario, y difunde eventos realtime.
 * Namespace: /realtime
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200' },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly tokenService: TokenService,
    private readonly dispatcher: RealtimeDispatcher,
  ) {}

  onModuleInit(): void {
    // El dispatcher entrega aqui los eventos a difundir.
    this.dispatcher.registerEmitter((event: RealtimeEvent) => {
      this.server.emit(event.type, event);
    });
  }

  handleConnection(client: Socket): void {
    const token = this.extractToken(client);
    const user = token ? this.tokenService.verify(token) : null;

    if (!user) {
      this.logger.warn(`Conexion rechazada (sin token valido): ${client.id}`);
      client.emit('unauthorized', { message: 'Autenticacion requerida.' });
      client.disconnect(true);
      return;
    }

    (client.data as { user: AuthenticatedUser }).user = user;
    void client.join(`user:${user.id}`);
    for (const role of user.roles) {
      void client.join(`role:${role}`);
    }
    this.logger.log(`Conectado ${user.id} (${client.id})`);
  }

  handleDisconnect(client: Socket): void {
    const user = (client.data as { user?: AuthenticatedUser }).user;
    this.logger.log(`Desconectado ${user?.id ?? 'desconocido'} (${client.id})`);
  }

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake.auth as { token?: string })?.token;
    if (authToken) return authToken;
    const queryToken = client.handshake.query['token'];
    return typeof queryToken === 'string' ? queryToken : null;
  }
}
