import React from "react";
import { NavLink } from "react-router-dom";
import dateFormat from "dateformat";

type FieldProps = { label: string; value: string };

export const formatDate = (d: Date) => dateFormat(d, "ddd, mmm d, yyyy");

const TabLink: React.FC<{ to: string }> = ({ children, to }) => {
  return (
    <NavLink
      exact
      to={to}
      className="text-sm px-2 py-1 text-blue"
      activeStyle={{
        background: "white",
        color: "black",
      }}
    >
      {children}
    </NavLink>
  );
};

const PageTitleDiv: React.FC<{}> = ({ children }) => {
  return <div className="flex items-baseline space-x-4 p-6"> {children} </div>;
};

const PageTitleSpan: React.FC<{ title: string }> = ({ title }) => {
  return <span className="text-3xl text-trueGray-700"> {title} </span>;
};

const PageSubTitleSpan: React.FC<{ title: string }> = ({ title }) => {
  return <span className="text-trueGray-500 text-sm"> {title} </span>;
};

const FieldsRow: React.FC<{ fields: FieldProps[] }> = ({ fields }) => {
  return (
    <div className="flex space-x-12">
      {fields.map((f) => (
        <Field label={f.label} value={f.value} key={f.label} />
      ))}
    </div>
  );
};

const Field: React.FC<FieldProps> = ({ label, value }) => {
  return (
    <div className="flex flex-col">
      <div className="text-sm text-trueGray-500">{label}</div>
      <div className="text-base">{value}</div>
    </div>
  );
};

const Label: React.FC<{ content: string }> = ({ content }) => {
  return <div className="text-sm text-center text-trueGray-500">{content}</div>;
};

const Message: React.FC<{ title: string; content: string }> = ({
  title,
  content,
}) => {
  return (
    <div className="flex flex-col space-y-6">
      <div className="text-2xl text-center">{title}</div>
      <Label content={content} />
    </div>
  );
};

export {
  Field,
  FieldsRow,
  Label,
  Message,
  PageTitleDiv,
  PageTitleSpan,
  PageSubTitleSpan,
  TabLink,
};
