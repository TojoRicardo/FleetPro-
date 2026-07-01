import { useCallback, useState } from 'react';

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
};

const initialState = {
  open: false,
  confirming: false,
  title: '',
  description: undefined as string | undefined,
  confirmLabel: undefined as string | undefined,
  cancelLabel: undefined as string | undefined,
  onConfirm: (() => {}) as () => void | Promise<void>,
};

export function useConfirmDialog() {
  const [state, setState] = useState(initialState);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({
      open: true,
      confirming: false,
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel,
      cancelLabel: options.cancelLabel,
      onConfirm: options.onConfirm,
    });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false, confirming: false }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setState((prev) => ({ ...prev, confirming: true }));
    try {
      await state.onConfirm();
      close();
    } catch {
      setState((prev) => ({ ...prev, confirming: false }));
    }
  }, [state.onConfirm, close]);

  return {
    confirm,
    dialogProps: {
      open: state.open,
      onClose: close,
      onConfirm: handleConfirm,
      title: state.title,
      description: state.description,
      confirmLabel: state.confirmLabel,
      cancelLabel: state.cancelLabel,
      loading: state.confirming,
    },
  };
}
