import { User } from '../user';

export interface IncomingFriendRequest {
  id: number;
  requester: User;
  recipient: User;
  createdAt: string;
}
