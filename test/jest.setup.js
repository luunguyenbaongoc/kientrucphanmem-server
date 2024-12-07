jest.mock('src/modules/firebase/cloud-messaging/cloud-messaging.service', () => ({
  CloudMessagingService: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue('Mock message sent'),
  })),
}));
