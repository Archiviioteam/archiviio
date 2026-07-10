export const animationDuration = {
  fast: 200,
  normal: 250,
} as const;

export const transition = {
  hover: "transition-colors duration-200 ease-out",
  layout: "transition-[transform,width,opacity] duration-200 ease-out",
  progress: "transition-[width] duration-250 ease-out",
} as const;

export const motion = {
  modalOverlay:
    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-250 ease-out",
  modalContent:
    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-250 ease-out",
  bottomSheet:
    "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom duration-300 ease-out motion-reduce:transition-none",
  dropdown:
    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200 ease-out",
  sidebar:
    "transition-[transform,width,opacity] duration-200 ease-out motion-reduce:transition-none",
  sidebarOverlay:
    "transition-opacity duration-200 ease-out motion-reduce:transition-none",
} as const;
