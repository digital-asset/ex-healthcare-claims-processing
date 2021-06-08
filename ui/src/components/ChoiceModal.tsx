import React, { SetStateAction } from "react";
import { Choice, ContractId, Time } from "@daml/types";
import { Event as DEvent, CreateEvent } from "@daml/ledger";
import { useLedger } from "@daml/react";

import FormikMod, {
  Formik,
  Form,
  Field,
  FormikHelpers,
  FieldAttributes,
  useField,
} from "formik";
import { ArrowRight, Check, X } from "phosphor-react";
import { Link } from "react-router-dom";
import Select from "react-select";
import Modal from "./Modal";
import DayPicker from "./DayPicker";
import TimePicker from "react-time-picker";

export const Nothing = Symbol("Nothing");
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

type ChoiceModalProps<T extends object, C, R, K> = {
  choice: Choice<T, C, R, K>;
  contract: ContractId<T>;
  submitTitle: string;
  buttonTitle: string;
  icon?: React.ReactNode;
  initialValues: PartialMaybe<C>;
  className?: string;
  successWidget?: (succ: Success<C, R>, close: () => void) => React.ReactNode;
  failureWidget?: (fail: Failure<C>, close: () => void) => React.ReactNode;
  children:
    | React.ReactNode
    | ((_: {
        errors: FormikMod.FormikErrors<PartialMaybe<C>>;
        touched: FormikMod.FormikTouched<PartialMaybe<C>>;
      }) => React.ReactNode);
};

type MaybeSuccessOrFailure<C, R> = Nothing | Success<C, R> | Failure<C>;

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

export function ChoiceModal<T extends object, C, R, K>({
  choice,
  contract,
  submitTitle,
  buttonTitle,
  initialValues,
  icon,
  className,
  successWidget,
  failureWidget,
  children,
}: ChoiceModalProps<T, C, R, K>) {
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
    console.log("Exercising option: " + choice);
    console.log(values);
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
      <Formik initialValues={initialValues} onSubmit={submitF}>
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
        onClick={() => setModalActive(true)}
        className="flex justify-center items-center space-x-2 px-4 py-2 rounded-lg border-black border-2 bg-blue text-white"
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

export type ChoiceErrorsType = { [_: string]: string | undefined };

export const validateNonEmpty = (label: string) => (a: any) => {
  let error;
  if (a === Nothing) {
    error = `${label} is required`;
  }
  return error;
};

export const RenderError: React.FC<{ error: string | undefined }> = ({
  error,
}) => <>{error && <div className="text-sm text-red-800">{error}</div>}</>;

export const LField: React.FC<
  FieldAttributes<any> & {
    label: string;
    errors?: ChoiceErrorsType;
  }
> = ({ errors, label, ...props }) => {
  const error = errors?.[props.name];
  return (
    <div className="">
      <label htmlFor={props.name} className="block label-sm ">
        {label}
      </label>
      <Field
        {...props}
        className="bg-trueGray-100 h-11 rounded w-full"
        validate={validateNonEmpty(label)}
      />
      <RenderError error={error} />
    </div>
  );
};

export const EField: React.FC<{
  name: string;
  e: any;
  label: string;
  errors?: ChoiceErrorsType;
}> = ({ name, e, label, errors }) => {
  const [, , helpers] = useField({
    name,
    validate: validateNonEmpty(label),
  });
  const { setValue } = helpers;
  const error = errors?.[name];
  return (
    <div className="flow flow-col">
      <label htmlFor={name} className="block label-sm">
        {label}
      </label>
      <Select
        cla1ssNamePrefix="react-select-modal-enum"
        multi={false}
        options={e.keys.map((a: string) => ({ value: a, label: a }))}
        onChange={(option) => setValue(option?.value)}
        styles={{
          singleValue: () => ({ textOverflow: "ellipsis", maxWidth: "10em" }),
        }}
        validate={undefined}
      />
      <RenderError error={error} />
    </div>
  );
};

export const DayPickerField: React.FC<{
  name: string;
  errors?: ChoiceErrorsType;
}> = ({ name, errors }) => {
  const [field, , { setValue }] = useField<string | Nothing>(name);
  const error = errors?.[name];
  return (
    <>
      <DayPicker
        date={
          field.value === Nothing
            ? new Date()
            : new Date(field.value + "T00:10:00")
        }
        setDate={(d) => setValue(d.toISOString().split("T")[0])}
        theme={{ blue: "var(--blue)" }}
      />
      <RenderError error={error} />
    </>
  );
};

// convert a JavaScript "Date" value into a DAML-backend "Time" value
const dateToTime = (d: Date): Time => d.toISOString();

export const DayTimePickerField: React.FC<{
  name: string;
  errors?: ChoiceErrorsType;
}> = ({ name, errors }) => {
  const [field, , { setValue }] = useField<Time | Nothing>(name);
  if (field.value === Nothing) {
    // can't help but render some picked date, so might as well set it
    const f = new Date();
    console.log("default combined", f);
    setValue(dateToTime(f));
  }
  const defaultField =
    field.value === Nothing ? new Date() : new Date(field.value);
  let date = new Date(
    defaultField.getFullYear(),
    defaultField.getMonth(),
    defaultField.getDate()
  );
  let time = new Date(
    0,
    0,
    0,
    defaultField.getHours(),
    defaultField.getMinutes(),
    defaultField.getSeconds()
  );
  const updateField = () => {
    const f = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds()
    );
    console.log("new combined", f);
    setValue(dateToTime(f));
  };
  const error = errors?.[name];
  return (
    <>
      <DayPicker
        date={date}
        setDate={(d) => {
          console.log("new date", d);
          date = d;
          updateField();
        }}
        theme={{ blue: "var(--blue)" }}
      />
      <TimePicker
        onChange={(t) => {
          console.log("new time", t);
          if (t instanceof Date) {
            time = t;
          } else {
            const [hours, minutes] = t.split(":");
            time = new Date(0, 0, 0, parseInt(hours), parseInt(minutes));
          }
          updateField();
        }}
        value={time}
      />
      <RenderError error={error} />
    </>
  );
};

export const creations: (_: DEvent<object>[]) => CreateEvent<object>[] = (
  evts
) => evts.flatMap((a) => ("created" in a ? [a.created] : []));

export const FollowUp: React.FC<{ to: string; label: string }> = ({
  to,
  label,
}) => {
  return (
    <Link
      to={to}
      className="flex flex-row space-between items-center space-x-2 text-blue"
    >
      {label}
      <ArrowRight />
    </Link>
  );
};
