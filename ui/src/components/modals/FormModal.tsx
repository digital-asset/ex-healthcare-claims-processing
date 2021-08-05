import React, { SetStateAction } from "react";
import { Choice, ContractId } from "@daml/types";
import { Event as DEvent } from "@daml/ledger";
import { useLedger } from "@daml/react";
import FormikMod, { Formik, Form, FormikHelpers } from "formik";
import { Check, X } from "phosphor-react";
import Modal from "./ModalLayout";
import { Nothing } from "utils";

// eslint-disable-next-line @typescript-eslint/no-redeclare
type Nothing = typeof Nothing;

/// Each field is made optional without edge cases, provided nothing else uses `Nothing`.
type PartialMaybe<T> = {
  [P in keyof T]: T[P] | Nothing;
};

function complete<T>(i: PartialMaybe<T>): T | undefined {
  for (const [, value] of Object.entries(i)) {
    if (value === Nothing) {
      return undefined;
    }
  }
  return i as T;
}

export const SuccessTag = Symbol("Success");
// eslint-disable-next-line @typescript-eslint/no-redeclare
type SuccessTag = typeof SuccessTag;

interface Success<C, R> {
  tag: SuccessTag;
  sentS: C;
  rv: [R, DEvent<object>[]];
}

export const FailureTag = Symbol("Failure");
// eslint-disable-next-line @typescript-eslint/no-redeclare
type FailureTag = typeof FailureTag;

interface Failure<C> {
  tag: FailureTag;
  sentF: C;
  error: any;
}

export const SubmitButton: React.FC<{
  submitTitle: string;
  isSubmitting: boolean;
}> = ({ submitTitle, isSubmitting }) => (
  <button
    type="submit"
    disabled={isSubmitting}
    className={
      "flex justify-center items-center space-x-2 px-6 py-3 rounded-lg border-black border-2 bg-blue text-white"
    }
  >
    {submitTitle}
  </button>
);
type MaybeSuccessOrFailure<C, R> = Nothing | Success<C, R> | Failure<C>;

type FormModalProps<T extends object, C, R, K> = {
  choice: Choice<T, C, R, K>;
  contract: ContractId<T>;
  submitTitle: string;
  buttonTitle: string;
  icon?: React.ReactNode;
  initialValues: PartialMaybe<C>;
  className?: string;
  successWidget?: (succ: Success<C, R>, close: () => void) => React.ReactNode;
  failureWidget?: (fail: Failure<C>, close: () => void) => React.ReactNode;
  disabled?: boolean;
  children:
    | React.ReactNode
    | ((_: {
        errors: FormikMod.FormikErrors<PartialMaybe<C>>;
        touched: FormikMod.FormikTouched<PartialMaybe<C>>;
      }) => React.ReactNode);
};

/**
 * High adaptable component to display a Form
 * Main params explained:
 *  choice: the object path to exercise in the ledger
 *  contract: the contract id used to exercise a contract in the ledger
 *  children: react component OR function accepting two params (see type declaration)
 *  initialValues: initial value of the form (key value object)
 */
export function FormModal<T extends object, C, R, K>({
  choice,
  contract,
  submitTitle,
  buttonTitle,
  initialValues,
  icon,
  className,
  successWidget,
  failureWidget,
  disabled = false,
  children,
}: FormModalProps<T, C, R, K>) {
  const [modalActive, setModalActiveInner] = React.useState(false);
  const [successOrFailure, setSuccessOrFailure] =
    React.useState<MaybeSuccessOrFailure<C, R>>(Nothing);

  const setModalActive = (s: SetStateAction<boolean>) => {
    setModalActiveInner((p: boolean) => {
      const shown = typeof s === "function" ? s(p) : s;
      if (!shown && successOrFailure !== Nothing) setSuccessOrFailure(Nothing);
      return shown;
    });
  };

  const ledger = useLedger();
  let submitF = (
    values: PartialMaybe<C>,
    { setSubmitting }: FormikHelpers<PartialMaybe<C>>
  ) => {
    const arg = complete(values);
    if (arg) {
      const success = (a: [R, DEvent<object>[]]) => {
        setSuccessOrFailure({ tag: SuccessTag, sentS: arg, rv: a });
      };
      const failure = (f: any) => {
        console.log(f);
        setSuccessOrFailure({ tag: FailureTag, sentF: arg, error: f });
      };

      ledger.exercise(choice, contract, arg).then(success, failure);
    } else {
      console.log("Incomplete Parameters");
      // unless we do this then the "isSubmitting" property will be "true",
      //  which results in the Submit button being disabled.
      setSubmitting(false);
    }
  };
  var content;
  if (successOrFailure !== Nothing) {
    switch (successOrFailure.tag) {
      case SuccessTag: {
        content = (
          <div className="w-170 py-24 space-y-8 flex justify-center items-center flex-col text-center">
            <div className="rounded-full bg-green-100 h-12 w-12 flex">
              <Check className="m-auto" size="24" weight="bold" />
            </div>
            {successWidget ? (
              successWidget(successOrFailure, () => setModalActive(false))
            ) : (
              <> Success </>
            )}
          </div>
        );
        break;
      }
      case FailureTag: {
        content = (
          <div className="w-170 py-24 space-y-8 flex justify-center items-center flex-col text-center">
            <div className="rounded-full bg-red-100 h-12 w-12 flex">
              <X className="m-auto" size="24" weight="bold" />
            </div>
            {failureWidget ? (
              failureWidget(successOrFailure, () => setModalActive(false))
            ) : (
              <>
                <h3> Could not {submitTitle} </h3>
                <p>{successOrFailure.error.errors}</p>
              </>
            )}
          </div>
        );
        break;
      }
    }
  } else {
    content = (
      <Formik
        initialValues={initialValues}
        onSubmit={submitF}
        validateOnChange={false}
        validateOnBlur={false}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className={className}>
            {typeof children === "function"
              ? children({ errors, touched })
              : children}
            <div className="flex justify-center align-center">
              <SubmitButton
                submitTitle={submitTitle}
                isSubmitting={isSubmitting}
              />
            </div>
          </Form>
        )}
      </Formik>
    );
  }
  return (
    <>
      <button
        disabled={disabled}
        onClick={() => setModalActive(true)}
        className={`flex disabled:opacity-50 ${
          disabled ? "cursor-not-allowed" : ""
        } justify-center items-center space-x-2 px-4 py-2 rounded-lg border-black border-2 bg-blue text-white`}
      >
        {icon}
        <div> {buttonTitle} </div>
      </button>
      <Modal
        active={modalActive}
        setActive={setModalActive}
        hasCloseButton={true}
      >
        {content}
      </Modal>
    </>
  );
}
