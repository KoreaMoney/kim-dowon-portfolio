"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { XIcon } from "@phosphor-icons/react";
import type * as React from "react";
import { useLocale } from "@/components/locale-provider";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({ children, title }: { children: React.ReactNode; title: string }) {
  const { locale } = useLocale();

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-[#081B33]/35 backdrop-blur-sm data-[state=closed]:opacity-0 data-[state=open]:opacity-100 motion-safe:transition-opacity motion-safe:duration-500" />
      <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-[#F3F7FA]/98 p-6 text-[#111827] data-[state=closed]:translate-y-6 data-[state=closed]:opacity-0 data-[state=open]:translate-y-0 data-[state=open]:opacity-100 motion-safe:transition-[transform,opacity] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]">
        <Dialog.Title className="text-lg font-semibold text-[#111827]">{title}</Dialog.Title>
        <Dialog.Description className="sr-only">{locale === "en" ? "Page navigation menu" : "페이지 이동 메뉴"}</Dialog.Description>
        <Dialog.Close className="absolute right-6 top-6 grid size-11 place-items-center rounded-sm border border-[#9BAFC1] bg-white text-[#40546A] transition-colors duration-300 hover:bg-[#E6F0FC] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B63CE]" aria-label={locale === "en" ? "Close menu" : "메뉴 닫기"}>
          <XIcon size={24} />
        </Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
