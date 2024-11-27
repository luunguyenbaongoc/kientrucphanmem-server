import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatLogContentType } from 'src/entities';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { Repository } from 'typeorm';

@Injectable()
export class ChatLogContentTypeService {
  constructor(
    @InjectRepository(ChatLogContentType)
    private chatLogContentTypeRepository: Repository<ChatLogContentType>,
  ) {}

  async findByCode(code: string): Promise<ChatLogContentType | undefined> {
    try {
      return this.chatLogContentTypeRepository.findOneBy({ code });
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findByCodeAndCheckExist(
    code: string,
  ): Promise<ChatLogContentType | undefined> {
    try {
      const chatlogContentType = await this.findByCode(code);
      if (!chatlogContentType) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `chatlog content type ${code} không tồn tại`,
        );
      }
      return chatlogContentType;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }
}
