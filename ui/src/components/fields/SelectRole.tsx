import React from "react";
import { ArrowRight } from "phosphor-react";

const roles = [
  {
    label: "Primary Care Provider",
    username: "PrimaryCareProvider",
  },
  {
    label: "Radiologist",
    username: "Radiologist",
  },
  {
    label: "Insurance Company",
    username: "InsuranceCompany",
  },
  {
    label: "Patient",
    username: "Patient1",
  },
];

const SelectRole: React.FC<{ handleLogin: Function }> = ({ handleLogin }) => (
  <>
    <div className="text-2xl text-center text-gray-600">Select a User Role</div>
    <div className="text-sm text-center text-trueGray-500">
      User roles allow you to access features unique to each party in a health
      care system.
    </div>
    <div className="flex flex-col space-y-4">
      {roles.map(({ label, username }) => (
        <button
          className="flex flex-row justify-between items-center rounded h-10 p-4 bg-trueGray-100 border-trueGray-100 focus:bg-blue focus:text-white hover:bg-white hover:border-blue border-2 text-sm text-gray-600"
          onClick={handleLogin(username)}
          key={username}
        >
          {label}
          <ArrowRight size={21} color="var(--blue)" />
        </button>
      ))}
    </div>
  </>
);

export default SelectRole;
