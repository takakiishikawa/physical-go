"use client";

import { toast } from "sonner";

export function useDeleteConfirm() {
  function confirmDelete(onConfirm: () => Promise<void>) {
    toast("この記録を削除しますか？", {
      action: {
        label: "削除する",
        onClick: async () => {
          await onConfirm();
        },
      },
      cancel: { label: "キャンセル", onClick: () => {} },
    });
  }

  return { confirmDelete };
}
