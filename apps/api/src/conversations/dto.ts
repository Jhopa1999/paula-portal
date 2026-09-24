import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { ConversationMode, ConversationStatus } from '@paula/contracts';

const MODES: ConversationMode[] = ['AUTOMATIC', 'AGENT', 'MANUAL'];
const STATUSES: ConversationStatus[] = [
  'CREATED',
  'ACTIVE',
  'PENDING_TIMEOUT',
  'CLOSED',
  'ERROR',
];

export class TakeConversationDto {
  @IsString()
  @IsNotEmpty()
  commandId!: string;

  @IsInt()
  @Min(0)
  expectedVersion!: number;
}

export class AssignConversationDto {
  @IsString()
  @IsNotEmpty()
  commandId!: string;

  @IsString()
  @IsNotEmpty()
  assigneeId!: string;

  @IsInt()
  @Min(0)
  expectedVersion!: number;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  clientMessageId!: string;

  @IsIn(['text'])
  type!: 'text';

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsInt()
  @Min(0)
  expectedVersion!: number;
}

export class ChangeModeDto {
  @IsString()
  @IsNotEmpty()
  commandId!: string;

  @IsIn(MODES)
  mode!: ConversationMode;

  @IsInt()
  @Min(0)
  expectedVersion!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CloseConversationDto {
  @IsString()
  @IsNotEmpty()
  commandId!: string;

  @IsInt()
  @Min(0)
  expectedVersion!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ListConversationsDto {
  @IsOptional()
  @IsIn(STATUSES)
  status?: ConversationStatus;

  @IsOptional()
  @IsIn(MODES)
  mode?: ConversationMode;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsIn(['ASSIGNED', 'UNASSIGNED'])
  assignmentState?: 'ASSIGNED' | 'UNASSIGNED';

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  thirdPartyId?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsIn(['mine', 'unassigned', 'all', 'closed'])
  view?: 'mine' | 'unassigned' | 'all' | 'closed';
}
