'use client';

import { Avatar, Badge, Image } from '@heroui/react';
import { Modal, ModalContent, ModalBody, ModalFooter, Button, useDisclosure } from '@heroui/react';

type AddStoryProps = {
  userPicture: string;
  hasUploadedStory: boolean;
  isViewed: boolean;
};

const AddStory = ({ userPicture, hasUploadedStory, isViewed }: AddStoryProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleAdd = () => {
    alert('Открыть добавление истории');
  };

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalBody style={{ backgroundColor: 'rgba(0, 0, 0, 0.0)' }}>
                <Image alt="okak" src="https://i.imgur.com/Bg2qB8E.png" />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Закрыть
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Badge isOneChar content="+" placement="bottom-right">
        <Avatar
          className="w-16 h-16 text-large"
          onClick={onOpen}
          isBordered={hasUploadedStory}
          color={isViewed ? 'default' : 'primary'}
          src={userPicture}
        />
      </Badge>
    </>
  );
};

export default AddStory;
