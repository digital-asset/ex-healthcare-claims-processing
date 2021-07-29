import Profile from "../views/Profile";

import Patient from "../views/patients/Patient";
import Patients from "../views/patients/Patients";

import Referral from "../views/referrals/Referral";
import Referrals from "../views/referrals/Referrals";

import Bill from "../views/bills/Bill";
import Bills from "../views/bills/Bills";

import Appointment from "../views/appointments/Appointment";
import Appointments from "../views/appointments/Appointments";

import Treatment from "../views/treatments/Treatment";
import Treatments from "../views/treatments/Treatments";

import Claim from "../views/claims/Claim";
import Claims from "../views/claims/Claims";

/** Configs for all main */
export const routes = [
  //general entry route
  {
    to: "/",
    exact: true,
    roles: ["Patient1", "PrimaryCareProvider", "Radiologist"],
    view: (props) => <Profile {...props} />,
  },

  //patient routes
  {
    to: "/provider/patients",
    roles: ["PrimaryCareProvider", "Radiologist"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: (props) => <Patients {...props} />,
      },
      {
        to: "/:patientId",
        exact: false,
        view: (props) => <Patient {...props} />,
      },
    ],
  },

  //referral routes
  {
    to: "/provider/referrals",
    roles: ["PrimaryCareProvider", "Radiologist"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: (props) => <Referrals {...props} />,
      },
      {
        to: "/:referralId",
        exact: true,
        view: (props) => <Referral {...props} />,
      },
    ],
  },

  // treatment routes
  {
    to: "/provider/treatments",
    roles: ["Patient1", "Radiologist"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: (props) => <Treatments {...props} />,
      },
      {
        to: "/:treatmentId",
        exact: true,
        view: (props) => <Treatment {...props} />,
      },
    ],
  },

  // bill routes
  {
    to: "/patient/bills",
    roles: ["Patient1"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: (props) => <Bills {...props} />,
      },
      {
        to: "/:billId",
        exact: true,
        view: (props) => <Bill {...props} />,
      },
    ],
  },

  // claim routes
  {
    to: "/provider/claims",
    roles: ["Radiologist", "InsuranceCompany"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: (props) => <Claims {...props} />,
      },
      {
        to: "/:claimId",
        exact: true,
        view: (props) => <Claim {...props} />,
      },
    ],
  },

  // appointment routes
  {
    to: "/provider/appointments",
    roles: ["Radiologist", "Patient1"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: (props) => <Appointments {...props} />,
      },
      {
        to: "/:appointmentId",
        exact: true,
        view: (props) => <Appointment {...props} />,
      },
    ],
  },
];
