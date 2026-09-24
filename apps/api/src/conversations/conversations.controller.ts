import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser, InboxView } from '@paula/contracts';
import { Roles, CurrentUser } from '../auth/decorators';
import { ConversationsService } from './conversations.service';
import {
  AddNoteDto,
  AssignConversationDto,
  ChangeModeDto,
  CloseConversationDto,
  ListConversationsDto,
  SendMessageDto,
  TakeConversationDto,
} from './dto';

@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly service: ConversationsService) {}

  @Get()
  list(
    @Query() query: ListConversationsDto,
    @Query('view') view: InboxView | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // El segmento 'mine' se resuelve con la identidad autenticada.
    const resolved =
      view === 'mine' ? this.service.resolveMineQuery(query, user) : query;
    return this.service.list(resolved);
  }

  @Get(':sessionId')
  get(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.get(sessionId, user);
  }

  @Get(':sessionId/messages')
  getMessages(
    @Param('sessionId') sessionId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMessages(
      sessionId,
      before,
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':sessionId/audit')
  @Roles('PAULA_SUPERVISOR', 'PAULA_ADMIN')
  getAudit(@Param('sessionId') sessionId: string) {
    return this.service.getAudit(sessionId);
  }

  @Post(':sessionId/take')
  take(
    @Param('sessionId') sessionId: string,
    @Body() dto: TakeConversationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.take(sessionId, dto, user);
  }

  @Put(':sessionId/assignment')
  @Roles('PAULA_SUPERVISOR', 'PAULA_ADMIN')
  assign(
    @Param('sessionId') sessionId: string,
    @Body() dto: AssignConversationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.assign(sessionId, dto, user);
  }

  @Post(':sessionId/messages')
  sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.sendMessage(sessionId, dto, user);
  }

  @Post(':sessionId/notes')
  addNote(
    @Param('sessionId') sessionId: string,
    @Body() dto: AddNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.addNote(sessionId, dto, user);
  }

  @Put(':sessionId/mode')
  changeMode(
    @Param('sessionId') sessionId: string,
    @Body() dto: ChangeModeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.changeMode(sessionId, dto, user);
  }

  @Post(':sessionId/close')
  close(
    @Param('sessionId') sessionId: string,
    @Body() dto: CloseConversationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.close(sessionId, dto, user);
  }
}
