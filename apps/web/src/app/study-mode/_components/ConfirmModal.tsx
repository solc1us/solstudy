"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { DeleteConfirmationState } from "./types";

export function ConfirmModal({
  confirmation,
  onCancel,
  onConfirm,
  isConfirming,
}: {
  confirmation: DeleteConfirmationState;
  onCancel: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
}) {
  return (
    <AnimatePresence>
      {confirmation ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isConfirming) onCancel();
          }}
        >
          <motion.div
            initial={{ y: 16, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.97, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[#232f48] bg-[#1a2332] p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-2.5 text-red-200">
                <Trash2 size={19} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{confirmation.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#92a4c9]">{confirmation.message}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={isConfirming}
                className="rounded-xl border border-[#232f48] px-4 py-2.5 text-sm font-semibold text-[#92a4c9] transition hover:text-white disabled:cursor-wait disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isConfirming}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-70"
              >
                {isConfirming ? <LoaderCircle size={16} className="animate-spin" /> : null}
                {isConfirming ? "Deleting..." : confirmation.confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
