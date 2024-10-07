import { Controller } from '@nestjs/common';
import { 
  ApiTags, 
  ApiBearerAuth 
} from '@nestjs/swagger';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {}
