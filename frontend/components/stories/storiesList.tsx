'use client';

import { Avatar } from '@heroui/react';
import AddStory from './addStory';

export default function StoriesList() {
  return (
    <>
      Истории
      <div className="flex gap-4 items-center">
        <AddStory
          userPicture={'https://i.pravatar.cc/150?u=a04258a2462d826712d'}
          hasUploadedStory={true}
          isViewed={true}
        />
        <Avatar
          className="w-16 h-16 text-large"
          isBordered
          color="default"
          src="https://i.pravatar.cc/150?u=a042581f4e29026024d"
        />
      </div>
    </>
  );
}
