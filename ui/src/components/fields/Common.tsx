import React from "react";
import { Time } from "@daml/types";

import { Field, FieldAttributes, useField } from "formik";

import Select from "react-select";
import DayPicker from "../fields/DayPicker";
import TimePicker from "react-time-picker";
import { Nothing, validateNonEmpty } from "utils";

export type ChoiceErrorsType = { [_: string]: string | undefined };

type NothingProps = typeof Nothing;

// default field
export const LField: React.FC<
  FieldAttributes<any> & {
    label: string;
    errors?: ChoiceErrorsType;
  }
> = ({ errors, label, ...props }) => {
  const error = errors?.[props?.name];
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

// default select field
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
  const [field, , { setValue }] = useField<string | NothingProps>(name);
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

// Component Day Time picker
export const DayTimePickerField: React.FC<{
  name: string;
  errors?: ChoiceErrorsType;
}> = ({ name, errors }) => {
  const [field, , { setValue }] = useField<Time | NothingProps>(name);
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

export const RenderError: React.FC<{ error: string | undefined }> = ({
  error,
}) => <>{error && <div className="text-sm text-red-800">{error}</div>}</>;
