import React, { Dispatch, SetStateAction } from "react";
import ReactModal from "react-modal";
import { X } from "phosphor-react";

type Props = {
  hasCloseButton: boolean;
  active: boolean;
  setActive: Dispatch<SetStateAction<boolean>>;
};

const Modal: React.FC<Props> = ({
  active,
  setActive,
  hasCloseButton,
  children,
}) => {
  const styles = {
    overlay: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      inset: "unset",
    },
  };

  return (
    <ReactModal
      isOpen={active}
      onRequestClose={() => setActive(false)}
      contentLabel="Example Modal"
      style={styles}
      appElement={document.getElementById("root") || undefined}
    >
      {hasCloseButton && (
        <div className="flex flex-auto flex-row-reverse">
          <button onClick={() => setActive(false)}>
            <X size="20px" color="var(--blue)" weight="bold" />
          </button>
        </div>
      )}
      {children}
    </ReactModal>
  );
};

export default Modal;
