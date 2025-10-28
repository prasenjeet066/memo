import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { JSX } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function useModal(): [
  JSX.Element | null,
  (
    title: string,
    getContent: (onClose: () => void) => JSX.Element,
    closeOnClickOutside?: boolean
  ) => void,
] {
  const [modalContent, setModalContent] = useState<null | {
    closeOnClickOutside: boolean;
    content: JSX.Element;
    title: string;
  }>(null);

  const onClose = useCallback(() => {
    setModalContent(null);
  }, []);

  const modal = useMemo(() => {
    if (modalContent === null) return null;

    const { title, content, closeOnClickOutside } = modalContent;

    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          onPointerDownOutside={
            closeOnClickOutside ? undefined : (e) => e.preventDefault()
          }
          className="rounded-2xl shadow-lg p-6"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">{content}</div>
        </DialogContent>
      </Dialog>
    );
  }, [modalContent, onClose]);

  const showModal = useCallback(
    (
      title: string,
      getContent: (onClose: () => void) => JSX.Element,
      closeOnClickOutside = false,
    ) => {
      setModalContent({
        closeOnClickOutside,
        content: getContent(onClose),
        title,
      });
    },
    [onClose],
  );

  return [modal, showModal];
}