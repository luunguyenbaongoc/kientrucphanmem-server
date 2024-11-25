export const resetUserDb = async (userRepository: any) => {
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
  await userRepository.delete({});
};

export const resetGroupDb = async (groupRepository: any) => {
  await groupRepository.manager.query(
    'DELETE FROM group_members WHERE group_id IS NOT NULL',
  );
  await groupRepository.delete({});
};
