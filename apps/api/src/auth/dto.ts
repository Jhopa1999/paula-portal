import { IsNotEmpty, IsString } from 'class-validator';

export class MockLoginDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
