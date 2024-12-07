export enum GroupStatusCode {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum FriendRequestStatusCode {
  ACCEPTED = 'accepted',
  PENDING = 'pending',
  DECLINED = 'declined',
}

export enum ChatLogContentTypeCode {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum WsEvent {
  RECEIVE_MESSAGE = 'receive_message',
  UNAUTHORIZED = 'unauthorized',
}

export enum Platform {
  MOBILE = 'mobile',
  WEB = 'web',
}
