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
import { ConversationsService } from './conversations.service';
import {
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
  list(@Query() query: ListConversationsDto) {
    return this.service.list(query);
  }

  @Get(':sessionId')
  get(@Param('sessionId') sessionId: string) {
    return this.service.get(sessionId);
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

  @Post(':sessionId/take')
  take(@Param('sessionId') sessionId: string, @Body() dto: TakeConversationDto) {
    return this.service.take(sessionId, dto);
  }

  @Put(':sessionId/assignment')
  assign(
    @Param('sessionId') sessionId: string,
    @Body() dto: AssignConversationDto,
  ) {
    return this.service.assign(sessionId, dto);
  }

  @Post(':sessionId/messages')
  sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendMessage(sessionId, dto);
  }

  @Put(':sessionId/mode')
  changeMode(
    @Param('sessionId') sessionId: string,
    @Body() dto: ChangeModeDto,
  ) {
    return this.service.changeMode(sessionId, dto);
  }

  @Post(':sessionId/close')
  close(
    @Param('sessionId') sessionId: string,
    @Body() dto: CloseConversationDto,
  ) {
    return this.service.close(sessionId, dto);
  }
}
