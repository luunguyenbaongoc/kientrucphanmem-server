import { Injectable, Logger } from '@nestjs/common';
import * as firebase from 'firebase-admin';
import * as path from 'path';
import { SendMulticastMessageFireBaseDto } from './dto';

@Injectable()
export class CloudMessagingService {
  constructor() {
    firebase.initializeApp({
      credential: firebase.credential.cert(
        path.join(__dirname, '../firebase-admin-sdk.json'),
      ),
    });
  }
  private readonly logger = new Logger(CloudMessagingService.name);

  // async sendMessage(
  //   sendMessageFireBaseDto: SendMessageFireBaseDto,
  // ): Promise<void> {
  //   try {
  //     const { data, title, content, token } = sendMessageFireBaseDto;

  //     await firebase.messaging().send({
  //       notification: {
  //         title: title,
  //         body: content,
  //       },
  //       token: token,
  //       data: data,
  //       android: { priority: 'high' },
  //     });
  //   } catch (err) {
  //     this.logger.error('Send message error:', err?.stack ?? err);
  //   }
  // }

  async sendMulticastMessage(
    sendMulticastMessageFireBaseDto: SendMulticastMessageFireBaseDto,
  ): Promise<void> {
    try {
      const { data, title, content, tokens } = sendMulticastMessageFireBaseDto;
      if (tokens.length > 0) {
        await firebase.messaging().sendEachForMulticast({
          notification: {
            title: title,
            body: content,
          },
          tokens: tokens,
          data: {},
          android: { priority: 'high' },
        });
      }
    } catch (err) {
      this.logger.error('Send multicast message error:', err?.stack ?? err);
    }
  }
}
