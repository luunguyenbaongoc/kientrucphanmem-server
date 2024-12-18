export const resetUserDb = async (userRepository: any) => {
  await userRepository.manager.query(
    'DELETE FROM chat_box WHERE from_user IS NOT NULL OR to_user IS NOT NULL',
  );
  await userRepository.manager.query(
    'DELETE FROM friend_request WHERE from_user IS NOT NULL OR to_user IS NOT NULL',
  );
  await userRepository.manager.query(
    'DELETE FROM friend WHERE to_user IS NOT NULL',
  );
  await userRepository.manager.query(
    'DELETE FROM group_members WHERE user_id IS NOT NULL',
  );
  await userRepository.manager.query(
    'DELETE FROM profile WHERE user_id IS NOT NULL',
  );
  await userRepository.manager.query(
    'DELETE FROM "group" WHERE owner_id IS NOT NULL',
  );
  await userRepository.delete({});
};

export const resetGroupDb = async (
  groupRepository: any,
  groupMembersRepository: any,
) => {
  await groupRepository.manager.query(
    'DELETE FROM chat_box WHERE to_group IS NOT NULL',
  );
  await groupMembersRepository.manager.query(
    'DELETE FROM group_members WHERE group_id IS NOT NULL',
  );
  await groupMembersRepository.delete({});
  await groupRepository.delete({});
};

export const resetFriendDb = async (
  friendRepository: any,
  friendRequestRepository: any,
) => {
  await friendRequestRepository.manager.query(
    'DELETE FROM friend_request WHERE from_user IS NOT NULL OR to_user IS NOT NULL',
  );
  await friendRepository.manager.query(
    'DELETE FROM friend WHERE from_user IS NOT NULL OR to_user IS NOT NULL',
  );
  await friendRequestRepository.delete({});
  await friendRepository.delete({});
};
