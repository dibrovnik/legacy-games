export interface AddStoryType {
  userPicture: string;
  hasUploadedStory: boolean;
}

export interface StoryType {
  isViewed: boolean;
}

export interface NewsType {
  owner: string;
  ownermail: string;
  ownerPicture: string;
  title: string;
  text: string;
  gameId: string;
  coverLink: string;
  buttonText: string;
}
